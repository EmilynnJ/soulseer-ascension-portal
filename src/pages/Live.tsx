import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Users, 
  Eye, 
  Radio, 
  Clock, 
  Star,
  Heart,
  Share2
} from 'lucide-react';

interface LiveStream {
  id: string;
  reader_name: string;
  reader_avatar: string;
  title: string;
  description: string;
  category: string;
  viewers: number;
  duration: string;
  is_live: boolean;
  thumbnail: string;
  tags: string[];
  price: number;
  rating: number;
}

interface ScheduledStream {
  id: string;
  reader_name: string;
  reader_avatar: string;
  title: string;
  scheduled_time: string;
  category: string;
  expected_duration: number;
  price: number;
  subscribers: number;
}

const Live: React.FC = () => {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [scheduledStreams, setScheduledStreams] = useState<ScheduledStream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveContent();
  }, []);

  const loadLiveContent = async () => {
    try {
      const sampleLiveStreams: LiveStream[] = [
        {
          id: '1',
          reader_name: 'Luna Mystic',
          reader_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b618?w=400',
          title: 'Full Moon Tarot Reading & Energy Healing',
          description: 'Join me for a powerful full moon tarot session where we explore collective energies and personal guidance.',
          category: 'Tarot Reading',
          viewers: 247,
          duration: '1h 23m',
          is_live: true,
          thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600',
          tags: ['Tarot', 'Full Moon', 'Energy Healing', 'Collective Reading'],
          price: 5.99,
          rating: 4.9
        },
        {
          id: '2',
          reader_name: 'River Starseed',
          reader_avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
          title: 'Connecting with Spirit Guides - Open Channel',
          description: 'Live mediumship session connecting with spirit guides and departed loved ones. Questions welcome!',
          category: 'Mediumship',
          viewers: 189,
          duration: '45m',
          is_live: true,
          thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600',
          tags: ['Mediumship', 'Spirit Guides', 'Angel Messages', 'Q&A'],
          price: 7.99,
          rating: 4.8
        }
      ];

      const sampleScheduledStreams: ScheduledStream[] = [
        {
          id: '1',
          reader_name: 'Sage Moonwhisper',
          reader_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
          title: 'Celtic Wisdom Circle - Samhain Special',
          scheduled_time: '2024-01-15T20:00:00Z',
          category: 'Celtic Wisdom',
          expected_duration: 90,
          price: 12.99,
          subscribers: 89
        },
        {
          id: '2',
          reader_name: 'Luna Mystic',
          reader_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b618?w=400',
          title: 'New Moon Manifestation Ritual',
          scheduled_time: '2024-01-16T19:30:00Z',
          category: 'Manifestation',
          expected_duration: 60,
          price: 8.99,
          subscribers: 134
        }
      ];

      setLiveStreams(sampleLiveStreams);
      setScheduledStreams(sampleScheduledStreams);
    } catch (error) {
      console.error('Error loading live content:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinStream = (streamId: string) => {
    window.open(`/stream/${streamId}`, '_blank');
  };

  const subscribeToStream = (streamId: string) => {
    console.log('Subscribing to stream:', streamId);
  };

  const categories = ['all', 'Tarot Reading', 'Mediumship', 'Celtic Wisdom', 'Manifestation'];
  const filteredStreams = selectedCategory === 'all' 
    ? liveStreams 
    : liveStreams.filter(stream => stream.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading Live Content...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-pink-400 font-['Alex_Brush'] mb-4">
            Live Spiritual Sessions
          </h1>
          <p className="text-xl text-white/90 font-['Playfair_Display'] max-w-2xl mx-auto">
            Join live readings, group sessions, and spiritual experiences with our gifted readers
          </p>
        </div>

        <Tabs defaultValue="live" className="space-y-8">
          <TabsList className="bg-black/40 border-pink-500/30 grid w-full grid-cols-2 lg:w-96 mx-auto">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400"
            >
              <Radio className="w-4 h-4 mr-2" />
              Live Now
            </TabsTrigger>
            <TabsTrigger 
              value="scheduled" 
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400"
            >
              <Clock className="w-4 h-4 mr-2" />
              Scheduled
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category 
                    ? "bg-pink-500 hover:bg-pink-600" 
                    : "border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                  }
                >
                  {category === 'all' ? 'All Categories' : category}
                </Button>
              ))}
            </div>

            {/* Live Streams Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStreams.map((stream) => (
                <Card key={stream.id} className="bg-black/40 border-pink-500/30 overflow-hidden hover:border-pink-400/50 transition-all">
                  <div className="relative">
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white animate-pulse">
                        <Radio className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                    </div>

                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/60 text-white">
                        {stream.duration}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                      <div className="flex items-center bg-black/60 rounded px-2 py-1">
                        <Eye className="w-4 h-4 text-white mr-1" />
                        <span className="text-white text-sm">{stream.viewers}</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        className="bg-pink-500 hover:bg-pink-600 rounded-full w-16 h-16 p-0"
                        onClick={() => joinStream(stream.id)}
                      >
                        <Play className="w-8 h-8 text-white fill-current" />
                      </Button>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start space-x-3">
                      <img
                        src={stream.reader_avatar}
                        alt={stream.reader_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-white font-['Playfair_Display'] text-lg line-clamp-2">
                          {stream.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-pink-400 text-sm font-medium">
                            {stream.reader_name}
                          </span>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-white/80 text-xs ml-1">{stream.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-white/80 font-['Playfair_Display'] text-sm line-clamp-2">
                      {stream.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {stream.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="border-pink-500/30 text-pink-400 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-green-400">
                        <span className="font-medium">${stream.price}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="border-pink-500/30 text-pink-400">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="border-pink-500/30 text-pink-400">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      onClick={() => joinStream(stream.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Join Live Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredStreams.length === 0 && (
              <div className="text-center py-12">
                <Radio className="w-16 h-16 text-pink-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold text-white font-['Playfair_Display'] mb-2">
                  No live streams in this category
                </h3>
                <p className="text-white/60 font-['Playfair_Display']">
                  Check back soon or explore other categories
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {scheduledStreams.map((stream) => (
                <Card key={stream.id} className="bg-black/40 border-pink-500/30">
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <img
                        src={stream.reader_avatar}
                        alt={stream.reader_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-white font-['Playfair_Display'] text-xl">
                          {stream.title}
                        </CardTitle>
                        <p className="text-pink-400 font-medium">{stream.reader_name}</p>
                        <Badge className="bg-purple-500/20 text-purple-400 mt-2">
                          {stream.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Scheduled:</span>
                        <div className="text-white font-medium">
                          {new Date(stream.scheduled_time).toLocaleDateString()} at{' '}
                          {new Date(stream.scheduled_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">Duration:</span>
                        <div className="text-white font-medium">{stream.expected_duration} minutes</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-green-400">
                          <span className="font-medium">${stream.price}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-white/80">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{stream.subscribers} subscribed</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                        onClick={() => subscribeToStream(stream.id)}
                      >
                        Subscribe
                      </Button>
                      <Button variant="outline" className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10">
                        Remind Me
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {scheduledStreams.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-pink-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold text-white font-['Playfair_Display'] mb-2">
                  No scheduled streams
                </h3>
                <p className="text-white/60 font-['Playfair_Display']">
                  Check back soon for upcoming spiritual sessions
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Live;