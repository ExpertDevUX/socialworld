import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus, Check, Loader2, Mail, Phone, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllProfiles, Profile } from '@/hooks/useProfile';
import { useFriendships, useSendFriendRequest } from '@/hooks/useFriendships';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface FindFriendsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SearchType = 'username' | 'email' | 'phone';

const FindFriendsDialog = ({ open, onOpenChange }: FindFriendsDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('username');
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  const { data: profiles = [] } = useAllProfiles();
  const { data: friendships = [] } = useFriendships();
  const sendFriendRequest = useSendFriendRequest();

  // Search by email requires looking up auth.users, which we can't do directly
  // So we'll search by username/display_name in profiles, or by phone_number
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['searchUsers', searchQuery, searchType],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];

      let query = supabase.from('profiles').select('*');

      if (searchType === 'username') {
        // Search by username or display name (case-insensitive)
        query = query.or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
      } else if (searchType === 'phone') {
        // Search by phone number
        query = query.ilike('phone_number', `%${searchQuery}%`);
      } else if (searchType === 'email') {
        // For email search, we search by username since emails are not in profiles
        // The user might type their email username part
        const emailPart = searchQuery.split('@')[0];
        query = query.or(`username.ilike.%${emailPart}%,display_name.ilike.%${emailPart}%`);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      return (data as Profile[]).filter(p => p.user_id !== user?.id);
    },
    enabled: open && searchQuery.length >= 2,
  });

  // Get friendship status for a user
  const getFriendshipStatus = (userId: string) => {
    const friendship = friendships.find(
      f => (f.requester_id === userId || f.addressee_id === userId)
    );
    
    if (!friendship) return 'none';
    if (friendship.status === 'accepted') return 'friends';
    if (friendship.status === 'pending') {
      if (friendship.requester_id === user?.id) return 'pending_sent';
      return 'pending_received';
    }
    return 'none';
  };

  const handleSendRequest = async (profile: Profile) => {
    try {
      setPendingRequests(prev => new Set(prev).add(profile.user_id));
      await sendFriendRequest.mutateAsync(profile.user_id);
      toast({
        title: t('profile.requestSent'),
        description: t('profile.requestSentDesc', { name: profile.display_name }),
      });
    } catch (error) {
      console.error('Failed to send friend request:', error);
      toast({
        title: t('common.error'),
        description: t('profile.requestFailed'),
        variant: 'destructive',
      });
    } finally {
      setPendingRequests(prev => {
        const next = new Set(prev);
        next.delete(profile.user_id);
        return next;
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'email': return t('profile.searchByEmail');
      case 'phone': return t('profile.searchByPhone');
      default: return t('profile.searchByUsername');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {t('profile.findFriends')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Type Tabs */}
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as SearchType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="username" className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {t('profile.username')}
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {t('auth.email')}
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {t('settings.phoneNumber')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={getPlaceholder()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('users.noUsersFound')}
              </div>
            )}

            {!isSearching && searchQuery.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('profile.typeToSearch')}
              </div>
            )}

            {searchResults.map((profile) => {
              const status = getFriendshipStatus(profile.user_id);
              const isPending = pendingRequests.has(profile.user_id);

              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {profile.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(
                          profile.status
                        )}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{profile.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    </div>
                  </div>

                  {status === 'friends' ? (
                    <Button variant="outline" size="sm" disabled>
                      <Check className="w-4 h-4 mr-1" />
                      {t('profile.friends')}
                    </Button>
                  ) : status === 'pending_sent' ? (
                    <Button variant="outline" size="sm" disabled>
                      {t('profile.pending')}
                    </Button>
                  ) : status === 'pending_received' ? (
                    <Button variant="secondary" size="sm" disabled>
                      {t('profile.respond')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(profile)}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-1" />
                          {t('profile.addFriend')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindFriendsDialog;
