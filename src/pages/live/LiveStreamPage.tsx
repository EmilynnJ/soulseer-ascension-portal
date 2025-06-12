import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LiveStream } from '@/components/reading/LiveStream';

const LiveStreamPage = () => {
  const { id: streamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [readerProfile, setReaderProfile] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);

  // Fetch stream and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        setUserProfile(profile);
        
        // Get stream details
        const { data: streamData, error: streamError } = await supabase
          .from('live_streams')
          .select('*')
          .eq('id', streamId)
          .single();
        
        if (streamError) throw streamError;
        setStream(streamData);
        
        // Determine if user is host (reader)
        const userIsHost = profile.role === 'reader' && profile.id === streamData.reader_id;
        setIsHost(userIsHost);
        
        // Get reader profile
        const { data: reader, error: readerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', streamData.reader_id)
          .single();
        
        if (readerError) throw readerError;
        setReaderProfile(reader);
        
        // Check if stream is active or user is host
        if (streamData.status !== 'active' && !userIsHost) {
          throw new Error('This stream is not currently active');
        }
        
      } catch (error) {
        console.error('Error fetching stream data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load stream');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [streamId]);

  // Handle stream end
  const handleStreamEnd = () => {
    navigate('/');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading stream...</p>
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
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Show live stream
  if (stream && userProfile && readerProfile) {
    return (
      <LiveStream
        streamId={streamId!}
        readerId={stream.reader_id}
        readerName={readerProfile.display_name || readerProfile.email}
        isHost={isHost}
        onEnd={handleStreamEnd}
      />
    );
  }

  return null;
};

export default LiveStreamPage;