import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Video, 
  MessageCircle, 
  Zap, 
  Shield, 
  Heart,
  Clock,
  Users,
  Gift,
  ChevronRight,
  Play,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FeaturedReader {
  id: string;
  full_name: string;
  avatar_url?: string;
  specialties: string[];
  rating: number;
  total_reviews: number;
  rate_per_minute: number;
  is_online: boolean;
  bio: string;
}

const Home = () => {
  const [featuredReaders, setFeaturedReaders] = useState<FeaturedReader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedReaders();
  }, []);

  const fetchFeaturedReaders = async () => {
    try {
      const response = await fetch('/api/sessions/available-readers?limit=3&featured=true');
      if (response.ok) {
        const readers = await response.json();
        setFeaturedReaders(readers);
      }
    } catch (error) {
      console.error('Failed to fetch featured readers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const features = [
    {
      icon: Video,
      title: 'Live Video Readings',
      description: 'Connect face-to-face with gifted psychics through crystal-clear video calls.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: MessageCircle,
      title: 'Real-time Chat',
      description: 'Get instant guidance through our secure messaging platform.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Zap,
      title: 'Per-Minute Billing',
      description: 'Pay only for the time you use. No subscription fees or hidden costs.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Verified Readers',
      description: 'All our psychics are thoroughly vetted and verified for authenticity.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Heart,
      title: 'Compassionate Guidance',
      description: 'Receive non-judgmental, heart-centered spiritual advice.',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Sparkles,
      title: 'Live Streaming',
      description: 'Watch live spiritual sessions and connect with our community.',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      content: 'The reading I received was incredibly accurate and helped me navigate a difficult period in my life. The reader was compassionate and insightful.',
      rating: 5,
      specialty: 'Love & Relationships'
    },
    {
      name: 'Michael K.',
      content: 'I was skeptical at first, but the guidance I received about my career path was spot-on. It gave me the confidence to make important decisions.',
      rating: 5,
      specialty: 'Career & Finance'
    },
    {
      name: 'Jennifer L.',
      content: 'The spiritual guidance helped me connect with my inner wisdom. The reader\'s energy was calming and the insights were profound.',
      rating: 5,
      specialty: 'Spiritual Growth'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Hero Thumbnail Image */}
            <div className="flex justify-center mb-8">
              <img
                src="https://i.postimg.cc/tRLSgCPb/HERO-IMAGE-1.jpg"
                alt="SoulSeer Spiritual Guidance"
                className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain rounded-2xl shadow-2xl border-4 border-pink-500/30 hover:border-pink-500/60 transition-all duration-300"
              />
            </div>
            
            <h1 className="font-['Alex_Brush'] text-6xl md:text-8xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 mb-6 animate-pulse">
              SoulSeer
            </h1>
            
            <h2 className="font-['Playfair_Display'] text-2xl md:text-4xl lg:text-5xl text-white mb-8 leading-tight">
              Connect with Your <span className="text-pink-500">Inner Wisdom</span>
              <br />
              Through Authentic <span className="text-purple-400">Psychic Guidance</span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join our soul tribe of gifted psychics and seekers. Experience live video readings,
              real-time chat sessions, and spiritual community like never before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Your Journey
              </Button>
              
              <Link to="/readers">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transform hover:scale-105 transition-all duration-200"
                >
                  Browse Readers
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl text-white mb-6">
              Why Choose <span className="text-pink-500">SoulSeer</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're more than just an app—we're a spiritual community dedicated to ethical, 
              compassionate guidance that honors both readers and seekers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:border-pink-500/50 transition-all duration-300 group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Readers Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl text-white mb-6">
              Meet Our <span className="text-pink-500">Gifted Readers</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Connect with verified psychics who are passionate about providing authentic, 
              heart-centered guidance for your spiritual journey.
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-gray-800/80 backdrop-blur-sm border-gray-700 animate-pulse">
                  <CardHeader className="text-center">
                    <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4"></div>
                    <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredReaders.map((reader) => (
                <Card key={reader.id} className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:border-pink-500/50 transition-all duration-300 group">
                  <CardHeader className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <img
                        src={reader.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reader.full_name)}&size=96&background=ec4899&color=ffffff`}
                        alt={reader.full_name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-pink-500"
                      />
                      {reader.is_online && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="text-white text-xl mb-2">{reader.full_name}</CardTitle>
                    
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex items-center space-x-1">
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
                      </div>
                      <span className="text-gray-400 text-sm ml-2">
                        {reader.rating.toFixed(1)} ({reader.total_reviews} reviews)
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 justify-center mb-3">
                      {reader.specialties.slice(0, 3).map((specialty) => (
                        <Badge
                          key={specialty}
                          variant="secondary"
                          className="bg-pink-500/20 text-pink-400 text-xs"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-green-400 font-medium">
                      ${reader.rate_per_minute.toFixed(2)}/min
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-300 text-sm text-center mb-4 line-clamp-3">
                      {reader.bio}
                    </p>
                    
                    <Button
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      onClick={() => navigate('/signup')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Connect Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/readers">
              <Button
                variant="outline"
                size="lg"
                className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
              >
                View All Readers
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl text-white mb-6">
              Soul <span className="text-pink-500">Testimonials</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Hear from our community about their transformative experiences with SoulSeer readers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <blockquote className="text-gray-300 mb-4 leading-relaxed">
                    "{testimonial.content}"
                  </blockquote>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{testimonial.name}</div>
                      <div className="text-pink-400 text-sm">{testimonial.specialty}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-12 border border-pink-500/30">
            <Sparkles className="w-16 h-16 text-pink-500 mx-auto mb-6" />
            
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl text-white mb-6">
              Ready to <span className="text-pink-500">Transform</span> Your Life?
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of souls who have found clarity, healing, and purpose 
              through authentic psychic guidance. Your spiritual journey awaits.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Gift className="w-5 h-5 mr-2" />
                Start Free Today
              </Button>
              
              <Link to="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
                >
                  Learn More
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;