-- Disable and re-enable RLS to clear any cache issues
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

-- Create fresh policies
CREATE POLICY "conversations_insert_policy"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "conversations_select_policy"
ON public.conversations
FOR SELECT
TO authenticated
USING (public.is_user_in_conversation(auth.uid(), id));

CREATE POLICY "conversations_update_policy"
ON public.conversations
FOR UPDATE
TO authenticated
USING (public.is_user_in_conversation(auth.uid(), id));

-- Also fix conversation_participants INSERT policy
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.conversation_participants;

CREATE POLICY "participants_insert_policy"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);