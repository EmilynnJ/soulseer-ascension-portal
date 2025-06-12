import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MediaControlsProps = {
  isCallActive: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isVideoEnabled: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  isLoading?: boolean;
};

export const MediaControls: React.FC<MediaControlsProps> = ({
  isCallActive,
  isMuted,
  isVideoOn,
  isVideoEnabled,
  onStartCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleChat,
  isLoading = false,
}) => {
  return (
    <div className="flex justify-center space-x-4">
      {!isCallActive ? (
        <Button
          onClick={onStartCall}
          className="bg-pink-600 hover:bg-pink-700 text-white rounded-full p-4"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Start Reading'}
        </Button>
      ) : (
        <>
          <Button
            onClick={onToggleMute}
            className={`rounded-full p-4 ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            variant="ghost"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
          
          {isVideoEnabled && (
            <Button
              onClick={onToggleVideo}
              className={`rounded-full p-4 ${!isVideoOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              variant="ghost"
              title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </Button>
          )}
          
          <Button
            onClick={onEndCall}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
            title="End call"
          >
            <PhoneOff size={24} />
          </Button>
          
          <Button
            onClick={onToggleChat}
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-4"
            variant="ghost"
            title="Toggle chat"
          >
            <MessageSquare size={24} />
          </Button>
        </>
      )}
    </div>
  );
};