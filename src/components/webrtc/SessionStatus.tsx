import { useEffect, useState } from 'react';
import { Loader2, Wifi, WifiOff, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebRTC } from '@/contexts/WebRTCContext';

type SessionStatusProps = {
  isConnected: boolean;
  isLoading: boolean;
  isReader: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  isMuted: boolean;
  isVideoOn: boolean;
};

export const SessionStatus: React.FC<SessionStatusProps> = ({
  isConnected,
  isLoading,
  isReader,
  onStartCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  isMuted,
  isVideoOn,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [connectionQuality, setConnectionQuality] = useState<number>(100);
  const [showDebug, setShowDebug] = useState(false);
  const [iceConnectionState, setIceConnectionState] = useState<string>('');
  const [iceGatheringState, setIceGatheringState] = useState<string>('');
  const [signalingState, setSignalingState] = useState<string>('');
  const [peerConnectionState, setPeerConnectionState] = useState<string>('');

  const { localStream } = useWebRTC();

  // Update connection status based on props
  useEffect(() => {
    if (isLoading) {
      setConnectionStatus('connecting');
    } else if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected, isLoading]);

  // Simulate connection quality changes (in a real app, this would come from WebRTC stats)
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

  // Get connection status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get connection quality color
  const getQualityColor = (quality: number) => {
    if (quality > 70) return 'text-green-500';
    if (quality > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Toggle debug info
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  // Debug: Log stream info
  useEffect(() => {
    if (showDebug && localStream) {
      console.log('Local stream tracks:', localStream.getTracks());
    }
  }, [showDebug, localStream]);

  return (
    <div className="fixed top-4 left-4 bg-black/70 text-white p-4 rounded-lg z-50">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} flex-shrink-0`}></div>
          <span className="text-sm font-medium">
            {connectionStatus === 'connected' 
              ? 'Connected'
              : connectionStatus === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'}
          </span>
        </div>

        {isConnected && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0">
              {connectionQuality > 70 ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : connectionQuality > 30 ? (
                <Wifi className="w-4 h-4 text-yellow-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>
            <span className="text-sm">
              Quality: <span className={getQualityColor(connectionQuality)}>{connectionQuality}%</span>
            </span>
          </div>
        )}

        {!isConnected && !isLoading && !isReader && (
          <Button
            onClick={onStartCall}
            className="bg-pink-600 hover:bg-pink-700 text-white mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Start Reading'}
          </Button>
        )}

        {isConnected && (
          <div className="flex space-x-2 mt-2">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full ${isMuted ? 'bg-red-900/30' : 'bg-gray-700/30'}`}
              onClick={onToggleMute}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full ${!isVideoOn ? 'bg-red-900/30' : 'bg-gray-700/30'}`}
              onClick={onToggleVideo}
            >
              {isVideoOn ? (
                <VideoIcon className="h-4 w-4" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="ml-2"
              onClick={onEndCall}
            >
              End Call
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-sm text-yellow-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Establishing connection...</span>
          </div>
        )}

        {/* Debug info */}
        {showDebug && (
          <div className="mt-3 pt-3 border-t border-gray-700 text-xs">
            <div className="font-mono space-y-1">
              <div>ICE State: {iceConnectionState}</div>
              <div>Gathering: {iceGatheringState}</div>
              <div>Signaling: {signalingState}</div>
              <div>Connection: {peerConnectionState}</div>
            </div>
          </div>
        )}

        <button 
          onClick={toggleDebug}
          className="text-xs text-gray-400 hover:text-white mt-2 text-left"
        >
          {showDebug ? 'Hide debug' : 'Show debug info'}
        </button>
      </div>
    </div>
  );
};
