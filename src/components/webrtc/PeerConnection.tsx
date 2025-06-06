import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWebRTC } from '@/contexts/WebRTCContext';
import { supabase } from '@/lib/supabase';

type PeerConnectionProps = {
  roomId: string;
  userId: string;
  peerId: string;
  isReader: boolean;
};

export const PeerConnection: React.FC<PeerConnectionProps> = ({
  roomId,
  userId,
  peerId,
  isReader,
}) => {
  const { isCallActive, isCallInitiator, startCall } = useWebRTC();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to WebRTC signaling messages
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room_${roomId}`);

    channel
      .on('broadcast', { event: 'signal' }, (payload) => {
        const { from, to, type, data } = payload.payload;
        
        // Only process messages intended for this user
        if (to !== userId) return;

        handleSignalMessage({ type, data });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, userId]);

  const handleSignalMessage = async (message: { type: string; data: any }) => {
    const { type, data } = message;

    try {
      switch (type) {
        case 'offer':
          // Handle incoming offer
          await webrtcService.setRemoteDescription(data);
          const answer = await webrtcService.createAnswer();
          await sendSignal(peerId, 'answer', answer);
          break;

        case 'answer':
          // Handle answer
          await webrtcService.setRemoteDescription(data);
          setIsConnected(true);
          break;

        case 'candidate':
          // Handle ICE candidate
          await webrtcService.addIceCandidate(data);
          break;

      }
    } catch (error) {
      console.error('Error handling signal:', error);
      setError('Failed to establish connection');
    }
  };

  const sendSignal = async (to: string, type: string, data: any) => {
    try {
      const { error } = await supabase.channel(`room_${roomId}`).send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          from: userId,
          to,
          type,
          data,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending signal:', error);
      setError('Failed to send signal');
    }
  };

  const handleStartCall = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Start the call
      await startCall();
      
      // If this is the reader, send an offer to the client
      if (isReader) {
        const offer = await webrtcService.createOffer();
        await sendSignal(peerId, 'offer', offer);
      }
      
      // Set up ICE candidate handling
      webrtcService.onIceCandidate((candidate) => {
        if (candidate) {
          sendSignal(peerId, 'candidate', candidate);
        }
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      setError('Failed to start call');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        <p>{error}</p>
        <Button onClick={handleStartCall} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!isCallActive && !isCallInitiator) {
    return (
      <div className="text-center p-4">
        <Button
          onClick={handleStartCall}
          disabled={isLoading}
          className="bg-pink-600 hover:bg-pink-700 text-white"
        >
          {isLoading ? 'Connecting...' : 'Start Reading'}
        </Button>
      </div>
    );
  }

  if (isCallActive && !isConnected) {
    return (
      <div className="text-center p-4">
        <p>Connecting to reader...</p>
        <div className="animate-pulse">
          <div className="h-4 w-4 bg-pink-500 rounded-full mx-auto mt-2"></div>
        </div>
      </div>
    );
  }

  return null;
};
