import { Circle, Moon, MinusCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

const statusOptions = [
  { value: 'online', label: 'Online', color: 'bg-green-500', icon: Circle },
  { value: 'away', label: 'Away', color: 'bg-yellow-500', icon: Moon },
  { value: 'busy', label: 'Busy', color: 'bg-red-500', icon: MinusCircle },
  { value: 'offline', label: 'Appear Offline', color: 'bg-gray-500', icon: XCircle },
];

interface StatusSelectorProps {
  onProfileClick?: () => void;
}

const StatusSelector = ({ onProfileClick }: StatusSelectorProps) => {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const currentStatus = statusOptions.find(s => s.value === profile?.status) || statusOptions[0];

  const handleStatusChange = async (status: string) => {
    try {
      await updateProfile.mutateAsync({ status });
      toast({
        title: 'Status updated',
        description: `You are now ${status}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-500';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative focus:outline-none group" onClick={(e) => e.stopPropagation()}>
          <Avatar className="w-10 h-10 bg-primary cursor-pointer ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {profile?.display_name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span 
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-sidebar ${getStatusColor(profile?.status)} cursor-pointer`}
            title={`Status: ${currentStatus.label}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-sidebar border-sidebar-border">
        <div className="px-3 py-2 border-b border-sidebar-border">
          <p className="font-medium text-sidebar-foreground truncate">{profile?.display_name}</p>
          <p className="text-xs text-muted-foreground">@{profile?.username}</p>
        </div>
        
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className={`flex items-center gap-3 cursor-pointer ${
              currentStatus.value === status.value ? 'bg-primary/10' : ''
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${status.color}`} />
            <span className="text-sidebar-foreground">{status.label}</span>
            {currentStatus.value === status.value && (
              <span className="ml-auto text-primary text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}

        {onProfileClick && (
          <>
            <div className="border-t border-sidebar-border my-1" />
            <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
              <span className="text-sidebar-foreground">View Profile</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusSelector;
