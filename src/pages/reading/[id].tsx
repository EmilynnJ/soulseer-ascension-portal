import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useWebRTC } from '@/contexts/WebRTCContext';
import { useWebRTCSession } from '@/hooks/useWebRTCSession';
import { SessionStatus } from '@/components/webrtc/SessionStatus';
import { BillingTimer } from '@/components/webrtc/BillingTimer';
import { CallInterface } from '@/components/webrtc/CallInterface';
import { PeerConnection } from '@/components/webrtc/PeerConnection';
import { supabase } from '@/lib/supabase';

const ReadingSession = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isReader, setIsReader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionConfig, setSessionConfig] = useState<{
    sessionType: 'chat' | 'audio' | 'video';
    readerId: string;
    ratePerMinute: number;
    initialBalance: number;
  } | null>(null);

  // Fetch session details
  const { data: session, error: sessionError } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Fetch user profile to check if they're a reader
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return profile;
    },
  });

  // Initialize session config when data is loaded
  useEffect(() => {
    const initSession = async () => {
      try {
        if (!session || !userProfile) return;
        
        // Check if the current user is the reader or client
        const isUserReader = userProfile.role === 'reader';
        setIsReader(isUserReader);
        
        // For clients, check if they have sufficient balance
        let userBalance = userProfile.balance || 0;
        if (!isUserReader && userBalance < session.rate) {
          throw new Error('Insufficient balance. Please add funds to continue.');
        }
        
        setSessionConfig({
          sessionType: session.session_type,
          readerId: session.reader_id,
          ratePerMinute: session.rate,
          initialBalance: userBalance,
        });
        
      } catch (err) {
        console.error('Error initializing session:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
      } finally {
        setIsLoading(false);
      }
    };
    
    initSession();
  }, [session, userProfile]);

  // Handle errors
  useEffect(() => {
    if (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : 'Failed to load session');
      setIsLoading(false);
    }
  }, [sessionError]);

  // Initialize WebRTC session when config is ready
  const {
    isConnected,
    isCallActive,
    localStream,
    remoteStream,
    isMuted,
    isVideoOn,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    handleIncomingCall,
    handleBalanceDepleted,
  } = useWebRTCSession({
    ...sessionConfig!,
    isReader,
  });

  // Handle incoming calls (for readers)
  useEffect(() => {
    if (!isReader || !sessionId) return;
    
    const channel = supabase.channel(`rtc_session_${sessionId}`);
    
    channel
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'rtc_sessions',
          filter: `session_id=eq.${sessionId}`
        }, 
        async (payload) => {
          const { client_sdp, status } = payload.new;
          
          if (status === 'pending' && client_sdp) {
            try {
              const offer = JSON.parse(client_sdp);
              await handleIncomingCall(offer);
            } catch (err) {
              console.error('Error handling incoming call:', err);
              setError('Failed to handle incoming call');
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [isReader, sessionId, handleIncomingCall]);

  // Show loading state
  if (isLoading || !sessionConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Preparing your reading session...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      {/* Video elements */}
      <div className="absolute inset-0">
        {remoteStream && (
          <video
            autoPlay
            playsInline
            ref={(el) => {
              if (el && remoteStream) {
                el.srcObject = remoteStream;
              }
            }}
            className="w-full h-full object-cover"
          />
        )}
        
        {localStream && (
          <div className="absolute bottom-4 right-4 w-48 h-32 bg-black rounded-lg overflow-hidden border-2 border-pink-500">
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => {
                if (el && localStream) {
                  el.srcObject = localStream;
                }
              }}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
        {/* Session info */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <div className="bg-black/70 text-white p-3 rounded-lg">
            <h1 className="text-xl font-bold">
              {isReader ? 'Client Reading' : 'Your Reading'}
            </h1>
            <p className="text-sm text-gray-300">
              {sessionTypeLabels[sessionConfig.sessionType]} • ${sessionConfig.ratePerMinute / 100}/min
            </p>
          </div>
          
          {/* Session status */}
          <SessionStatus
            isConnected={isConnected}
            isLoading={isLoading}
            isReader={isReader}
            onStartCall={startCall}
            onEndCall={endCall}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            isMuted={isMuted}
            isVideoOn={isVideoOn}
          />
        </div>

        {/* Billing timer (for clients) */}
        {!isReader && isCallActive && (
          <BillingTimer
            sessionId={sessionId!}
            ratePerMinute={sessionConfig.ratePerMinute}
            initialBalance={sessionConfig.initialBalance}
            onBalanceDepleted={handleBalanceDepleted}
          />
        )}

        {/* Peer connection (handles WebRTC signaling) */}
        {sessionId && (
          <PeerConnection
            roomId={sessionId}
            userId={userProfile?.id || ''}
            peerId={isReader ? session?.client_id : session?.reader_id}
            isReader={isReader}
          />
        )}

        {/* Call interface (controls) */}
        <CallInterface />
      </div>
    </div>
  );
};

const sessionTypeLabels = {
  chat: 'Chat Reading',
  audio: 'Voice Call',
  video: 'Video Call',
};

export default ReadingSession;
