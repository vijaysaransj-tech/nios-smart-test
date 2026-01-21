import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory rate limiting (per-instance, resets on function cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const limit = rateLimits.get(identifier)
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (limit.count >= maxRequests) {
    return false
  }
  
  limit.count++
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Rate limit by IP: 3 attempts per minute
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
    
    if (!checkRateLimit(`create-admin:${clientIP}`, 3, 60000)) {
      console.log('Rate limit exceeded for IP:', clientIP)
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    // SECURITY: Require authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized - no token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create client with caller's auth to verify they are an admin
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify caller's token and get their user
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('Token validation failed:', claimsError)
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const callerUserId = claimsData.claims.sub

    // Create admin client to check roles
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if caller is an admin
    const { data: callerRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUserId)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError) {
      console.error('Error checking caller role:', roleError)
      return new Response(JSON.stringify({ error: 'Failed to verify permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!callerRole) {
      console.warn('Non-admin user attempted to create admin:', callerUserId)
      return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse and validate request body
    const { email, password } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Try to create the user first
    let userId: string | null = null
    
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) {
      // User might already exist, try to find them
      console.log('Create error (might be existing user):', createError.message)
      
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.error('Error listing users:', listError)
        return new Response(JSON.stringify({ error: listError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      const existingUser = users.users.find(u => u.email === email)
      if (existingUser) {
        userId = existingUser.id
        console.log('Found existing user:', userId)
        
        // Update password for existing user
        await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      } else {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      userId = userData.user.id
    }

    // Add admin role (upsert to avoid duplicates)
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })

    if (roleInsertError) {
      console.error('Error adding role:', roleInsertError)
      return new Response(JSON.stringify({ error: roleInsertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Admin user created by:', callerUserId, 'for:', email, userId)
    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
