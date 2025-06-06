import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { webrtcService, WebRTCService } from '@/services/webrtc';

type WebRTCContextType = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isCallInitiator: boolean;
  startCall: () => Promise<void>;
  endCall: () => void;
  sendMessage: (message: any) => void;
  messages: Array<{ sender: string; content: string; timestamp: Date }>;
};

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: string; content: string; timestamp: Date }>>([]);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize local stream
  const initializeLocalStream = async () => {
    try {
      const stream = await webrtcService.initializeLocalStream({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error initializing local stream:', error);
      throw error;
    }
  };

  // Handle remote stream
  useEffect(() => {
    const handleTrack = (stream: MediaStream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    webrtcService.onTrack(handleTrack);
    return () => {
      // Cleanup
    };
  }, []);

  // Handle data channel messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      setMessages(prev => [
        ...prev,
        {
          sender: message.sender || 'Peer',
          content: message.content,
          timestamp: new Date(),
        },
      ]);
    };

    webrtcService.onDataChannelMessage(handleMessage);
    return () => {
      // Cleanup
    };
  }, []);

  // Handle disconnection
  useEffect(() => {
    const handleDisconnect = () => {
      setIsCallActive(false);
      setIsCallInitiator(false);
      setRemoteStream(null);
      setLocalStream(null);
      setMessages([]);
    };

    webrtcService.onDisconnect(handleDisconnect);
    return () => {
      // Cleanup
    };
  }, []);

  const startCall = async () => {
    try {
      await initializeLocalStream();
      const offer = await webrtcService.createOffer();
      
      // Here you would typically send this offer to the other peer via your signaling server
      // For example: await sendOfferToPeer(offer);
      
      setIsCallActive(true);
      setIsCallInitiator(true);
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  };

  const endCall = () => {
    webrtcService.cleanup();
    setIsCallActive(false);
    setIsCallInitiator(false);
    setRemoteStream(null);
    setLocalStream(null);
    setMessages([]);
  };

  const sendMessage = (content: string) => {
    const message = {
      sender: 'You',
      content,
      timestamp: new Date(),
    };
    
    webrtcService.sendData(message);
    setMessages(prev => [...prev, message]);
  };

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStream,
        isCallActive,
        isCallInitiator,
        startCall,
        endCall,
        sendMessage,
        messages,
      }}
    >
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '160px', position: 'fixed', bottom: '20px', right: '20px', zIndex: 10 }}
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', position: 'fixed', top: 0, left: 0, zIndex: 1 }}
      />
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (context === undefined) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
