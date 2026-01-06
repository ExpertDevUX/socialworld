import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActionType = 
  | 'role_assigned' 
  | 'role_removed' 
  | 'user_banned' 
  | 'post_deleted' 
  | 'ad_created' 
  | 'ad_updated' 
  | 'ad_deleted'
  | 'bulk_role_assigned'
  | 'bulk_role_removed';

export type TargetType = 'user' | 'post' | 'advertisement' | 'multiple';

export interface ActivityLog {
  id: string;
  admin_id: string;
  action_type: ActionType;
  target_type: TargetType;
  target_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

export function useActivityLogs() {
  return useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}

export function useLogActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      actionType,
      targetType,
      targetId,
      details,
    }: {
      actionType: ActionType;
      targetType: TargetType;
      targetId?: string;
      details?: Record<string, any>;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          admin_id: user.id,
          action_type: actionType,
          target_type: targetType,
          target_id: targetId || null,
          details: details || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}
