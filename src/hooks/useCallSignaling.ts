import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CallSignal {
  type: 'call_start' | 'call_end' | 'call_accepted' | 'call_declined';
  callerId: string;
  callerName: string;
  channelName: string;
  isVideoCall: boolean;
  timestamp: number;
}

export interface IncomingCall {
  callerId: string;
  callerName: string;
  channelName: string;
  isVideoCall: boolean;
}

export const useCallSignaling = (conversationId: string | null) => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Set up realtime channel for call signaling
  useEffect(() => {
    if (!conversationId || !user) return;

    const callChannel = supabase.channel(`call:${conversationId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    callChannel
      .on('broadcast', { event: 'call_signal' }, ({ payload }) => {
        const signal = payload as CallSignal;
        
        // Don't process our own signals
        if (signal.callerId === user.id) return;

        console.log('Received call signal:', signal);

        switch (signal.type) {
          case 'call_start':
            setIncomingCall({
              callerId: signal.callerId,
              callerName: signal.callerName,
              channelName: signal.channelName,
              isVideoCall: signal.isVideoCall,
            });
            break;
          case 'call_end':
          case 'call_declined':
            setIncomingCall(null);
            break;
        }
      })
      .subscribe();

    setChannel(callChannel);

    return () => {
      supabase.removeChannel(callChannel);
    };
  }, [conversationId, user]);

  // Broadcast a call signal
  const sendSignal = useCallback(
    async (signal: Omit<CallSignal, 'timestamp'>) => {
      if (!channel) return;

      await channel.send({
        type: 'broadcast',
        event: 'call_signal',
        payload: {
          ...signal,
          timestamp: Date.now(),
        },
      });
    },
    [channel]
  );

  // Start a call
  const startCall = useCallback(
    async (callerName: string, isVideoCall: boolean) => {
      if (!conversationId || !user) return;

      await sendSignal({
        type: 'call_start',
        callerId: user.id,
        callerName,
        channelName: conversationId,
        isVideoCall,
      });
    },
    [conversationId, user, sendSignal]
  );

  // End a call
  const endCall = useCallback(
    async (callerName: string) => {
      if (!conversationId || !user) return;

      await sendSignal({
        type: 'call_end',
        callerId: user.id,
        callerName,
        channelName: conversationId,
        isVideoCall: false,
      });
    },
    [conversationId, user, sendSignal]
  );

  // Accept incoming call
  const acceptCall = useCallback(() => {
    const call = incomingCall;
    setIncomingCall(null);
    return call;
  }, [incomingCall]);

  // Decline incoming call
  const declineCall = useCallback(
    async (callerName: string) => {
      if (!conversationId || !user) return;

      await sendSignal({
        type: 'call_declined',
        callerId: user.id,
        callerName,
        channelName: conversationId,
        isVideoCall: false,
      });

      setIncomingCall(null);
    },
    [conversationId, user, sendSignal]
  );

  return {
    incomingCall,
    startCall,
    endCall,
    acceptCall,
    declineCall,
  };
};
