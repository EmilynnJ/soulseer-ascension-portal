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
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center cosmic-dust">
        <div className="absolute inset-0 bg-gradient-to-r from-mystic-900/20 to-celestial-900/20 backdrop-blur-sm"></div>
        <div className="relative max-w-4xl mx-auto">
          <div className="float-slow mb-8 sparkle">
            <Moon className="h-20 w-20 text-mystic-400 mx-auto glow-ethereal pulse-ethereal" />
          </div>
          <h1 className="font-heading text-6xl md:text-8xl mb-6 text-gradient-ethereal">
            SoulSeer
          </h1>
          <p className="font-body text-2xl md:text-3xl text-ethereal-300 mb-4 italic">
            A Community of Gifted Psychics
          </p>
          <p className="font-body text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Connect with gifted psychic readers and spiritual guides through our mystical platform. 
            Discover your path through divine wisdom and celestial insight.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/readers">
              <Button 
                size="lg" 
                className="mystical-card bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white px-10 py-4 text-lg glow-mystic font-body transition-all duration-500 hover:scale-105"
              >
                Find Your Reader
              </Button>
            </Link>
            <Link to="/live">
              <Button 
                size="lg" 
                variant="outline" 
                className="ethereal-border text-mystic-400 hover:bg-mystic-400 hover:text-black px-10 py-4 text-lg font-body transition-all duration-500 hover:scale-105"
              >
                Start Live Reading
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-5xl md:text-6xl text-gradient-divine mb-4">
              Experience Divine Guidance
            </h2>
            <p className="font-body text-xl md:text-2xl text-ethereal-200 italic">
              Discover the magic of spiritual connection through our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="mystical-card transition-all duration-500 hover:glow-ethereal group cursor-pointer">
                <CardContent className="p-8 text-center">
                  <feature.icon className="h-14 w-14 text-mystic-400 mx-auto mb-6 float group-hover:text-ethereal-400 transition-colors duration-300" />
                  <h3 className="font-heading text-2xl text-gradient-mystic mb-3">
                    {feature.title}
                  </h3>
                  <p className="font-body text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-black/30 backdrop-blur-sm relative">
        <div className="absolute inset-0 cosmic-dust opacity-50"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="mystical-card p-8 group hover:glow-mystic transition-all duration-500">
              <div className="font-heading text-5xl md:text-6xl text-gradient-ethereal mb-4 group-hover:scale-110 transition-transform duration-300">10,000+</div>
              <div className="font-body text-lg text-gray-200">Readings Completed</div>
            </div>
            <div className="mystical-card p-8 group hover:glow-celestial transition-all duration-500">
              <div className="font-heading text-5xl md:text-6xl text-gradient-ethereal mb-4 group-hover:scale-110 transition-transform duration-300">500+</div>
              <div className="font-body text-lg text-gray-200">Verified Readers</div>
            </div>
            <div className="mystical-card p-8 group hover:glow-divine transition-all duration-500">
              <div className="font-heading text-5xl md:text-6xl text-gradient-ethereal mb-4 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="font-body text-lg text-gray-200">Available Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="sparkle mb-8 float-slow">
            <Star className="h-20 w-20 text-divine-400 mx-auto glow-divine pulse-ethereal" />
          </div>
          <h2 className="font-heading text-5xl md:text-6xl text-gradient-divine mb-6">
            Begin Your Spiritual Journey Today
          </h2>
          <p className="font-body text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed italic max-w-3xl mx-auto">
            Join thousands of seekers who have found clarity and purpose through our mystical platform
          </p>
          <Link to="/signup">
            <Button 
              size="lg" 
              className="mystical-card bg-gradient-to-r from-divine-600 to-mystic-600 hover:from-divine-700 hover:to-mystic-700 text-white px-12 py-4 text-xl glow-divine font-body transition-all duration-500 hover:scale-110"
            >
              Start Your Journey ✨
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;