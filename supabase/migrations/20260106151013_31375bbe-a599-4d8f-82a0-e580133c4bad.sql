-- Drop conflicting/duplicate policies on conversation_participants
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can leave conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can update their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- Create clean, non-conflicting policies
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Authenticated users can add conversation participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own participation"
ON public.conversation_participants
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can leave own conversations"
ON public.conversation_participants
FOR DELETE
USING (user_id = auth.uid());