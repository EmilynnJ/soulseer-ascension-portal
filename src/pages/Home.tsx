import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Video, MessageCircle, Phone } from 'lucide-react';

const Home = () => {
  const [onlineReaders, setOnlineReaders] = useState<any[]>([]);
  const [activeStreams, setActiveStreams] = useState<any[]>([]);
  const [featuredServices, setFeaturedServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch online readers
        const { data: readers } = await supabase
          .from('profiles')
          .select('id, display_name, profile_image, bio, specialties, rating_avg, chat_rate, audio_rate, video_rate')
          .eq('role', 'reader')
          .eq('status', 'online')
          .order('rating_avg', { ascending: false })
          .limit(6);
        
        setOnlineReaders(readers || []);
        
        // Fetch active streams
        const { data: streams } = await supabase
          .from('live_streams')
          .select('id, title, reader_id, viewer_count, thumbnail, profiles(display_name, profile_image)')
          .eq('status', 'active')
          .order('viewer_count', { ascending: false })
          .limit(3);
        
        setActiveStreams(streams || []);
        
        // Fetch featured services
        const { data: services } = await supabase
          .from('products')
          .select('id, name, description, price, image_url, category')
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(3);
        
        setFeaturedServices(services || []);
        
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://i.postimg.cc/tRLSgCPb/HERO-IMAGE-1.jpg" 
            alt="SoulSeer Hero" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-['Alex_Brush'] text-6xl md:text-8xl text-pink-500 mb-6">SoulSeer</h1>
          <p className="font-['Playfair_Display'] text-2xl md:text-3xl text-white mb-8">A Community of Gifted Psychics</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700 text-white">
              <Link to="/readings">Get a Reading</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-pink-500 text-pink-500 hover:bg-pink-950">
              <Link to="/live">Watch Live</Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Online Readers Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-['Alex_Brush'] text-4xl text-pink-500">Online Now</h2>
          <Link to="/readings" className="text-pink-400 hover:text-pink-300">View All</Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700 h-64 animate-pulse"></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {onlineReaders.map((reader) => (
              <Link to={`/readers/${reader.id}`} key={reader.id}>
                <Card className="bg-gray-800 border-gray-700 overflow-hidden hover:border-pink-500 transition-all">
                  <div className="flex p-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden mr-4 flex-shrink-0">
                      <img 
                        src={reader.profile_image || 'https://via.placeholder.com/80'} 
                        alt={reader.display_name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-['Playfair_Display'] text-lg font-semibold">{reader.display_name}</h3>
                      <div className="flex items-center text-yellow-400 mb-2">
                        <Star className="w-4 h-4 mr-1" />
                        <span>{reader.rating_avg?.toFixed(1) || '5.0'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {reader.specialties?.slice(0, 3).map((specialty: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-3 flex justify-between items-center">
                    <div className="flex gap-3">
                      {reader.chat_rate && (
                        <div className="flex items-center text-sm">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          <span>${(reader.chat_rate / 100).toFixed(2)}/min</span>
                        </div>
                      )}
                      {reader.audio_rate && (
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-1" />
                          <span>${(reader.audio_rate / 100).toFixed(2)}/min</span>
                        </div>
                      )}
                      {reader.video_rate && (
                        <div className="flex items-center text-sm">
                          <Video className="w-4 h-4 mr-1" />
                          <span>${(reader.video_rate / 100).toFixed(2)}/min</span>
                        </div>
                      )}
                    </div>
                    <Badge className="bg-green-600">Online</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
      
      {/* Live Streams Section */}
      {activeStreams.length > 0 && (
        <section className="py-16 px-4 max-w-7xl mx-auto bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-['Alex_Brush'] text-4xl text-pink-500">Live Now</h2>
            <Link to="/live" className="text-pink-400 hover:text-pink-300">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeStreams.map((stream) => (
              <Link to={`/live/${stream.id}`} key={stream.id}>
                <Card className="bg-gray-900 border-gray-700 overflow-hidden hover:border-pink-500 transition-all">
                  <div className="relative">
                    <img 
                      src={stream.thumbnail || 'https://via.placeholder.com/400x225'} 
                      alt={stream.title} 
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-red-600 flex items-center">
                      <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                      LIVE
                    </Badge>
                    <Badge className="absolute bottom-2 right-2 bg-black/70">
                      {stream.viewer_count} watching
                    </Badge>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                        <img 
                          src={stream.profiles?.profile_image || 'https://via.placeholder.com/32'} 
                          alt={stream.profiles?.display_name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-['Playfair_Display'] text-lg">{stream.profiles?.display_name}</h3>
                    </div>
                    <p className="text-gray-300 line-clamp-2">{stream.title}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
      
      {/* Featured Services Section */}
      {featuredServices.length > 0 && (
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-['Alex_Brush'] text-4xl text-pink-500">Featured Services</h2>
            <Link to="/shop" className="text-pink-400 hover:text-pink-300">Visit Shop</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <Link to={`/shop/products/${service.id}`} key={service.id}>
                <Card className="bg-gray-800 border-gray-700 overflow-hidden hover:border-pink-500 transition-all">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={service.image_url || 'https://via.placeholder.com/400x225'} 
                      alt={service.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <Badge className="mb-2">{service.category}</Badge>
                    <h3 className="font-['Playfair_Display'] text-lg mb-2">{service.name}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">${(service.price / 100).toFixed(2)}</span>
                      <Button size="sm" className="bg-pink-600 hover:bg-pink-700">View Details</Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
      
      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-pink-900/50 to-purple-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-['Alex_Brush'] text-4xl text-pink-500 mb-4">Begin Your Spiritual Journey</h2>
          <p className="font-['Playfair_Display'] text-xl mb-8">Connect with our gifted psychics for guidance, clarity, and insight.</p>
          <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700 text-white">
            <Link to="/signup">Join SoulSeer Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;