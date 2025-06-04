import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Moon, Sun } from 'lucide-react';
import BackgroundGenerator from './BackgroundGenerator';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Reader Directory', href: '/readers' },
    { name: 'Live Readings', href: '/live' },
    { name: 'Shop', href: '/shop' },
    { name: 'Community', href: '/community' },
    { name: 'Help Center', href: '/help' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-mystic-950 to-black relative">
      {/* Navigation */}
      <nav className="ethereal-border border-b backdrop-blur-xl relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <Star className="h-10 w-10 text-mystic-400 glow-ethereal float group-hover:scale-110 transition-transform duration-300" />
              <span className="font-heading text-3xl text-gradient-ethereal">SoulSeer</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-300 ${
                    location.pathname === item.href
                      ? 'text-mystic-400 glow-ethereal bg-mystic-900/30 ethereal-border'
                      : 'text-gray-300 hover:text-ethereal-300 hover:bg-mystic-900/20 hover:glow-mystic'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="font-body text-gray-300 hover:text-ethereal-300 hover:glow-mystic transition-all duration-300">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="mystical-card bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-ethereal font-body transition-all duration-500 hover:scale-105">
                  Get Started ✨
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-mystic-800/30 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Star className="h-6 w-6 text-mystic-400" />
                <span className="font-bold text-gradient-mystic">SoulSeer</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting souls through divine guidance and mystical wisdom.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/readers" className="text-gray-400 hover:text-mystic-400">Find a Reader</Link></li>
                <li><Link to="/live" className="text-gray-400 hover:text-mystic-400">Live Readings</Link></li>
                <li><Link to="/shop" className="text-gray-400 hover:text-mystic-400">Mystical Shop</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Community</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/community" className="text-gray-400 hover:text-mystic-400">Join Community</Link></li>
                <li><Link to="/help" className="text-gray-400 hover:text-mystic-400">Help Center</Link></li>
                <li><Link to="/apply" className="text-gray-400 hover:text-mystic-400">Become a Reader</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/policies" className="text-gray-400 hover:text-mystic-400">Privacy Policy</Link></li>
                <li><Link to="/policies" className="text-gray-400 hover:text-mystic-400">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-mystic-800/30 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 SoulSeer. All rights reserved. ✨
            </p>
          </div>
        </div>
      </footer>
      
      {/* Background Generator */}
      <BackgroundGenerator />
    </div>
  );
};

export default Layout;