import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, X } from 'lucide-react';

type Message = {
  sender: string;
  content: string;
  timestamp: Date;
};

type ChatInterfaceProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isConnected: boolean;
  userName: string;
  peerName: string;
  isFullScreen?: boolean;
  onClose?: () => void;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isConnected,
  userName,
  peerName,
  isFullScreen = false,
  onClose,
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <div className={`flex flex-col ${isFullScreen ? 'h-full' : 'h-96'} bg-gray-900 rounded-lg overflow-hidden`}>
      {/* Chat header */}
      <div className="bg-gray-800 p-3 flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium">{peerName}</h3>
          <div className="flex items-center text-xs text-gray-300">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] p-3 rounded-lg ${
              msg.sender === userName 
                ? 'bg-pink-600 ml-auto rounded-br-none' 
                : msg.sender === 'System'
                  ? 'bg-gray-800 mx-auto text-center'
                  : 'bg-gray-700 rounded-bl-none'
            }`}
          >
            {msg.sender !== 'System' && (
              <div className="text-xs text-gray-300 mb-1">{msg.sender}</div>
            )}
            <div className="text-white">{msg.content}</div>
            <div className="text-xs text-right text-gray-300 mt-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="bg-gray-800 p-3">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <Button 
            type="submit" 
            disabled={!isConnected || !message.trim()}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};