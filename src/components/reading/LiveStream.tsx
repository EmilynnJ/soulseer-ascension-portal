import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Gift, Users, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import webrtcClient from '@/services/webrtcClient';

type LiveStreamProps = {
  streamId: string;
  readerId: string;
  readerName: string;
  isHost: boolean;
  onEnd?: () => void;
};

type GiftItem = {
  id: string;
  name: string;
  icon: string;
  price: number;
  animation?: string;
};

const GIFTS: GiftItem[] = [
  { id: 'star', name: 'Star', icon: '⭐', price: 100 },
  { id: 'heart', name: 'Heart', icon: '❤️', price: 200 },
  { id: 'diamond', name: 'Diamond', icon: '💎', price: 500 },
  { id: 'crown', name: 'Crown', icon: '👑', price: 1000 },
  { id: 'unicorn', name: 'Unicorn', icon: '🦄', price: 2000 },
];

type ReceivedGift = {
  id: string;
  giftId: string;
  senderName: string;
  timestamp: Date;
  animationComplete: boolean;
};

export const LiveStream: React.FC<LiveStreamProps> = ({
  streamId,
  readerId,
  readerName,
  isHost,
  onEnd,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<Array<{ sender: string; content: string; timestamp: Date }>>([]);
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize stream
  useEffect(() => {
    const initializeStream = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If host, get media stream
        if (isHost) {
          const constraints: MediaStreamConstraints = {
            audio: true,
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setLocalStream(stream);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          // Update stream status in database
          await supabase
            .from('live_streams')
            .update({ status: 'active', started_at: new Date().toISOString() })
            .eq('id', streamId);
        }
        
        // Join stream room
        const room = supabase.channel(`stream_${streamId}`);
        
        // Listen for messages
        room
          .on('broadcast', { event: 'message' }, (payload) => {
            const { sender, content } = payload.payload;
            setMessages(prev => [
              ...prev,
              {
                sender,
                content,
                timestamp: new Date(),
              },
            ]);
          })
          .on('broadcast', { event: 'gift' }, (payload) => {
            const { giftId, senderName } = payload.payload;
            handleGiftReceived(giftId, senderName);
          })
          .on('presence', { event: 'sync' }, () => {
            const presenceState = room.presenceState();
            const count = Object.keys(presenceState).length;
            setViewerCount(count);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await room.track({ user: supabase.auth.getUser() });
            }
          });
        
        // Clean up function
        return () => {
          if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
          }
          room.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing stream:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize stream');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeStream();
  }, [streamId, isHost]);
  
  // Auto-scroll chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle gift received
  const handleGiftReceived = (giftId: string, senderName: string) => {
    // Find gift details
    const gift = GIFTS.find(g => g.id === giftId);
    if (!gift) return;
    
    // Add to received gifts
    const newGift: ReceivedGift = {
      id: Math.random().toString(36).substring(2, 9),
      giftId,
      senderName,
      timestamp: new Date(),
      animationComplete: false,
    };
    
    setReceivedGifts(prev => [...prev, newGift]);
    
    // Update earnings for host
    if (isHost) {
      setTotalEarnings(prev => prev + gift.price * 0.7); // 70% to reader
    }
    
    // Add system message
    setMessages(prev => [
      ...prev,
      {
        sender: 'System',
        content: `${senderName} sent a ${gift.name} ${gift.icon}`,
        timestamp: new Date(),
      },
    ]);
    
    // Remove gift after animation completes
    setTimeout(() => {
      setReceivedGifts(prev => 
        prev.map(g => 
          g.id === newGift.id ? { ...g, animationComplete: true } : g
        )
      );
      
      // Clean up completed animations after a delay
      setTimeout(() => {
        setReceivedGifts(prev => prev.filter(g => !g.animationComplete));
      }, 1000);
    }, 3000);
  };
  
  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Get user name
    const userName = isHost ? readerName : 'Viewer'; // In a real app, get actual user name
    
    // Send message to channel
    const channel = supabase.channel(`stream_${streamId}`);
    channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        sender: userName,
        content: message,
      },
    });
    
    // Clear input
    setMessage('');
  };
  
  // Send gift
  const handleSendGift = async (gift: GiftItem) => {
    try {
      // In a real app, check user balance first
      
      // Process payment
      const { data, error } = await supabase.functions.invoke('process-gift', {
        body: {
          streamId,
          readerId,
          giftId: gift.id,
          amount: gift.price,
        },
      });
      
      if (error) throw error;
      
      // Send gift to channel
      const channel = supabase.channel(`stream_${streamId}`);
      channel.send({
        type: 'broadcast',
        event: 'gift',
        payload: {
          giftId: gift.id,
          senderName: 'You', // In a real app, get actual user name
        },
      });
      
      // Close gift panel
      setShowGifts(false);
      
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift. Please try again.');
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };
  
  // End stream
  const handleEndStream = async () => {
    try {
      if (isHost) {
        // Update stream status
        await supabase
          .from('live_streams')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
          })
          .eq('id', streamId);
        
        // Stop local stream
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
      }
      
      // Call onEnd callback
      if (onEnd) onEnd();
      
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{isHost ? 'Starting stream...' : 'Joining stream...'}</p>
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
          <Button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      {/* Video element */}
      <div className="absolute inset-0">
        {isHost ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white text-xl">Waiting for stream to start...</p>
          </div>
        )}
      </div>
      
      {/* Stream info overlay */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-white">{readerName}</h1>
            <div className="flex items-center text-sm text-gray-300">
              <Users className="h-4 w-4 mr-1" />
              <span>{viewerCount} viewers</span>
            </div>
          </div>
          
          {isHost && (
            <div className="bg-black/50 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Earnings:</span>
                <span className="text-sm text-green-400">
                  {formatCurrency(totalEarnings / 100)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Gift animations */}
      <div className="absolute inset-0 pointer-events-none">
        {receivedGifts.map(gift => {
          const giftDetails = GIFTS.find(g => g.id === gift.giftId);
          if (!giftDetails) return null;
          
          return (
            <div
              key={gift.id}
              className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center transition-opacity duration-1000 ${
                gift.animationComplete ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="animate-bounce text-6xl mb-2">{giftDetails.icon}</div>
              <div className="text-white text-xl bg-black/50 px-3 py-1 rounded-full">
                {gift.senderName} sent {giftDetails.name}!
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Chat panel */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/70 backdrop-blur-sm z-20">
          <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="bg-gray-800 p-3 flex items-center justify-between">
              <h2 className="text-white font-medium">Live Chat</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg ${
                    msg.sender === 'System' 
                      ? 'bg-gray-800/50 text-center' 
                      : msg.sender === 'You' 
                        ? 'bg-pink-600/70 ml-auto rounded-br-none' 
                        : 'bg-gray-700/70 rounded-bl-none'
                  }`}
                >
                  {msg.sender !== 'System' && (
                    <div className="text-xs text-gray-300 mb-1">{msg.sender}</div>
                  )}
                  <div className="text-white text-sm">{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat input */}
            <div className="bg-gray-800 p-3">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  placeholder="Type a message..."
                />
                <Button 
                  type="submit" 
                  className="bg-pink-600 hover:bg-pink-700"
                  size="sm"
                  disabled={!message.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Gift panel */}
      {showGifts && !isHost && (
        <div className="absolute left-1/2 bottom-20 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-4 z-20">
          <h3 className="text-white font-medium mb-3">Send a Gift</h3>
          <div className="grid grid-cols-5 gap-3">
            {GIFTS.map(gift => (
              <button
                key={gift.id}
                onClick={() => handleSendGift(gift)}
                className="flex flex-col items-center p-2 rounded-lg bg-gray-800/50 hover:bg-pink-600/30 transition-colors"
              >
                <div className="text-2xl mb-1">{gift.icon}</div>
                <div className="text-white text-xs">{gift.name}</div>
                <div className="text-gray-300 text-xs">${gift.price / 100}</div>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGifts(false)}
            className="mt-3 w-full text-gray-300"
          >
            Cancel
          </Button>
        </div>
      )}
      
      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex justify-center space-x-4">
          {isHost && (
            <>
              <Button
                onClick={toggleMute}
                className={`rounded-full p-4 ${isMuted ? 'bg-red-600' : 'bg-gray-700'}`}
                variant="ghost"
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </Button>
              
              <Button
                onClick={toggleVideo}
                className={`rounded-full p-4 ${!isVideoOn ? 'bg-red-600' : 'bg-gray-700'}`}
                variant="ghost"
              >
                {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
              </Button>
            </>
          )}
          
          <Button
            onClick={() => setShowChat(!showChat)}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-4"
            variant="ghost"
          >
            <MessageSquare size={24} />
          </Button>
          
          {!isHost && (
            <Button
              onClick={() => setShowGifts(!showGifts)}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-full p-4"
            >
              <Gift size={24} />
            </Button>
          )}
          
          <Button
            onClick={handleEndStream}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
          >
            <X size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};