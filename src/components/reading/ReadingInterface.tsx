import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MessageCircle, 
  Send,
  Clock,
  DollarSign,
  AlertCircle,
  Settings
} from 'lucide-react';
import { webrtcClient, SessionData, BillingUpdate } from '@/services/webrtcClient';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  timestamp: string;
  type: 'text' | 'system';
}

interface ReaderProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  specialties: string[];
  rating: number;
  total_reviews: number;
  per_minute_rate_chat: number;
  per_minute_rate_phone: number;
  per_minute_rate_video: number;
}

export const ReadingInterface: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Refs for video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Session state
  const [session, setSession] = useState<SessionData | null>(null);
  const [readerProfile, setReaderProfile] = useState<ReaderProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<'pending' | 'connecting' | 'connected' | 'ended'>('pending');
  const [connectionState, setConnectionState] = useState<string>('new');
  
  // Media controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  
  // Billing state
  const [billingData, setBillingData] = useState<BillingUpdate | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [balance, setBalance] = useState(0);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    initializeSession();
    setupWebRTCListeners();
    
    return () => {
      webrtcClient.endSession();
    };
  }, [sessionId]);

  useEffect(() => {
    // Timer for session duration
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      // Get user profile for balance
        .from('user_profiles')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setBalance(profile.balance);
      }

      // Get session data
        .from('reading_sessions')
        .select(`
          *,
          reader_profile:user_profiles!reading_sessions_reader_id_fkey(*),
          client_profile:user_profiles!reading_sessions_client_id_fkey(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        toast.error('Session not found');
        navigate('/dashboard');
        return;
      }

      setSession(sessionData);
      
      // Set reader profile
      if (sessionData.reader_profile) {
        setReaderProfile(sessionData.reader_profile);
      }

      // Load existing messages
      await loadMessages();

      // Check if user is part of this session
      const isParticipant = sessionData.client_id === user.id || sessionData.reader_id === user.id;
      if (!isParticipant) {
        toast.error('Access denied');
        navigate('/dashboard');
        return;
      }

      // Auto-start if session is accepted
      if (sessionData.status === 'accepted') {
        await startWebRTCSession();
      }
      
    } catch (error) {
      console.error('Error initializing session:', error);
      toast.error('Failed to load session');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebRTCListeners = () => {
    // Local stream
    webrtcClient.onLocalStream((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    // Remote stream
    webrtcClient.onRemoteStream((stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setSessionStatus('connected');
      setIsCallActive(true);
    });

    // Messages
    webrtcClient.onMessage((message) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: message.content,
        sender_id: message.senderId || 'system',
        sender_name: message.senderName || 'System',
        timestamp: new Date().toISOString(),
        type: message.type || 'text'
      }]);
    });

    // Billing updates
    webrtcClient.onBillingUpdate((update) => {
      setBillingData(update);
      setBalance(update.clientBalance);
      
      if (update.clientBalance < (session?.rate_per_minute || 0) / 100) {
        toast.error('Insufficient balance! Session will end soon.');
      }
    });

    // Session ended
    webrtcClient.onSessionEnded((data) => {
      setSessionStatus('ended');
      setIsCallActive(false);
      toast.info(`Session ended: ${data.reason || 'completed'}`);
      
      // Show session summary
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            sessionSummary: {
              duration: data.totalMinutes,
              cost: data.totalCost,
              reason: data.reason
            }
          }
        });
      }, 3000);
    });

    // Connection state changes
    webrtcClient.onConnectionState((state) => {
      setConnectionState(state);
      if (state === 'connected') {
        setSessionStatus('connected');
        setIsConnecting(false);
      } else if (state === 'disconnected' || state === 'failed') {
        toast.error('Connection lost. Attempting to reconnect...');
      }
    });
  };

  const startWebRTCSession = async () => {
    try {
      setIsConnecting(true);
      setSessionStatus('connecting');
      
      if (!session || !currentUser) return;
      
      const isInitiator = session.client_id === currentUser.id;
      await webrtcClient.startSession(session.id, isInitiator);
      
    } catch (error) {
      console.error('Error starting WebRTC session:', error);
      toast.error('Failed to start session');
      setIsConnecting(false);
    }
  };

  const loadMessages = async () => {
    try {
      const messages = await webrtcClient.getSessionMessages(sessionId!);
      setMessages(messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        sender_name: msg.sender_profile?.full_name || 'Unknown',
        timestamp: msg.created_at,
        type: msg.message_type || 'text'
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId) return;

    try {
      webrtcClient.sendMessage(newMessage);
      
      // Also send via API for persistence
      await fetch('/api/sessions/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          content: newMessage,
          type: 'text'
        })
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const toggleAudio = () => {
    const enabled = webrtcClient.toggleAudio();
    setIsMuted(!enabled);
  };

  const toggleVideo = () => {
    const enabled = webrtcClient.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const endSession = async () => {
    try {
      await webrtcClient.endSession();
      setIsCallActive(false);
      setSessionStatus('ended');
      
      // Navigate back to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Session not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with session info */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={readerProfile?.avatar_url} />
              <AvatarFallback>{readerProfile?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">{readerProfile?.full_name}</h1>
              <div className="flex items-center space-x-2">
                <Badge variant={sessionStatus === 'connected' ? 'default' : 'secondary'}>
                  {sessionStatus}
                </Badge>
                <span className="text-sm text-gray-400">
                  {formatCurrency((session.rate_per_minute || 0) / 100)}/min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Timer */}
            {isCallActive && (
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span className="text-lg font-mono">{formatTime(sessionTimer)}</span>
              </div>
            )}

            {/* Cost */}
            {billingData && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span className="text-lg">{formatCurrency(billingData.totalCost)}</span>
              </div>
            )}

            {/* Balance */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Balance:</span>
              <span className={`text-lg ${balance < (session.rate_per_minute / 100) ? 'text-red-400' : 'text-green-400'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Video area */}
        <div className="flex-1 relative bg-black">
          {/* Remote video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local video (picture-in-picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Connection status overlay */}
          {sessionStatus === 'connecting' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <div className="text-xl">Connecting...</div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-gray-800 bg-opacity-90 rounded-full px-6 py-3">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                onClick={toggleAudio}
                className="rounded-full h-12 w-12"
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              
              {session.type === 'video' && (
                <Button
                  variant={!isVideoEnabled ? "destructive" : "secondary"}
                  size="lg"
                  onClick={toggleVideo}
                  className="rounded-full h-12 w-12"
                >
                  {!isVideoEnabled ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>
              )}
              
              <Button
                variant="destructive"
                size="lg"
                onClick={endSession}
                className="rounded-full h-12 w-12"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Chat header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Chat</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                >
                  ×
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender_id === currentUser?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          isOwn
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        {!isOwn && (
                          <div className="text-xs text-gray-300 mb-1">
                            {message.sender_name}
                          </div>
                        )}
                        <div>{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat toggle button (when hidden) */}
      {!showChat && (
        <Button
          className="fixed bottom-4 right-4 rounded-full h-12 w-12"
          onClick={() => setShowChat(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Low balance warning */}
      {balance < (session.rate_per_minute / 100) * 2 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="bg-red-900 border-red-600 text-white p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Low balance! Please add funds to continue.</span>
              <Button size="sm" onClick={() => navigate('/dashboard/wallet')}>
                Add Funds
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReadingInterface;