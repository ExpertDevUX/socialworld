import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, PhoneOff, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { IncomingCall } from '@/hooks/useCallSignaling';

interface IncomingCallDialogProps {
  incomingCall: IncomingCall | null;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallDialog = ({
  incomingCall,
  onAccept,
  onDecline,
}: IncomingCallDialogProps) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone when call comes in
  useEffect(() => {
    if (incomingCall) {
      // Create audio context for ringtone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playRingtone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 440; // A4 note
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        
        return oscillator;
      };

      // Ring pattern: ring, pause, ring, pause...
      let ringInterval: NodeJS.Timeout;
      let isRinging = true;

      const startRinging = () => {
        playRingtone();
        
        ringInterval = setInterval(() => {
          if (isRinging) {
            playRingtone();
            setTimeout(() => {
              if (isRinging) playRingtone();
            }, 250);
          }
        }, 2000);
      };

      startRinging();

      // Cleanup
      return () => {
        isRinging = false;
        clearInterval(ringInterval);
        audioContext.close();
      };
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <Dialog open={!!incomingCall} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[400px] p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Caller Avatar with animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <Avatar className="w-24 h-24 relative z-10 border-4 border-primary/30">
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {incomingCall.callerName?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller info */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground">
              {incomingCall.callerName}
            </h3>
            <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
              {incomingCall.isVideoCall ? (
                <>
                  <Video className="w-4 h-4" />
                  {t('chat.incomingVideoCall')}
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  {t('chat.incomingVoiceCall')}
                </>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-8">
            {/* Decline button */}
            <Button
              variant="destructive"
              size="icon"
              className="w-16 h-16 rounded-full shadow-lg"
              onClick={onDecline}
            >
              <PhoneOff className="w-7 h-7" />
            </Button>

            {/* Accept button */}
            <Button
              size="icon"
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
              onClick={onAccept}
            >
              {incomingCall.isVideoCall ? (
                <Video className="w-7 h-7" />
              ) : (
                <Phone className="w-7 h-7" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
