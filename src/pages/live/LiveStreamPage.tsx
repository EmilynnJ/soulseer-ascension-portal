import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Users, 
  Gift, 
  Heart, 
  MessageCircle, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  X,
  Send,
  DollarSign
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface LiveStream {
  id: string;
  reader_id: string;
  reader_name: string;
  reader_avatar: string;
  title: string;
  description: string;
  viewer_count: number;
  is_active: boolean;
  created_at: string;
  specialties: string[];
}

interface ChatMessage {
  id: string;
  user_name: string;
  message: string;
  timestamp: string;
  is_gift?: boolean;
  gift_amount?: number;
}

interface Gift {
  id: string;
  name: string;
  cost: number;
  emoji: string;
}

const LiveStreamPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(100);
  const [showGifts, setShowGifts] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const gifts: Gift[] = [
    { id: '1', name: 'Crystal', cost: 1.99, emoji: '💎' },
    { id: '2', name: 'Candle', cost: 2.99, emoji: '🕯️' },
    { id: '3', name: 'Rose', cost: 4.99, emoji: '🌹' },
    { id: '4', name: 'Star', cost: 9.99, emoji: '⭐' },
    { id: '5', name: 'Golden Aura', cost: 19.99, emoji: '✨' },
    { id: '6', name: 'Sacred Blessing', cost: 49.99, emoji: '🙏' },
  ];

  useEffect(() => {
    fetchLiveStream();
    fetchUserProfile();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addRandomChatMessage();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchLiveStream = async () => {
    try {
      // This would be a real API call
      const mockStream: LiveStream = {
        id: id || '1',
        reader_id: 'reader-1',
        reader_name: 'Emilynn Rose',
        reader_avatar: 'https://i.postimg.cc/s2ds9RtC/FOUNDER.jpg',
        title: 'Live Tarot Reading & Spiritual Guidance',
        description: 'Join me for live readings and spiritual insights. Ask your questions in chat!',
        viewer_count: 127,
        is_active: true,
        created_at: new Date().toISOString(),
        specialties: ['Tarot', 'Love Guidance', 'Spiritual Healing', 'Mediumship'],
      };
      
      setLiveStream(mockStream);
      
      // Add some initial chat messages
      const initialMessages: ChatMessage[] = [
        {
          id: '1',
          user_name: 'SoulSeeker123',
          message: 'Thank you for the beautiful reading! 🙏',
          timestamp: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: '2',
          user_name: 'MysticMoon',
          message: 'Your energy is so calming ✨',
          timestamp: new Date(Date.now() - 45000).toISOString(),
        },
        {
          id: '3',
          user_name: 'StarChild777',
          message: '',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          is_gift: true,
          gift_amount: 4.99,
        },
      ];
      
      setChatMessages(initialMessages);
    } catch (error) {
      console.error('Failed to fetch live stream:', error);
      toast.error('Failed to load live stream');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const addRandomChatMessage = () => {
    const randomMessages = [
      'This is so helpful! 💜',
      'Amazing insights as always',
      'Can you do a reading for me next?',
      'Your energy is incredible ✨',
      'Thank you for this guidance 🙏',
    ];
    
    const randomUsers = [
      'SpiritGuide',
      'LightWorker',
      'CosmicSoul',
      'MysticHeart',
      'AuraReader',
    ];
    
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user_name: randomUsers[Math.floor(Math.random() * randomUsers.length)],
      message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages(prev => [...prev, newMsg]);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !userProfile) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      user_name: userProfile.full_name || 'You',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleSendGift = async (gift: Gift) => {
    if (!userProfile) {
      toast.error('Please sign in to send gifts');
      return;
    }

    if (userProfile.wallet_balance < gift.cost) {
      toast.error('Insufficient balance. Please add funds to your wallet.');
      return;
    }

    try {
      // This would be a real API call to process the gift
      const giftMessage: ChatMessage = {
        id: Date.now().toString(),
        user_name: userProfile.full_name,
        message: `sent a ${gift.name} ${gift.emoji}`,
        timestamp: new Date().toISOString(),
        is_gift: true,
        gift_amount: gift.cost,
      };
      
      setChatMessages(prev => [...prev, giftMessage]);
      setShowGifts(false);
      toast.success(`Gift sent! ${gift.emoji}`);
    } catch (error) {
      console.error('Failed to send gift:', error);
      toast.error('Failed to send gift');
    }
  };

  const handleEndStream = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading Live Stream...
          </div>
        </div>
      </div>
    );
  }

  if (!liveStream) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-['Playfair_Display'] mb-4">
            Live stream not found
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-pink-500 to-purple-600"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Container */}
        <div className="relative flex-1 bg-black">
          {/* Placeholder for video stream */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
            <div className="text-center">
              {/* Reader Avatar */}
              <Avatar className="h-32 w-32 mx-auto mb-6 border-4 border-pink-500">
                <AvatarImage src={liveStream.reader_avatar} alt={liveStream.reader_name} />
                <AvatarFallback className="bg-pink-500 text-white text-4xl">
                  {liveStream.reader_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Live Badge */}
              <Badge className="bg-red-500 text-white text-lg px-4 py-2 mb-4 animate-pulse">
                🔴 LIVE
              </Badge>
              
              <h2 className="font-['Playfair_Display'] text-3xl text-white mb-2">
                {liveStream.reader_name}
              </h2>
              <p className="text-gray-300 text-lg mb-4">{liveStream.title}</p>
              
              {/* Specialties */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {liveStream.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="bg-purple-500/20 text-purple-400">
                    {specialty}
                  </Badge>
                ))}
              </div>
              
              {/* Viewer Count */}
              <div className="flex items-center justify-center space-x-2 text-white">
                <Users className="w-5 h-5" />
                <span className="text-lg">{liveStream.viewer_count} viewers</span>
              </div>
            </div>
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-2">
            <Button
              size="sm"
              variant={isVideoEnabled ? "default" : "destructive"}
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant={isAudioEnabled ? "default" : "destructive"}
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            >
              {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVolume(volume > 0 ? 0 : 100)}
            >
              {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>

          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Maximize className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="destructive" onClick={handleEndStream}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat & Gifts Sidebar */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Stream Info Header */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-medium mb-2">{liveStream.title}</h3>
          <p className="text-gray-400 text-sm mb-3">{liveStream.description}</p>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
              onClick={() => setShowGifts(!showGifts)}
            >
              <Gift className="w-4 h-4 mr-2" />
              Send Gift
            </Button>
            
            <Button size="sm" variant="outline" className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Follow
            </Button>
          </div>
        </div>

        {/* Gifts Panel */}
        {showGifts && (
          <div className="p-4 border-b border-gray-700 bg-gray-750">
            <h4 className="text-white font-medium mb-3">Send a Gift</h4>
            <div className="grid grid-cols-2 gap-2">
              {gifts.map((gift) => (
                <Button
                  key={gift.id}
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center p-3 h-auto border-gray-600 hover:border-pink-500"
                  onClick={() => handleSendGift(gift)}
                >
                  <span className="text-2xl mb-1">{gift.emoji}</span>
                  <span className="text-xs text-gray-300">{gift.name}</span>
                  <span className="text-xs text-green-400">${gift.cost}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((message) => (
            <div key={message.id} className="text-sm">
              {message.is_gift ? (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded p-2">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-400 font-medium">{message.user_name}</span>
                    <span className="text-gray-300">{message.message}</span>
                    <span className="text-green-400 font-medium">${message.gift_amount}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-pink-400 font-medium">{message.user_name}:</span>
                  <span className="text-gray-300 ml-2">{message.message}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={userProfile ? "Type a message..." : "Sign in to chat"}
              className="flex-1 bg-gray-700 border-gray-600 text-white"
              disabled={!userProfile}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !userProfile}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPage;