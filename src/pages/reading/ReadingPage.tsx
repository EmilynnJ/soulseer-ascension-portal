import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ReadingInterface } from '@/components/reading/ReadingInterface';

const ReadingPage = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [readerProfile, setReaderProfile] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [isReader, setIsReader] = useState(false);

  // Fetch session and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user
        if (!user) {
          throw new Error('Not authenticated');
        }
        
        // Get user profile
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        setUserProfile(profile);
        
        // Get session details
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        
        if (sessionError) throw sessionError;
        setSession(sessionData);
        
        // Determine if user is reader or client
        const userIsReader = profile.role === 'reader' && profile.id === sessionData.reader_id;
        setIsReader(userIsReader);
        
        // Get reader profile
          .from('profiles')
          .select('*')
          .eq('id', sessionData.reader_id)
          .single();
        
        if (readerError) throw readerError;
        setReaderProfile(reader);
        
        // Get client profile
          .from('profiles')
          .select('*')
          .eq('id', sessionData.client_id)
          .single();
        
        if (clientError) throw clientError;
        setClientProfile(client);
        
        // Check if user is authorized to access this session
        if (user.id !== sessionData.reader_id && user.id !== sessionData.client_id) {
          throw new Error('You are not authorized to access this session');
        }
        
        // For clients, check if they have sufficient balance
        if (!userIsReader && profile.balance < sessionData.rate) {
          throw new Error('Insufficient balance. Please add funds to continue.');
        }
        
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [sessionId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Preparing your reading session...</p>
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

  // Show reading interface
  if (session && userProfile && readerProfile && clientProfile) {
    return (
      <ReadingInterface
        sessionId={sessionId}
        readerId={session.reader_id}
        clientId={session.client_id}
        sessionType={session.session_type}
        rate={session.rate}
        initialBalance={userProfile.balance || 0}
        isReader={isReader}
        userName={userProfile.display_name || userProfile.email}
        peerName={isReader ? clientProfile.display_name || clientProfile.email : readerProfile.display_name || readerProfile.email}
      />
    );
  }

  return null;
};

export default ReadingPage;