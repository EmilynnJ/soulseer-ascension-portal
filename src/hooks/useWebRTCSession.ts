import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { webrtcService } from '@/services/webrtc';

type SessionConfig = {
  sessionType: 'chat' | 'audio' | 'video';
  readerId: string;
  ratePerMinute: number;
  initialBalance: number;
  isReader: boolean;
};

export const useWebRTCSession = (config: SessionConfig) => {
  const {
    sessionType,
    readerId,
    ratePerMinute,
    initialBalance,
    isReader,
  } = config;
  
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [balance, setBalance] = useState(initialBalance);
  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  // Initialize the session
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a new session in the database
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([
          {
            client_id: isReader ? null : (await supabase.auth.getUser()).data.user?.id,
            reader_id: isReader ? (await supabase.auth.getUser()).data.user?.id : readerId,
            status: 'pending',
            session_type: sessionType,
            rate: ratePerMinute,
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;
      
      setSessionId(session.id);
      
      // Set up media constraints based on session type
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: sessionType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        } : false,
      };
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Initialize WebRTC
      webrtcService.initializeLocalStream(constraints);
      
      // Set up event listeners
      webrtcService.onTrack((stream) => {
        setRemoteStream(stream);
        setIsConnected(true);
      });
      
      webrtcService.onDisconnect(() => {
        handleEndCall();
      });
      
      return session;
    } catch (error) {
      console.error('Error initializing session:', error);
      setError('Failed to initialize session');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionType, readerId, ratePerMinute, isReader]);

  // Start a call as a client
  const startCall = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!sessionId) {
        await initializeSession();
      }
      
      // Start the call
      const offer = await webrtcService.createOffer();
      
      // Send the offer to the reader via Supabase Realtime
      const { error } = await supabase
        .from('rtc_sessions')
        .upsert(
          {
            session_id: sessionId,
            client_id: (await supabase.auth.getUser()).data.user?.id,
            reader_id: readerId,
            client_sdp: JSON.stringify(offer),
            status: 'connecting',
          },
          { onConflict: 'session_id' }
        );
      
      if (error) throw error;
      
      setIsCallActive(true);
      
    } catch (error) {
      console.error('Error starting call:', error);
      setError('Failed to start call');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, readerId, initializeSession]);

  // Handle incoming call (for readers)
  const handleIncomingCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      setIsLoading(true);
      
      await webrtcService.setRemoteDescription(offer);
      const answer = await webrtcService.createAnswer();
      
      // Send the answer back to the client via Supabase Realtime
      const { error } = await supabase
        .from('rtc_sessions')
        .update({
          reader_sdp: JSON.stringify(answer),
          status: 'in-progress',
          started_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
      
      if (error) throw error;
      
      setIsCallActive(true);
      
    } catch (error) {
      console.error('Error handling incoming call:', error);
      setError('Failed to handle incoming call');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!audioTracks[0]?.enabled);
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!videoTracks[0]?.enabled);
    }
  }, [localStream]);

  // End the call
  const endCall = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Update session status in the database
      if (sessionId) {
        await supabase
          .from('sessions')
          .update({
            status: 'completed',
            end_time: new Date().toISOString(),
            duration_seconds: Math.floor(duration),
            total_amount: cost,
            platform_fee: Math.ceil(cost * 0.3), // 30% platform fee
            reader_earnings: Math.floor(cost * 0.7), // 70% to reader
          })
          .eq('id', sessionId);
        
        // Update RTC session status
        await supabase
          .from('rtc_sessions')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId);
      }
      
      // Clean up WebRTC
      webrtcService.cleanup();
      
      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
      
      // Reset state
      setLocalStream(null);
      setRemoteStream(null);
      setIsConnected(false);
      setIsCallActive(false);
      setDuration(0);
      setCost(0);
      
      toast.success('Call ended');
      
      // Navigate back to the appropriate page
      navigate(isReader ? '/dashboard/readings' : '/dashboard/history');
      
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call properly');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, duration, cost, localStream, remoteStream, isReader, navigate]);

  // Handle balance depletion
  const handleBalanceDepleted = useCallback(() => {
    toast.warning('Your balance is running low. Please add more funds to continue.');
    // Auto-end call if balance is below minimum threshold
    if (balance < ratePerMinute * 0.5) {
      toast.error('Insufficient balance. Ending call.');
      endCall();
    }
  }, [balance, ratePerMinute, endCall]);

  // Set up realtime subscription for WebRTC signaling
  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase.channel(`session_${sessionId}`);
    
    // Subscribe to ICE candidates
    channel
      .on('broadcast', { event: 'ice-candidate' }, (payload) => {
        const { candidate } = payload;
        if (candidate) {
          webrtcService.addIceCandidate(candidate);
        }
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  // Set up realtime subscription for session updates (for readers)
  useEffect(() => {
    if (!isReader || !readerId) return;
    
    const channel = supabase.channel(`reader_${readerId}`);
    
    // Subscribe to new session requests
    channel
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'sessions',
          filter: `reader_id=eq.${readerId}`
        }, 
        (payload) => {
          // Handle new session request
          console.log('New session request:', payload);
          // You can show a notification to the reader here
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [isReader, readerId]);

  // Handle window close/unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCallActive) {
        e.preventDefault();
        e.returnValue = 'You have an active call. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Clean up on unmount
      if (isCallActive) {
        endCall().catch(console.error);
      } else {
        webrtcService.cleanup();
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [isCallActive, localStream, endCall]);

  return {
    // State
    sessionId,
    isConnected,
    isLoading,
    error,
    localStream,
    remoteStream,
    isMuted,
    isVideoOn,
    balance,
    duration,
    cost,
    isCallActive,
    
    // Actions
    initializeSession,
    startCall,
    handleIncomingCall,
    toggleMute,
    toggleVideo,
    endCall,
    handleBalanceDepleted,
  };
};
