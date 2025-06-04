import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Moon, User, Video, Calendar, Users } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: User,
      title: 'Expert Readers',
      description: 'Connect with verified psychic readers and spiritual advisors',
    },
    {
      icon: Video,
      title: 'Live Sessions',
      description: 'Real-time chat, voice, and video readings available 24/7',
    },
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Book sessions that fit your schedule with flexible timing',
    },
    {
      icon: Users,
      title: 'Spiritual Community',
      description: 'Join a supportive community of seekers and spiritual enthusiasts',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-mystic-900/20 to-celestial-900/20 backdrop-blur-sm"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="float mb-8">
            <Moon className="h-16 w-16 text-mystic-400 mx-auto glow-mystic" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient-mystic">
            Unlock Your Soul's Journey
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Connect with gifted psychic readers and spiritual guides through our mystical platform. 
            Discover your path through divine wisdom and celestial insight.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/readers">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white px-8 py-3 text-lg glow-mystic"
              >
                Find Your Reader
              </Button>
            </Link>
            <Link to="/live">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-mystic-400 text-mystic-400 hover:bg-mystic-400 hover:text-black px-8 py-3 text-lg"
              >
                Start Live Reading
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gradient-mystic mb-4">
              Experience Divine Guidance
            </h2>
            <p className="text-xl text-gray-300">
              Discover the magic of spiritual connection through our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-mystic-900/20 border-mystic-800/30 hover:bg-mystic-900/30 transition-all duration-300 hover:glow-mystic">
                <CardContent className="p-6 text-center">
                  <feature.icon className="h-12 w-12 text-mystic-400 mx-auto mb-4 float" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-gradient-mystic mb-2">10,000+</div>
              <div className="text-gray-300">Readings Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gradient-mystic mb-2">500+</div>
              <div className="text-gray-300">Verified Readers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gradient-mystic mb-2">24/7</div>
              <div className="text-gray-300">Available Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="sparkle mb-8">
            <Star className="h-16 w-16 text-divine-400 mx-auto glow-divine" />
          </div>
          <h2 className="text-4xl font-bold text-gradient-mystic mb-6">
            Begin Your Spiritual Journey Today
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of seekers who have found clarity and purpose through our platform
          </p>
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-divine-600 to-mystic-600 hover:from-divine-700 hover:to-mystic-700 text-white px-12 py-4 text-xl glow-divine"
            >
              Start Your Journey
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;