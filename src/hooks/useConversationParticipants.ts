import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  is_favorite: boolean | null;
}

export function useConversationParticipants(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation-participants', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId);

      if (error) throw error;
      return data as ConversationParticipant[];
    },
    enabled: !!conversationId,
  });
}
