import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from './useRoles';

export interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  placement: string;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useAdvertisements(placement?: string) {
  return useQuery({
    queryKey: ['advertisements', placement],
    queryFn: async () => {
      let query = supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (placement) {
        query = query.eq('placement', placement);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Advertisement[];
    },
  });
}

export function useAllAdvertisements() {
  const { isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['all-advertisements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Advertisement[];
    },
    enabled: isAdmin,
  });
}

export function useCreateAdvertisement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ad: Partial<Omit<Advertisement, 'id' | 'created_at' | 'updated_at'>> & { title: string }) => {
      const { data, error } = await supabase
        .from('advertisements')
        .insert({
          title: ad.title,
          description: ad.description || null,
          image_url: ad.image_url || null,
          link_url: ad.link_url || null,
          is_active: ad.is_active ?? true,
          placement: ad.placement || 'sidebar',
          priority: ad.priority || 0,
          start_date: ad.start_date || null,
          end_date: ad.end_date || null,
          created_by: ad.created_by || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['all-advertisements'] });
    },
  });
}

export function useUpdateAdvertisement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Advertisement> & { id: string }) => {
      const { data, error } = await supabase
        .from('advertisements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['all-advertisements'] });
    },
  });
}

export function useDeleteAdvertisement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['all-advertisements'] });
    },
  });
}
