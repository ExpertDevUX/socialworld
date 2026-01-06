import { useState, useCallback, useRef, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  UID,
} from 'agora-rtc-sdk-ng';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
}

export const useAgoraCall = () => {
  const { toast } = useToast();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isConnecting: false,
    isMuted: false,
    isVideoOff: false,
    remoteUsers: [],
  });

  // Initialize the client
  const initClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      });
      
      // Set up event listeners
      clientRef.current.on('user-published', async (user, mediaType) => {
        await clientRef.current?.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          setCallState(prev => ({
            ...prev,
            remoteUsers: [...prev.remoteUsers.filter(u => u.uid !== user.uid), user]
          }));
        }
        
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      clientRef.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setCallState(prev => ({
            ...prev,
            remoteUsers: prev.remoteUsers.map(u => 
              u.uid === user.uid ? user : u
            )
          }));
        }
      });

      clientRef.current.on('user-left', (user) => {
        setCallState(prev => ({
          ...prev,
          remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid)
        }));
      });
    }
    return clientRef.current;
  }, []);

  // Get token from edge function
  const getToken = async (channelName: string, uid: number) => {
    const { data, error } = await supabase.functions.invoke('agora-token', {
      body: { channelName, uid, role: 'publisher' }
    });
    
    if (error) throw new Error('Failed to get token');
    return data;
  };

  // Join a call
  const joinCall = useCallback(async (channelName: string, enableVideo = true) => {
    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));
      
      const client = initClient();
      const uid = Math.floor(Math.random() * 1000000);
      
      // Get token
      const { token, appId } = await getToken(channelName, uid);
      
      // Join the channel
      await client.join(appId, channelName, token, uid);
      
      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: 'speech_low_quality' },
        { 
          encoderConfig: { 
            width: 640, 
            height: 480, 
            frameRate: 24, 
            bitrateMax: 600 
          } 
        }
      );
      
      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;
      
      if (enableVideo) {
        await client.publish([audioTrack, videoTrack]);
      } else {
        await client.publish([audioTrack]);
        videoTrack.setEnabled(false);
      }
      
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isConnecting: false,
        isVideoOff: !enableVideo,
      }));
      
      toast({
        title: "Connected",
        description: "You've joined the call",
      });
      
    } catch (error) {
      console.error('Failed to join call:', error);
      setCallState(prev => ({ ...prev, isConnecting: false }));
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Could not join the call",
        variant: "destructive",
      });
    }
  }, [initClient, toast]);

  // Leave the call
  const leaveCall = useCallback(async () => {
    try {
      // Stop and close local tracks
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current = null;
      localVideoTrackRef.current = null;
      
      // Leave the channel
      await clientRef.current?.leave();
      
      setCallState({
        isInCall: false,
        isConnecting: false,
        isMuted: false,
        isVideoOff: false,
        remoteUsers: [],
      });
      
      toast({
        title: "Disconnected",
        description: "You've left the call",
      });
      
    } catch (error) {
      console.error('Failed to leave call:', error);
    }
  }, [toast]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (localAudioTrackRef.current) {
      const newMutedState = !callState.isMuted;
      await localAudioTrackRef.current.setEnabled(!newMutedState);
      setCallState(prev => ({ ...prev, isMuted: newMutedState }));
    }
  }, [callState.isMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localVideoTrackRef.current) {
      const newVideoOffState = !callState.isVideoOff;
      await localVideoTrackRef.current.setEnabled(!newVideoOffState);
      setCallState(prev => ({ ...prev, isVideoOff: newVideoOffState }));
    }
  }, [callState.isVideoOff]);

  // Get local video track for rendering
  const getLocalVideoTrack = useCallback(() => {
    return localVideoTrackRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.close();
      clientRef.current?.leave();
    };
  }, []);

  return {
    callState,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    getLocalVideoTrack,
  };
};
