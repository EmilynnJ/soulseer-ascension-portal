import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <Star className="w-10 h-10 text-white" />
          </div>
          <span className="font-['Alex_Brush'] text-5xl text-pink-500">
            SoulSeer
          </span>
        </div>

        {/* 404 Content */}
        <div className="mb-8">
          <h1 className="font-['Playfair_Display'] text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
            404
          </h1>
          <h2 className="font-['Playfair_Display'] text-3xl text-white mb-4">
            Lost in the Cosmos
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            It seems the spiritual path you're seeking has shifted into another dimension. 
            Let us guide you back to the light.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link to="/">
            <Button 
              size="lg"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <Home className="w-5 h-5 mr-2" />
              Return Home
            </Button>
          </Link>
          
          <Link to="/readers">
            <Button 
              variant="outline"
              size="lg"
              className="w-full border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white py-3 px-6 rounded-lg transition-all duration-200"
            >
              <Star className="w-5 h-5 mr-2" />
              Find a Reader
            </Button>
          </Link>
          
          <Button 
            variant="ghost"
            size="lg"
            className="w-full text-gray-400 hover:text-white py-3 px-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Mystical Quote */}
        <div className="mt-12 p-6 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
          <blockquote className="text-gray-300 italic text-center">
            "Not all who wander are lost, but sometimes even wanderers need guidance 
            to find their way back to the path of enlightenment."
          </blockquote>
          <cite className="block text-pink-400 text-sm mt-3">— Ancient Wisdom</cite>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
