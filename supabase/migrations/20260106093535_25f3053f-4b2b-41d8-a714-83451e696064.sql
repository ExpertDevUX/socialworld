-- Enable realtime for profiles table to track status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;