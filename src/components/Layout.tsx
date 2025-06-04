import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Moon, Sun } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-mystic-950 to-black">
      {/* Navigation */}
      <nav className="border-b border-mystic-800/30 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-mystic-400 glow-mystic" />
              <span className="text-xl font-bold text-gradient-mystic">SoulSeer</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'text-mystic-400 glow-mystic bg-mystic-900/20'
                      : 'text-gray-300 hover:text-mystic-400 hover:bg-mystic-900/10'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-mystic-400">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-mystic">
                  Get Started
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
    </div>
  );
};

export default Layout;