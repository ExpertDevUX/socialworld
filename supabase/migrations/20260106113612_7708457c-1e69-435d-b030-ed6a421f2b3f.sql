-- Create activity_logs table to track admin actions
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert activity logs
CREATE POLICY "Admins can create activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_admin_id ON public.activity_logs(admin_id);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);