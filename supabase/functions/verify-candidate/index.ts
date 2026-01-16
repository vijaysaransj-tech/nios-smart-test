import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log('Verifying candidate:', { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() });

    // Create Supabase admin client to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find candidate with case-insensitive matching
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('id, full_name, test_status')
      .ilike('full_name', fullName.trim())
      .ilike('email', email.trim())
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
