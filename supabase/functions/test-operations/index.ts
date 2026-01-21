import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateAttemptRequest {
  action: 'create_attempt'
  candidateId: string
  totalQuestions: number
}

interface SaveResponseRequest {
  action: 'save_response'
  attemptId: string
  questionId: string
  selectedAnswer: string | null
  isCorrect: boolean
  timeTaken: number
}

interface CompleteAttemptRequest {
  action: 'complete_attempt'
  attemptId: string
  correctAnswers: number
  incorrectAnswers: number
  totalQuestions: number
}

interface GetAttemptRequest {
  action: 'get_attempt'
  attemptId: string
}

interface GetResponsesRequest {
  action: 'get_responses'
  attemptId: string
}

type RequestBody = CreateAttemptRequest | SaveResponseRequest | CompleteAttemptRequest | GetAttemptRequest | GetResponsesRequest

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()

    // Validate action
    if (!body.action) {
      return new Response(JSON.stringify({ error: 'Action is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use service role to bypass RLS (operations are controlled by this function)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    switch (body.action) {
      case 'create_attempt': {
        const { candidateId, totalQuestions } = body as CreateAttemptRequest

        // Validate inputs
        if (!candidateId || typeof candidateId !== 'string') {
          return new Response(JSON.stringify({ error: 'Valid candidateId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(candidateId)) {
          return new Response(JSON.stringify({ error: 'Invalid candidateId format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (typeof totalQuestions !== 'number' || totalQuestions < 0) {
          return new Response(JSON.stringify({ error: 'Valid totalQuestions is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Verify candidate exists and hasn't already attempted
        const { data: candidate, error: candidateError } = await supabaseAdmin
          .from('candidates')
          .select('id, test_status')
          .eq('id', candidateId)
          .single()

        if (candidateError || !candidate) {
          console.error('Candidate not found:', candidateError)
          return new Response(JSON.stringify({ error: 'Candidate not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (candidate.test_status === 'ATTEMPTED') {
          return new Response(JSON.stringify({ error: 'Candidate has already attempted the test' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create test attempt
        const { data: attempt, error: attemptError } = await supabaseAdmin
          .from('test_attempts')
          .insert([{
            candidate_id: candidateId,
            total_questions: totalQuestions,
            correct_answers: 0,
            incorrect_answers: 0,
            total_score: 0
          }])
          .select()
          .single()

        if (attemptError) {
          console.error('Error creating attempt:', attemptError)
          return new Response(JSON.stringify({ error: 'Failed to create test attempt' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Test attempt created:', attempt.id)
        return new Response(JSON.stringify(attempt), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'save_response': {
        const { attemptId, questionId, selectedAnswer, isCorrect, timeTaken } = body as SaveResponseRequest

        // Validate inputs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        
        if (!attemptId || !uuidRegex.test(attemptId)) {
          return new Response(JSON.stringify({ error: 'Valid attemptId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (!questionId || !uuidRegex.test(questionId)) {
          return new Response(JSON.stringify({ error: 'Valid questionId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (typeof isCorrect !== 'boolean') {
          return new Response(JSON.stringify({ error: 'isCorrect must be a boolean' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (typeof timeTaken !== 'number' || timeTaken < 0) {
          return new Response(JSON.stringify({ error: 'Valid timeTaken is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Validate selectedAnswer if provided
        if (selectedAnswer !== null && !['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
          return new Response(JSON.stringify({ error: 'selectedAnswer must be A, B, C, D, or null' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Verify attempt exists and is not completed
        const { data: attempt, error: attemptError } = await supabaseAdmin
          .from('test_attempts')
          .select('id, completed_at')
          .eq('id', attemptId)
          .single()

        if (attemptError || !attempt) {
          return new Response(JSON.stringify({ error: 'Test attempt not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (attempt.completed_at) {
          return new Response(JSON.stringify({ error: 'Test attempt already completed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Save response
        const { data: response, error: responseError } = await supabaseAdmin
          .from('question_responses')
          .insert([{
            attempt_id: attemptId,
            question_id: questionId,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
            time_taken: timeTaken
          }])
          .select()
          .single()

        if (responseError) {
          console.error('Error saving response:', responseError)
          return new Response(JSON.stringify({ error: 'Failed to save response' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'complete_attempt': {
        const { attemptId, correctAnswers, incorrectAnswers, totalQuestions } = body as CompleteAttemptRequest

        // Validate inputs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        
        if (!attemptId || !uuidRegex.test(attemptId)) {
          return new Response(JSON.stringify({ error: 'Valid attemptId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (typeof correctAnswers !== 'number' || correctAnswers < 0) {
          return new Response(JSON.stringify({ error: 'Valid correctAnswers is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (typeof incorrectAnswers !== 'number' || incorrectAnswers < 0) {
          return new Response(JSON.stringify({ error: 'Valid incorrectAnswers is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (typeof totalQuestions !== 'number' || totalQuestions < 0) {
          return new Response(JSON.stringify({ error: 'Valid totalQuestions is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Verify attempt exists
        const { data: attempt, error: attemptError } = await supabaseAdmin
          .from('test_attempts')
          .select('id, candidate_id, completed_at')
          .eq('id', attemptId)
          .single()

        if (attemptError || !attempt) {
          return new Response(JSON.stringify({ error: 'Test attempt not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (attempt.completed_at) {
          return new Response(JSON.stringify({ error: 'Test attempt already completed' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const totalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

        // Update attempt
        const { data: updatedAttempt, error: updateError } = await supabaseAdmin
          .from('test_attempts')
          .update({
            completed_at: new Date().toISOString(),
            correct_answers: correctAnswers,
            incorrect_answers: incorrectAnswers,
            total_score: totalScore
          })
          .eq('id', attemptId)
          .select()
          .single()

        if (updateError) {
          console.error('Error completing attempt:', updateError)
          return new Response(JSON.stringify({ error: 'Failed to complete test attempt' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Update candidate status
        await supabaseAdmin
          .from('candidates')
          .update({ test_status: 'ATTEMPTED' })
          .eq('id', attempt.candidate_id)

        console.log('Test attempt completed:', attemptId)
        return new Response(JSON.stringify(updatedAttempt), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_attempt': {
        const { attemptId } = body as GetAttemptRequest

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!attemptId || !uuidRegex.test(attemptId)) {
          return new Response(JSON.stringify({ error: 'Valid attemptId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: attempt, error } = await supabaseAdmin
          .from('test_attempts')
          .select('*')
          .eq('id', attemptId)
          .single()

        if (error || !attempt) {
          return new Response(JSON.stringify({ error: 'Test attempt not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(attempt), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_responses': {
        const { attemptId } = body as GetResponsesRequest

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!attemptId || !uuidRegex.test(attemptId)) {
          return new Response(JSON.stringify({ error: 'Valid attemptId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: responses, error } = await supabaseAdmin
          .from('question_responses')
          .select('*')
          .eq('attempt_id', attemptId)

        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to get responses' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(responses || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
