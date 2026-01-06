import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useRoles';

export interface AnalyticsData {
  totalUsers: number;
  totalPosts: number;
  totalMessages: number;
  totalConversations: number;
  activeAds: number;
  userGrowth: { date: string; count: number }[];
  postActivity: { date: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
}

export function useAnalytics() {
  const { isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      // Fetch all counts in parallel
      const [
        usersResult,
        postsResult,
        messagesResult,
        conversationsResult,
        adsResult,
        rolesResult,
        recentUsersResult,
        recentPostsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('advertisements').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('user_roles').select('role'),
        supabase.from('profiles').select('created_at').order('created_at', { ascending: true }),
        supabase.from('posts').select('created_at').order('created_at', { ascending: true }),
      ]);

      // Calculate role distribution
      const roleDistribution = [
        { role: 'admin', count: 0 },
        { role: 'moderator', count: 0 },
        { role: 'user', count: 0 },
      ];
      
      if (rolesResult.data) {
        rolesResult.data.forEach((r) => {
          const found = roleDistribution.find((rd) => rd.role === r.role);
          if (found) found.count++;
        });
      }

      // Calculate user growth by date (last 7 days)
      const userGrowth: { date: string; count: number }[] = [];
      const postActivity: { date: string; count: number }[] = [];
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      last7Days.forEach((date) => {
        const userCount = recentUsersResult.data?.filter(
          (u) => u.created_at.startsWith(date)
        ).length || 0;
        userGrowth.push({ date, count: userCount });

        const postCount = recentPostsResult.data?.filter(
          (p) => p.created_at.startsWith(date)
        ).length || 0;
        postActivity.push({ date, count: postCount });
      });

      return {
        totalUsers: usersResult.count || 0,
        totalPosts: postsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalConversations: conversationsResult.count || 0,
        activeAds: adsResult.count || 0,
        userGrowth,
        postActivity,
        roleDistribution,
      };
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
