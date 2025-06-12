import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type ReadingConfig = {
  sessionId?: string;
  readerId?: string;
  clientId?: string;
  sessionType: 'chat' | 'audio' | 'video';
  rate: number;
  initialBalance: number;
  isReader: boolean;
};

export const useReading = (config: ReadingConfig) => {
  const {
    sessionId: initialSessionId,
    readerId,
    clientId,
    sessionType,
    rate,
    initialBalance,
    isReader,
  } = config;
  
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(sessionType === 'video');
  const [balance, setBalance] = useState(initialBalance);
  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: string; content: string; timestamp: Date }>>([]);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<number>(100);
  const [isBillingPaused, setIsBillingPaused] = useState(false);
  
  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      // Get ICE servers configuration
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];
      
      // Add TURN server if available
      if (process.env.TURN_SERVERS && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
        iceServers.push({
          urls: process.env.TURN_SERVERS,
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_CREDENTIAL
        });
      }
      
      // Create peer connection
      const pc = new RTCPeerConnection({ iceServers });
      setPeerConnection(pc);
      
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
      
      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Set up remote stream
      const remoteStream = new MediaStream();
      setRemoteStream(remoteStream);
      
      // Handle incoming tracks
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });
      };
      
      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && sessionId) {
          // Send ICE candidate to peer via signaling server
          await supabase.from('rtc_signals').insert([{
            session_id: sessionId,
            from_user_id: isReader ? readerId : clientId,
            to_user_id: isReader ? clientId : readerId,
            signal_type: 'candidate',
            signal_data: JSON.stringify(event.candidate),
            created_at: new Date()
          }]);
        }
      };
      
      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setIsBillingPaused(false);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
          setIsBillingPaused(true);
          
          // Try to reconnect
          if (pc.connectionState === 'disconnected') {
            toast.warning('Connection lost. Attempting to reconnect...');
            // Attempt to restart ICE
            if (isCallActive) {
              restartConnection();
            }
          } else if (pc.connectionState === 'failed') {
            toast.error('Connection failed. Please try again.');
            handleEndCall();
          }
        }
      };
      
      // Create data channel for chat
      if (!isReader) {
        const dc = pc.createDataChannel('chat');
        setDataChannel(dc);
        setupDataChannel(dc);
      } else {
        pc.ondatachannel = (event) => {
          setDataChannel(event.channel);
          setupDataChannel(event.channel);
        };
      }
      
      return pc;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize WebRTC');
      throw error;
    }
  }, [sessionId, readerId, clientId, sessionType, isReader]);
  
  // Set up data channel
  const setupDataChannel = (dc: RTCDataChannel) => {
    dc.onopen = () => {
      console.log('Data channel opened');
    };
    
    dc.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, {
          sender: isReader ? 'Client' : 'Reader',
          content: message.content,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    dc.onclose = () => {
      console.log('Data channel closed');
    };
    
    dc.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  };
  
  // Initialize session
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a new session if one doesn't exist
      let currentSessionId = sessionId;
      
      if (!currentSessionId) {
        if (!readerId) {
          throw new Error('Reader ID is required to create a session');
        }
        
        // Create session in database
        const { data, error } = await supabase
          .from('sessions')
          .insert([
            {
              reader_id: readerId,
              client_id: (await supabase.auth.getUser()).data.user?.id,
              session_type: sessionType,
              rate: rate,
              status: 'pending',
              created_at: new Date()
            }
          ])
          .select()
          .single();
        
        if (error) throw error;
        
        currentSessionId = data.id;
        setSessionId(currentSessionId);
      }
      
      // Initialize WebRTC
      await initializeWebRTC();
      
      return currentSessionId;
    } catch (error) {
      console.error('Error initializing session:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize session');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, readerId, sessionType, rate, initializeWebRTC]);
  
  // Start call
  const startCall = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Initialize session if needed
      if (!sessionId) {
        await initializeSession();
      }
      
      if (!peerConnection) {
        throw new Error('Peer connection not initialized');
      }
      
      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send offer to peer via signaling server
      await supabase.from('rtc_signals').insert([{
        session_id: sessionId,
        from_user_id: isReader ? readerId : clientId,
        to_user_id: isReader ? clientId : readerId,
        signal_type: 'offer',
        signal_data: JSON.stringify(offer),
        created_at: new Date()
      }]);
      
      // Update session status
      await supabase
        .from('sessions')
        .update({ status: 'connecting' })
        .eq('id', sessionId);
      
      setIsCallActive(true);
      
      // Start polling for signals
      startSignalPolling();
      
    } catch (error) {
      console.error('Error starting call:', error);
      setError(error instanceof Error ? error.message : 'Failed to start call');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, peerConnection, readerId, clientId, isReader, initializeSession]);
  
  // Poll for WebRTC signals
  const startSignalPolling = useCallback(() => {
    if (!sessionId) return;
    
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('rtc_signals')
          .select('*')
          .eq('session_id', sessionId)
          .eq('to_user_id', isReader ? readerId : clientId)
          .eq('processed', false)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          for (const signal of data) {
            await handleSignal(signal);
            
            // Mark signal as processed
            await supabase
              .from('rtc_signals')
              .update({ processed: true })
              .eq('id', signal.id);
          }
        }
      } catch (error) {
        console.error('Error polling signals:', error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sessionId, readerId, clientId, isReader]);
  
  // Handle incoming WebRTC signal
  const handleSignal = useCallback(async (signal: any) => {
    if (!peerConnection) return;
    
    try {
      const { signal_type, signal_data } = signal;
      const data = JSON.parse(signal_data);
      
      switch (signal_type) {
        case 'offer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          // Send answer back
          await supabase.from('rtc_signals').insert([{
            session_id: sessionId,
            from_user_id: isReader ? readerId : clientId,
            to_user_id: isReader ? clientId : readerId,
            signal_type: 'answer',
            signal_data: JSON.stringify(answer),
            created_at: new Date()
          }]);
          break;
          
        case 'answer':
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
          break;
          
        case 'candidate':
          await peerConnection.addIceCandidate(new RTCIceCandidate(data));
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }, [peerConnection, sessionId, readerId, clientId, isReader]);
  
  // Restart connection
  const restartConnection = useCallback(async () => {
    if (!peerConnection) return;
    
    try {
      // Create offer with ICE restart
      const offer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(offer);
      
      // Send offer to peer
      await supabase.from('rtc_signals').insert([{
        session_id: sessionId,
        from_user_id: isReader ? readerId : clientId,
        to_user_id: isReader ? clientId : readerId,
        signal_type: 'offer',
        signal_data: JSON.stringify(offer),
        created_at: new Date()
      }]);
    } catch (error) {
      console.error('Error restarting connection:', error);
    }
  }, [peerConnection, sessionId, readerId, clientId, isReader]);
  
  // End call
  const handleEndCall = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Update session status
      if (sessionId) {
        await supabase
          .from('sessions')
          .update({
            status: 'completed',
            end_time: new Date().toISOString(),
            duration_seconds: duration,
            total_amount: cost,
          })
          .eq('id', sessionId);
      }
      
      // Clean up WebRTC
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
      
      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      // Reset state
      setRemoteStream(null);
      setIsConnected(false);
      setIsCallActive(false);
      setDataChannel(null);
      
      toast.success('Call ended');
      
      // Navigate back to the appropriate page
      navigate(isReader ? '/dashboard/readings' : '/dashboard/history');
      
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call properly');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, duration, cost, peerConnection, localStream, isReader, navigate]);
  
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
    if (localStream && sessionType === 'video') {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!videoTracks[0]?.enabled);
    }
  }, [localStream, sessionType]);
  
  // Send message
  const sendMessage = useCallback((content: string) => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      toast.error('Chat connection not available');
      return false;
    }
    
    try {
      const message = {
        content,
        timestamp: new Date().toISOString()
      };
      
      dataChannel.send(JSON.stringify(message));
      
      // Add message to local state
      setMessages(prev => [...prev, {
        sender: 'You',
        content,
        timestamp: new Date()
      }]);
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [dataChannel]);
  
  // Handle balance depleted
  const handleBalanceDepleted = useCallback(() => {
    toast.error('Your balance is depleted. The call will end.');
    handleEndCall();
  }, [handleEndCall]);
  
  // Add funds
  const addFunds = useCallback(async (amount: number) => {
    try {
      // Create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount }
      });
      
      if (error) throw error;
      
      // Load Stripe
      const stripe = (window as any).Stripe(process.env.VITE_STRIPE_PUBLIC_KEY);
      
      // Confirm payment
      const result = await stripe.confirmCardPayment(data.clientSecret);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Update balance
      const newBalance = balance + amount;
      setBalance(newBalance);
      
      toast.success(`Successfully added ${(amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`);
      
      return true;
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
      return false;
    }
  }, [balance]);
  
  // Simulate connection quality changes
  useEffect(() => {
    if (!isConnected) {
      setConnectionQuality(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulate some network variation
      const variation = Math.random() * 20 - 10; // -10 to +10
      setConnectionQuality(prev => {
        const newQuality = Math.min(100, Math.max(0, prev + variation));
        return Math.round(newQuality);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected]);
  
  // Update duration and cost
  useEffect(() => {
    if (isCallActive && isConnected && !isBillingPaused) {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
        
        // Calculate cost (rate is per minute)
        const newCost = Math.ceil((duration + 1) * (rate / 60));
        setCost(newCost);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isCallActive, isConnected, isBillingPaused, duration, rate]);
  
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
        handleEndCall().catch(console.error);
      } else if (peerConnection) {
        peerConnection.close();
      }
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCallActive, peerConnection, localStream, handleEndCall]);
  
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
    messages,
    connectionQuality,
    isBillingPaused,
    
    // Actions
    initializeSession,
    startCall,
    endCall: handleEndCall,
    toggleMute,
    toggleVideo,
    sendMessage,
    addFunds,
    handleBalanceDepleted,
    restartConnection,
  };
};