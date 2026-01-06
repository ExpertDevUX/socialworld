-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create advertisements table
CREATE TABLE public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    placement TEXT NOT NULL DEFAULT 'sidebar', -- sidebar, banner, inline
    priority INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on advertisements
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- RLS policies for advertisements
CREATE POLICY "Anyone can view active advertisements"
ON public.advertisements
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage advertisements"
ON public.advertisements
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add show_ads column to profiles table for user preference
ALTER TABLE public.profiles ADD COLUMN show_ads BOOLEAN NOT NULL DEFAULT true;

-- Fix RLS for conversation_participants to allow group creators to add members
-- Drop existing policies that restrict adding participants
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

-- Create new policy that allows users to add participants to conversations they're part of
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM conversation_participants cp 
        WHERE cp.conversation_id = conversation_participants.conversation_id 
        AND cp.user_id = auth.uid()
    )
);

-- Enable realtime for advertisements
ALTER PUBLICATION supabase_realtime ADD TABLE public.advertisements;

-- Create trigger for updated_at on advertisements
CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();