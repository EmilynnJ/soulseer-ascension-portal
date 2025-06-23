import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { webrtcClient, SessionData, BillingUpdate } from '@/services/webrtcClient';

interface WebRTCState {
  isConnected: boolean;
  isInSession: boolean;
  sessionId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionState: string;
  error: string | null;
  sessionCost: number;
  sessionDuration: number;
  isLoading: boolean;
  isConnecting: boolean;
  billingInfo: { cost: number; duration: number } | null;
}

type WebRTCAction =
  | { type: 'SET_CONNECTION_STATE'; payload: string }
  | { type: 'SET_IS_IN_SESSION'; payload: boolean }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_LOCAL_STREAM'; payload: MediaStream | null }
  | { type: 'SET_REMOTE_STREAM'; payload: MediaStream | null }
  | { type: 'SET_IS_VIDEO_ENABLED'; payload: boolean }
  | { type: 'SET_IS_AUDIO_ENABLED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION_COST'; payload: number }
  | { type: 'SET_SESSION_DURATION'; payload: number }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'SET_IS_CONNECTING'; payload: boolean }
  | { type: 'SET_BILLING_INFO'; payload: { cost: number; duration: number } | null }
  | { type: 'RESET_STATE' };

const initialState: WebRTCState = {
  isConnected: false,
  isInSession: false,
  sessionId: null,
  localStream: null,
  remoteStream: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
  connectionState: 'new',
  error: null,
  sessionCost: 0,
  sessionDuration: 0,
  isLoading: false,
  isConnecting: false,
  billingInfo: null,
};

function webrtcReducer(state: WebRTCState, action: WebRTCAction): WebRTCState {
  switch (action.type) {
    case 'SET_CONNECTION_STATE':
      return { ...state, connectionState: action.payload, isConnected: action.payload === 'connected' };
    case 'SET_IS_IN_SESSION':
      return { ...state, isInSession: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_LOCAL_STREAM':
      return { ...state, localStream: action.payload };
    case 'SET_REMOTE_STREAM':
      return { ...state, remoteStream: action.payload };
    case 'SET_IS_VIDEO_ENABLED':
      return { ...state, isVideoEnabled: action.payload };
    case 'SET_IS_AUDIO_ENABLED':
      return { ...state, isAudioEnabled: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SESSION_COST':
      return { ...state, sessionCost: action.payload };
    case 'SET_SESSION_DURATION':
      return { ...state, sessionDuration: action.payload };
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_IS_CONNECTING':
      return { ...state, isConnecting: action.payload };
    case 'SET_BILLING_INFO':
      return { 
        ...state, 
        billingInfo: action.payload,
        sessionCost: action.payload?.cost || 0,
        sessionDuration: action.payload?.duration || 0
      };
    case 'RESET_STATE':
      return { ...initialState, isConnected: state.isConnected };
    default:
      return state;
  }
}

interface WebRTCContextType {
  // State
  isConnected: boolean;
  isInSession: boolean;
  sessionId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionState: string;
  error: string | null;
  sessionCost: number;
  sessionDuration: number;
  isLoading: boolean;
  isConnecting: boolean;
  billingInfo: { cost: number; duration: number } | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  requestSession: (readerId: string, sessionType: 'chat' | 'audio' | 'video', ratePerMinute: number) => Promise<SessionData>;
  respondToSession: (sessionId: string, response: 'accept' | 'reject') => Promise<void>;
  startSession: (sessionId: string, isInitiator?: boolean) => Promise<void>;
  endSession: () => Promise<void>;
  toggleAudio: () => boolean;
  toggleVideo: () => boolean;
  sendMessage: (content: string, type?: string) => void;
  addFunds: (amount: number, paymentMethodId: string) => Promise<void>;
  getSessionMessages: (sessionId: string) => Promise<any[]>;
  getSessionHistory: (limit?: number, offset?: number) => Promise<SessionData[]>;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(webrtcReducer, initialState);

  useEffect(() => {
    // Set up WebRTC event listeners using callback methods
    webrtcClient.onLocalStream((stream: MediaStream) => {
      dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
    });

    webrtcClient.onRemoteStream((stream: MediaStream) => {
      dispatch({ type: 'SET_REMOTE_STREAM', payload: stream });
    });

    webrtcClient.onConnectionState((state: string) => {
      dispatch({ type: 'SET_CONNECTION_STATE', payload: state });
    });

    webrtcClient.onSessionEnded(() => {
      dispatch({ type: 'SET_IS_IN_SESSION', payload: false });
      dispatch({ type: 'SET_SESSION_ID', payload: null });
      dispatch({ type: 'SET_LOCAL_STREAM', payload: null });
      dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
      dispatch({ type: 'SET_BILLING_INFO', payload: null });
    });

    webrtcClient.onBillingUpdate((data: BillingUpdate) => {
      dispatch({ 
        type: 'SET_BILLING_INFO', 
        payload: { cost: data.totalCost, duration: data.minutesCharged } 
      });
    });

    webrtcClient.onMessage((message: any) => {
      // Handle incoming messages if needed
      console.log('Received message:', message);
    });

    // No cleanup needed since callbacks are set once
    return () => {
      // WebRTC client will handle its own cleanup
    };
  }, []);

  const connect = async () => {
    try {
      dispatch({ type: 'SET_IS_CONNECTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      // WebRTC client connects automatically via socket initialization
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'connected' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Connection failed' });
    } finally {
      dispatch({ type: 'SET_IS_CONNECTING', payload: false });
    }
  };

  const disconnect = async () => {
    try {
      if (state.sessionId) {
        await webrtcClient.endSession();
      }
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnected' });
      dispatch({ type: 'SET_IS_IN_SESSION', payload: false });
      dispatch({ type: 'SET_SESSION_ID', payload: null });
      dispatch({ type: 'SET_LOCAL_STREAM', payload: null });
      dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
      dispatch({ type: 'SET_BILLING_INFO', payload: null });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const requestSession = async (readerId: string, sessionType: 'chat' | 'audio' | 'video', ratePerMinute: number) => {
    try {
      dispatch({ type: 'SET_IS_CONNECTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const sessionData = await webrtcClient.requestSession(readerId, sessionType, ratePerMinute);
      dispatch({ type: 'SET_SESSION_ID', payload: sessionData.id });
      return sessionData;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to request session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_IS_CONNECTING', payload: false });
    }
  };

  const respondToSession = async (sessionId: string, response: 'accept' | 'reject') => {
    try {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await webrtcClient.respondToSession(sessionId, response);
      if (response === 'accept') {
        dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to respond to session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  };

  const startSession = async (sessionId: string, isInitiator: boolean = false) => {
    try {
      dispatch({ type: 'SET_IS_CONNECTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await webrtcClient.startSession(sessionId, isInitiator);
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
      dispatch({ type: 'SET_IS_IN_SESSION', payload: true });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to start session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_IS_CONNECTING', payload: false });
    }
  };

  const endSession = async () => {
    try {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      if (state.sessionId) {
        await webrtcClient.endSession();
      }
      dispatch({ type: 'SET_IS_IN_SESSION', payload: false });
      dispatch({ type: 'SET_SESSION_ID', payload: null });
      dispatch({ type: 'SET_LOCAL_STREAM', payload: null });
      dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
      dispatch({ type: 'SET_BILLING_INFO', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to end session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  };

  const toggleAudio = () => {
    const isEnabled = webrtcClient.toggleAudio();
    dispatch({ type: 'SET_IS_AUDIO_ENABLED', payload: isEnabled });
    return isEnabled;
  };

  const toggleVideo = () => {
    const isEnabled = webrtcClient.toggleVideo();
    dispatch({ type: 'SET_IS_VIDEO_ENABLED', payload: isEnabled });
    return isEnabled;
  };

  const sendMessage = (content: string, type: string = 'text') => {
    webrtcClient.sendMessage(content, type);
  };

  const addFunds = async (amount: number, paymentMethodId: string) => {
    try {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await webrtcClient.addFunds(amount, paymentMethodId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add funds' });
      throw error;
    } finally {
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  };

  const getSessionMessages = async (sessionId: string) => {
    try {
      return await webrtcClient.getSessionMessages(sessionId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to get session messages' });
      throw error;
    }
  };

  const getSessionHistory = async (limit: number = 20, offset: number = 0) => {
    try {
      return await webrtcClient.getSessionHistory(limit, offset);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to get session history' });
      throw error;
    }
  };

  const value: WebRTCContextType = {
    // State
    ...state,

    // Actions
    connect,
    disconnect,
    requestSession,
    respondToSession,
    startSession,
    endSession,
    toggleAudio,
    toggleVideo,
    sendMessage,
    addFunds,
    getSessionMessages,
    getSessionHistory,
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

export default WebRTCContext;
