-- Add RLS policy for inserting conversations (any authenticated user can create)
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add RLS policy for selecting conversations (users can only see conversations they participate in)
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Add RLS policy for updating conversations (participants can update)
CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Add RLS policies for conversation_participants
CREATE POLICY "Authenticated users can add participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants AS cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Participants can update their own participation"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Participants can leave conversations"
ON public.conversation_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());