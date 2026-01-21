import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting (per-instance, resets on function cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const limit = rateLimits.get(identifier);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Escape LIKE pattern special characters to prevent wildcard injection
function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP: 5 attempts per minute
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(`verify:${clientIP}`, 5, 60000)) {
      console.log('Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many verification attempts. Please try again in a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fullName, email, phone } = await req.json();
    
    // Input validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid full name provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!phone || typeof phone !== 'string' || !/^[0-9]{10}$/.test(phone.trim())) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reject inputs containing LIKE wildcards as an additional security measure
    if (fullName.includes('%') || fullName.includes('_') || 
        email.includes('%') || email.includes('_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid characters in name or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying candidate:', { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() });

    // Create Supabase admin client to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find candidate with case-insensitive matching (with escaped patterns)
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('id, full_name, test_status')
      .ilike('full_name', escapeLikePattern(fullName.trim()))
      .ilike('email', escapeLikePattern(email.trim()))
      .eq('phone', phone.trim())
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'An error occurred while verifying' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!candidate) {
      console.log('No candidate found matching the criteria');
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: 'You are not authorized to take the NIOS Admission Test. Please contact the administration.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Candidate found:', { id: candidate.id, status: candidate.test_status });

    // Return only necessary info - not PII
    return new Response(
      JSON.stringify({ 
        found: true, 
        candidateId: candidate.id,
        candidateName: candidate.full_name,
        testStatus: candidate.test_status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-candidate function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
