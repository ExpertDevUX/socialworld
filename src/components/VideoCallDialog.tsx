import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAgoraCall } from '@/hooks/useAgoraCall';

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
  isVideoCall: boolean;
}

const VideoCallDialog = ({
  open,
  onOpenChange,
  channelName,
  isVideoCall,
}: VideoCallDialogProps) => {
  const { t } = useTranslation();
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const {
    callState,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    getLocalVideoTrack,
  } = useAgoraCall();

  // Join call when dialog opens
  useEffect(() => {
    if (open && channelName && !callState.isInCall && !callState.isConnecting) {
      joinCall(channelName, isVideoCall);
    }
  }, [open, channelName, isVideoCall, callState.isInCall, callState.isConnecting, joinCall]);

  // Render local video
  useEffect(() => {
    if (callState.isInCall && localVideoRef.current && isVideoCall) {
      const localTrack = getLocalVideoTrack();
      if (localTrack) {
        localTrack.play(localVideoRef.current);
      }
    }
  }, [callState.isInCall, isVideoCall, getLocalVideoTrack]);

  // Render remote videos
  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteUsers.length > 0) {
      const firstRemoteUser = callState.remoteUsers[0];
      if (firstRemoteUser.videoTrack) {
        firstRemoteUser.videoTrack.play(remoteVideoRef.current);
      }
    }
  }, [callState.remoteUsers]);

  const handleEndCall = async () => {
    await leaveCall();
    onOpenChange(false);
  };

  const handleClose = () => {
    if (callState.isInCall) {
      handleEndCall();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{isVideoCall ? t('chat.videoCall') : t('chat.voiceCall')}</span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-muted aspect-video">
          {/* Remote video (main) */}
          <div
            ref={remoteVideoRef}
            className="w-full h-full bg-muted flex items-center justify-center"
          >
            {callState.remoteUsers.length === 0 && (
              <div className="text-muted-foreground text-center">
                {callState.isConnecting ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    <p>{t('chat.connecting')}</p>
                  </div>
                ) : (
                  <p>{t('chat.waitingForParticipants')}</p>
                )}
              </div>
            )}
          </div>

          {/* Local video (picture-in-picture) */}
          {isVideoCall && callState.isInCall && (
            <div
              ref={localVideoRef}
              className="absolute bottom-4 right-4 w-32 h-24 bg-background rounded-lg overflow-hidden border-2 border-border shadow-lg"
            />
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex items-center justify-center gap-4 bg-background">
          <Button
            variant={callState.isMuted ? "destructive" : "secondary"}
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={toggleMute}
            disabled={!callState.isInCall}
          >
            {callState.isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {isVideoCall && (
            <Button
              variant={callState.isVideoOff ? "destructive" : "secondary"}
              size="icon"
              className="w-12 h-12 rounded-full"
              onClick={toggleVideo}
              disabled={!callState.isInCall}
            >
              {callState.isVideoOff ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <Video className="w-5 h-5" />
              )}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallDialog;
