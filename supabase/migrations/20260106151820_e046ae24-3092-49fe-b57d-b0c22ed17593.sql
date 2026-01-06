-- Drop all existing policies on conversations
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

-- Create a security definer function to check if user is in conversation
CREATE OR REPLACE FUNCTION public.is_user_in_conversation(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

-- Create clean RLS policies for conversations using the security definer function
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (public.is_user_in_conversation(auth.uid(), id));

CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
USING (public.is_user_in_conversation(auth.uid(), id));