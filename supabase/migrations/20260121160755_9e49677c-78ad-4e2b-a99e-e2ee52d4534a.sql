-- Fix the SECURITY DEFINER view warning by making it SECURITY INVOKER
ALTER VIEW public.questions_public SET (security_invoker = true);