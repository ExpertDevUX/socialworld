import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, isFavorite }: { conversationId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversation_participants')
        .update({ is_favorite: !isFavorite })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    },
    onError: () => {
      toast.error('Failed to update favorite');
    }
  });
}
