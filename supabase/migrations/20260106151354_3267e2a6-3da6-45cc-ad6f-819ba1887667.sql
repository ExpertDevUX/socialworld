-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Authenticated users can add conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can leave own conversations" ON public.conversation_participants;

-- Create a security definer function to check if user is participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
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

-- Create non-recursive RLS policies using the function
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (
  user_id = auth.uid() OR 
  public.is_conversation_participant(auth.uid(), conversation_id)
);

CREATE POLICY "Authenticated users can add participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own participation"
ON public.conversation_participants
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own participation"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());