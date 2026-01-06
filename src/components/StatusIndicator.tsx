import { Circle, Moon, MinusCircle, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusIndicatorProps {
  status: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
}

const statusConfig = {
  online: { label: 'Online', color: 'bg-green-500', icon: Circle },
  away: { label: 'Away', color: 'bg-yellow-500', icon: Moon },
  busy: { label: 'Busy', color: 'bg-red-500', icon: MinusCircle },
  offline: { label: 'Offline', color: 'bg-gray-500', icon: XCircle },
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const StatusIndicator = ({ 
  status, 
  size = 'md', 
  showIcon = false,
  showTooltip = true 
}: StatusIndicatorProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
  const Icon = config.icon;

  const indicator = showIcon ? (
    <div className={`flex items-center gap-1`}>
      <span className={`${sizeClasses[size]} rounded-full ${config.color}`} />
      <Icon className={`${iconSizes[size]} ${config.color.replace('bg-', 'text-').replace('-500', '-600')}`} />
    </div>
  ) : (
    <span className={`${sizeClasses[size]} rounded-full ${config.color} block`} />
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {indicator}
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-sidebar border-sidebar-border">
        <p className="text-sidebar-foreground">{config.label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default StatusIndicator;
