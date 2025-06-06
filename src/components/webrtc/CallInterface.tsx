import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare } from 'lucide-react';
import { useWebRTC } from '@/contexts/WebRTCContext';
import { useState } from 'react';

export const CallInterface = () => {
  const {
    isCallActive,
    isCallInitiator,
    startCall,
    endCall,
    localStream,
    remoteStream,
    sendMessage,
    messages,
  } = useWebRTC();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 p-4 z-50">
      <div className="flex justify-center space-x-4">
        {!isCallActive ? (
          <Button
            onClick={startCall}
            className="bg-pink-600 hover:bg-pink-700 text-white rounded-full p-4"
          >
            Start Reading
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
            <Button
              onClick={toggleVideo}
              className={`rounded-full p-4 ${!isVideoOn ? 'bg-red-600' : 'bg-gray-700'}`}
              variant="ghost"
            >
              {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </Button>
            <Button
              onClick={endCall}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
            >
              <PhoneOff size={24} />
            </Button>
            <Button
              onClick={() => setShowChat(!showChat)}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-4"
              variant="ghost"
            >
              <MessageSquare size={24} />
            </Button>
          </>
        )}
      </div>

      {showChat && (
        <div className="fixed right-4 bottom-20 w-80 bg-white/10 backdrop-blur-md rounded-lg p-4 z-50">
          <div className="h-64 overflow-y-auto mb-4 space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg ${
                  msg.sender === 'You' ? 'bg-pink-600 ml-8' : 'bg-gray-700 mr-8'
                }`}
              >
                <div className="text-xs text-gray-300">{msg.sender}</div>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
              placeholder="Type a message..."
            />
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
