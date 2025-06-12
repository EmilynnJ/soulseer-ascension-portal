import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ConnectionStatusProps = {
  isConnected: boolean;
  isLoading: boolean;
  connectionQuality?: number;
  onRetry?: () => void;
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isLoading,
  connectionQuality = 100,
  onRetry,
}) => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  
  // Update status based on props
  useEffect(() => {
    if (isLoading) {
      setStatus('connecting');
    } else if (isConnected) {
      setStatus('connected');
    } else {
      setStatus('disconnected');
    }
  }, [isConnected, isLoading]);
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
    }
  };
  
  // Get quality color
  const getQualityColor = (quality: number) => {
    if (quality > 70) return 'text-green-500';
    if (quality > 30) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get quality icon
  const getQualityIcon = (quality: number) => {
    if (quality > 30) {
      return <Wifi className={`h-4 w-4 ${getQualityColor(quality)}`} />;
    } else {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };
  
  return (
    <div className="bg-black/70 text-white p-3 rounded-lg">
      <div className="flex flex-col space-y-2">
        {/* Connection status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} flex-shrink-0`}></div>
          <span className="text-sm">
            {status === 'connected' 
              ? 'Connected'
              : status === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'}
          </span>
        </div>
        
        {/* Connection quality (only show when connected) */}
        {status === 'connected' && (
          <div className="flex items-center space-x-2">
            {getQualityIcon(connectionQuality)}
            <span className="text-sm">
              Quality: <span className={getQualityColor(connectionQuality)}>{connectionQuality}%</span>
            </span>
          </div>
        )}
        
        {/* Loading indicator */}
        {status === 'connecting' && (
          <div className="flex items-center space-x-2 text-yellow-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Establishing connection...</span>
          </div>
        )}
        
        {/* Retry button (only show when disconnected) */}
        {status === 'disconnected' && onRetry && (
          <Button 
            onClick={onRetry}
            size="sm"
            className="bg-pink-600 hover:bg-pink-700 text-white mt-1"
          >
            Reconnect
          </Button>
        )}
      </div>
    </div>
  );
};