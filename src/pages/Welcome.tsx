import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Calendar, MessageSquare, Video } from 'lucide-react';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-mystic-950 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Star className="h-16 w-16 text-mystic-400 glow-mystic float" />
            <span className="text-4xl font-bold text-gradient-mystic">SoulSeer</span>
          </div>
          <h1 className="text-5xl font-bold text-gradient-mystic mb-4">
            Welcome to Your Spiritual Journey! ✨
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Your account has been created successfully. You're now part of our mystical community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-mystic-900/20 border-mystic-800/30 hover:glow-mystic transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-mystic-400 mx-auto mb-4 float" />
              <h3 className="text-lg font-semibold text-white mb-2">Book a Reading</h3>
              <p className="text-gray-400 text-sm">Connect with gifted readers for personalized guidance</p>
            </CardContent>
          </Card>

          <Card className="bg-celestial-900/20 border-celestial-800/30 hover:glow-mystic transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Video className="h-12 w-12 text-celestial-400 mx-auto mb-4 float" />
              <h3 className="text-lg font-semibold text-white mb-2">Live Sessions</h3>
              <p className="text-gray-400 text-sm">Instant video and voice readings available 24/7</p>
            </CardContent>
          </Card>

          <Card className="bg-divine-900/20 border-divine-800/30 hover:glow-divine transition-all duration-300">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-divine-400 mx-auto mb-4 float" />
              <h3 className="text-lg font-semibold text-white mb-2">Messages</h3>
              <p className="text-gray-400 text-sm">Chat with readers and community members</p>
            </CardContent>
          </Card>

          <Card className="bg-mystic-900/20 border-mystic-800/30 hover:glow-mystic transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 text-mystic-400 mx-auto mb-4 float" />
              <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
              <p className="text-gray-400 text-sm">Join discussions and share your spiritual insights</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Link to="/dashboard">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white px-12 py-4 text-xl glow-mystic"
            >
              Enter Your Dashboard
            </Button>
          </Link>
          
          <div className="text-gray-400">
            or{' '}
            <Link to="/" className="text-mystic-400 hover:text-mystic-300">
              explore the platform first
            </Link>
          </div>
        </div>

        <div className="mt-12 p-6 bg-black/20 rounded-lg border border-mystic-800/30">
          <h3 className="text-lg font-semibold text-gradient-mystic mb-4">Quick Start Tips</h3>
          <ul className="text-left space-y-2 text-gray-400">
            <li>• Complete your profile to get personalized recommendations</li>
            <li>• Browse our verified readers and find your perfect match</li>
            <li>• Join the community to connect with fellow seekers</li>
            <li>• Book your first reading to begin your spiritual journey</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Welcome;