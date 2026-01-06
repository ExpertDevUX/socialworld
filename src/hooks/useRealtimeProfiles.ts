import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './useProfile';

export function useRealtimeProfiles() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updatedProfile = payload.new as Profile;
          
          // Update the profiles list cache
          queryClient.setQueryData<Profile[]>(['profiles'], (oldProfiles) => {
            if (!oldProfiles) return oldProfiles;
            return oldProfiles.map((p) =>
              p.id === updatedProfile.id ? updatedProfile : p
            );
          });

          // Update individual profile cache if it exists
          queryClient.setQueryData<Profile>(
            ['profile', updatedProfile.user_id],
            (oldProfile) => {
              if (!oldProfile) return oldProfile;
              return updatedProfile;
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
