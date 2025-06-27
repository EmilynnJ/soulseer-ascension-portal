import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MessageCircle, Phone, Video, Search, Filter, Heart, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Reader {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  specialties?: string[];
  avatar_url?: string;
  is_online: boolean;
  chat_rate: number;
  audio_rate: number;
  video_rate: number;
  rating: number;
  total_sessions: number;
  years_experience: number;
}

const Readers: React.FC = () => {
  const navigate = useNavigate();
  const [readers, setReaders] = useState<Reader[]>([]);
  const [filteredReaders, setFilteredReaders] = useState<Reader[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReaders();
  }, []);

  useEffect(() => {
    filterReaders();
  }, [readers, searchTerm, specialtyFilter, sortBy, showOnlineOnly]);

  const loadReaders = async () => {
    try {
      // For now, we'll create some sample readers data
      // In a real app, this would come from the database
      const sampleReaders: Reader[] = [
        {
          id: '1',
          first_name: 'Luna',
          last_name: 'Mystic',
          email: 'luna@example.com',
          bio: 'Third-generation psychic with expertise in tarot, crystal healing, and spiritual guidance. I connect with your energy to provide clarity on love, career, and life purpose.',
          specialties: ['Tarot Reading', 'Love & Relationships', 'Career Guidance', 'Crystal Healing'],
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b618?w=400',
          is_online: true,
          chat_rate: 3.99,
          audio_rate: 4.99,
          video_rate: 6.99,
          rating: 4.9,
          total_sessions: 1247,
          years_experience: 12
        },
        {
          id: '2',
          first_name: 'Aurora',
          last_name: 'Divine',
          email: 'aurora@example.com',
          bio: 'Intuitive empath specializing in past life readings and chakra balancing. I help you understand your soul\'s journey and release energetic blocks.',
          specialties: ['Past Life Reading', 'Chakra Healing', 'Energy Cleansing', 'Spiritual Awakening'],
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
          is_online: false,
          chat_rate: 2.99,
          audio_rate: 3.99,
          video_rate: 5.99,
          rating: 4.8,
          total_sessions: 892,
          years_experience: 8
        },
        {
          id: '3',
          first_name: 'Sage',
          last_name: 'Moonwhisper',
          email: 'sage@example.com',
          bio: 'Celtic priestess with deep knowledge of ancient wisdom, runes, and divination. I guide you through life\'s mysteries with compassion and insight.',
          specialties: ['Rune Reading', 'Celtic Wisdom', 'Dream Interpretation', 'Meditation Guidance'],
          avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
          is_online: true,
          chat_rate: 4.99,
          audio_rate: 5.99,
          video_rate: 7.99,
          rating: 4.7,
          total_sessions: 634,
          years_experience: 15
        },
        {
          id: '4',
          first_name: 'River',
          last_name: 'Starseed',
          email: 'river@example.com',
          bio: 'Clairvoyant medium connecting you with spirit guides and departed loved ones. I bring messages of healing, closure, and divine guidance.',
          specialties: ['Medium Reading', 'Spirit Communication', 'Angel Messages', 'Grief Healing'],
          avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
          is_online: true,
          chat_rate: 5.99,
          audio_rate: 6.99,
          video_rate: 8.99,
          rating: 4.9,
          total_sessions: 1456,
          years_experience: 18
        }
      ];

      setReaders(sampleReaders);
    } catch (error) {
      console.error('Error loading readers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReaders = () => {
    let filtered = [...readers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reader => 
        `${reader.first_name} ${reader.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reader.specialties?.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Specialty filter
    if (specialtyFilter !== 'all') {
      filtered = filtered.filter(reader =>
        reader.specialties?.includes(specialtyFilter)
      );
    }

    // Online filter
    if (showOnlineOnly) {
      filtered = filtered.filter(reader => reader.is_online);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.years_experience - a.years_experience;
        case 'sessions':
          return b.total_sessions - a.total_sessions;
        case 'price-low':
          return a.chat_rate - b.chat_rate;
        case 'price-high':
          return b.chat_rate - a.chat_rate;
        default:
          return 0;
      }
    });

    setFilteredReaders(filtered);
  };

  const startSession = (readerId: string, sessionType: 'chat' | 'audio' | 'video') => {
    // Navigate to session interface
    navigate(`/session/${readerId}?type=${sessionType}`);
  };

  const allSpecialties = [...new Set(readers.flatMap(reader => reader.specialties || []))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading Readers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-pink-400 font-['Alex_Brush'] mb-4">
            Find Your Reader
          </h1>
          <p className="text-xl text-white/90 font-['Playfair_Display'] max-w-2xl mx-auto">
            Connect with authentic psychic readers who can guide you on your spiritual journey
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-black/40 border-pink-500/30 mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search readers or specialties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/20 border-pink-500/30 text-white placeholder:text-white/60"
                />
              </div>
              
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="bg-black/20 border-pink-500/30 text-white">
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-pink-500/30">
                  <SelectItem value="all">All Specialties</SelectItem>
                  {allSpecialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-black/20 border-pink-500/30 text-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-pink-500/30">
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="experience">Most Experience</SelectItem>
                  <SelectItem value="sessions">Most Sessions</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="online-only"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="online-only" className="text-white font-['Playfair_Display']">
                  Online Only
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReaders.map((reader) => (
            <Card key={reader.id} className="bg-black/40 border-pink-500/30 hover:border-pink-400/50 transition-all">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={reader.avatar_url}
                      alt={`${reader.first_name} ${reader.last_name}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-black ${
                      reader.is_online ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white font-['Playfair_Display'] text-lg">
                      {reader.first_name} {reader.last_name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(reader.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-white/80 text-sm ml-1">
                          {reader.rating} ({reader.total_sessions})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-white/60">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {reader.years_experience} years
                      </div>
                      <Badge className={reader.is_online ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {reader.is_online ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-white/80 font-['Playfair_Display'] text-sm line-clamp-3">
                  {reader.bio}
                </p>

                <div className="flex flex-wrap gap-1">
                  {reader.specialties?.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="outline" className="border-pink-500/30 text-pink-400 text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {reader.specialties && reader.specialties.length > 3 && (
                    <Badge variant="outline" className="border-pink-500/30 text-pink-400 text-xs">
                      +{reader.specialties.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/20 rounded p-2">
                    <MessageCircle className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                    <div className="text-xs text-white/80">${reader.chat_rate}/min</div>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <Phone className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                    <div className="text-xs text-white/80">${reader.audio_rate}/min</div>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <Video className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                    <div className="text-xs text-white/80">${reader.video_rate}/min</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    onClick={() => startSession(reader.id, 'chat')}
                    disabled={!reader.is_online}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Chat Reading
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                      onClick={() => startSession(reader.id, 'audio')}
                      disabled={!reader.is_online}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Audio
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                      onClick={() => startSession(reader.id, 'video')}
                      disabled={!reader.is_online}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Video
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReaders.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold text-white font-['Playfair_Display'] mb-2">
              No readers found
            </h3>
            <p className="text-white/60 font-['Playfair_Display']">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Readers;