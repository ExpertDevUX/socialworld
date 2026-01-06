-- Allow admins to delete any posts for content management
CREATE POLICY "Admins can delete any posts"
ON public.posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any posts for content management
CREATE POLICY "Admins can update any posts"
ON public.posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all user roles (already exists, but ensure it works)
-- This is already covered by the existing SELECT policy