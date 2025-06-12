import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReading } from '@/hooks/useReading';
import { formatTime, formatCurrency } from '@/lib/utils';

type ReadingInterfaceProps = {
  sessionId?: string;
  readerId?: string;
  clientId?: string;
  sessionType: 'chat' | 'audio' | 'video';
  rate: number;
  initialBalance: number;
  isReader: boolean;
  userName: string;
  peerName: string;
};

export const ReadingInterface: React.FC<ReadingInterfaceProps> = ({
  sessionId,
  readerId,
  clientId,
  sessionType,
  rate,
  initialBalance,
  isReader,
  userName,
  peerName,
}) => {
  const {
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
    initializeSession,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    sendMessage,
    addFunds,
  } = useReading({
    sessionId,
    readerId,
    clientId,
    sessionType,
    rate,
    initialBalance,
    isReader,
  });

  const [showChat, setShowChat] = useState(sessionType === 'chat');
  const [message, setMessage] = useState('');
  const [connectionQuality, setConnectionQuality] = useState<number>(100);
  const [showControls, setShowControls] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize session on mount
  useEffect(() => {
    initializeSession().catch(console.error);
  }, [initializeSession]);
  
  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);
  
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
  
  // Auto-scroll chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!isCallActive) return;
    
    let timeout: number;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      
      timeout = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Initial timeout
    timeout = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isCallActive]);
  
  // Handle message submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };
  
  // Handle adding funds
  const handleAddFunds = () => {
    addFunds(2000); // Add $20.00
  };
  
  // Get connection quality color
  const getQualityColor = (quality: number) => {
    if (quality > 70) return 'text-green-500';
    if (quality > 30) return 'text-yellow-500';
    return 'text-red-500';
  };
  
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
      {/* Video elements */}
      <div className="absolute inset-0">
        {sessionType === 'video' && (
          <>
            {remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {localStream && (
              <div className="absolute bottom-4 right-4 w-48 h-32 bg-black rounded-lg overflow-hidden border-2 border-pink-500 z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </>
        )}
        
        {sessionType === 'audio' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-pink-600/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">{peerName.charAt(0).toUpperCase()}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{peerName}</h2>
              <p className="text-gray-300">{formatTime(duration)}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat interface */}
      {(showChat || sessionType === 'chat') && (
        <div className={`absolute inset-0 ${sessionType === 'chat' ? 'bg-gray-900' : 'bg-black/50 backdrop-blur-sm'} z-20`}>
          <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="bg-gray-800 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{peerName}</h2>
                <div className="flex items-center text-sm text-gray-300">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              
              {sessionType !== 'chat' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChat(false)}
                  className="text-gray-300 hover:text-white"
                >
                  <Video className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation</p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender === 'You' 
                      ? 'bg-pink-600 ml-auto rounded-br-none' 
                      : 'bg-gray-700 rounded-bl-none'
                  }`}
                >
                  <div className="text-xs text-gray-300 mb-1">{msg.sender}</div>
                  <div className="text-white">{msg.content}</div>
                  <div className="text-xs text-right text-gray-300 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat input */}
            <div className="bg-gray-800 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Type a message..."
                  disabled={!isConnected}
                />
                <Button 
                  type="submit" 
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={!isConnected || !message.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Session info overlay */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-white">
              {isReader ? 'Client Reading' : 'Your Reading'}
            </h1>
            <p className="text-sm text-gray-300">
              {sessionType === 'chat' ? 'Chat Reading' : sessionType === 'audio' ? 'Voice Call' : 'Video Call'} • 
              {formatCurrency(rate / 100)}/min
            </p>
          </div>
          
          {/* Connection quality */}
          <div className="bg-black/50 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">Quality:</span>
              <span className={`text-sm ${getQualityColor(connectionQuality)}`}>
                {connectionQuality}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Billing info (for clients) */}
      {!isReader && (
        <div className={`absolute top-20 right-4 bg-black/70 text-white p-4 rounded-lg transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Duration:</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Rate:</span>
              <span>{formatCurrency(rate / 100)}/min</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Cost:</span>
              <span>{formatCurrency(cost / 100)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Balance:</span>
              <span className={balance < rate ? 'text-red-400' : 'text-green-400'}>
                {formatCurrency(balance / 100)}
              </span>
            </div>
            
            {balance < rate && (
              <div className="mt-2 text-center">
                <p className="text-sm text-red-400 mb-2">Low balance! Add more funds to continue.</p>
                <Button
                  onClick={handleAddFunds}
                  className="bg-pink-600 hover:bg-pink-700 text-white text-sm px-3 py-1 rounded w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add $20
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Call controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-center space-x-4">
          {!isCallActive ? (
            <Button
              onClick={startCall}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-full p-4"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Start Reading'}
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleMute}
                className={`rounded-full p-4 ${isMuted ? 'bg-red-600' : 'bg-gray-700'}`}
                variant="ghost"
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </Button>
              
              {sessionType === 'video' && (
                <Button
                  onClick={toggleVideo}
                  className={`rounded-full p-4 ${!isVideoOn ? 'bg-red-600' : 'bg-gray-700'}`}
                  variant="ghost"
                >
                  {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                </Button>
              )}
              
              <Button
                onClick={endCall}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
              >
                <PhoneOff size={24} />
              </Button>
              
              {sessionType !== 'chat' && (
                <Button
                  onClick={() => setShowChat(!showChat)}
                  className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-4"
                  variant="ghost"
                >
                  <MessageSquare size={24} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};