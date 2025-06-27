import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  Star,
  MessageCircle,
  Video,
  ShoppingBag,
  Users,
  Home as HomeIcon,
  Radio,
  Wallet
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/readers', label: 'Readers', icon: Star },
    { path: '/live', label: 'Live', icon: Radio },
    { path: '/shop', label: 'Shop', icon: ShoppingBag },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/about', label: 'About', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <span className="font-['Alex_Brush'] text-3xl text-pink-500">
                SoulSeer
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-pink-500 bg-pink-500/10'
                        : 'text-gray-300 hover:text-pink-400 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu / Auth Buttons */}
            <div className="flex items-center space-x-4">
              <SignedIn>
                <div className="flex items-center space-x-4">
                  {/* Wallet Balance */}
                  <div className="hidden sm:flex items-center space-x-2 bg-gray-800/80 rounded-full px-3 py-1">
                    <Wallet className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">
                      $0.00
                    </span>
                  </div>
                  
                  {/* Clerk User Button */}
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                        userButtonPopoverCard: "bg-gray-800 border-gray-700",
                        userButtonPopoverActionButton: "text-gray-300 hover:text-white hover:bg-gray-700",
                        userButtonPopoverActionButtonText: "text-gray-300",
                        userButtonPopoverActionButtonIcon: "text-gray-400"
                      }
                    }}
                    userProfileMode="navigation"
                    userProfileUrl="/dashboard"
                  />
                </div>
              </SignedIn>
              
              <SignedOut>
                <div className="flex items-center space-x-4">
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-300 hover:text-pink-400">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </SignedOut>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900/98 backdrop-blur-sm border-t border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'text-pink-500 bg-pink-500/10'
                        : 'text-gray-300 hover:text-pink-400 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <SignedIn>
                <div className="border-t border-gray-700 my-2"></div>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-pink-400 hover:bg-gray-800/50"
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
              </SignedIn>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <span className="font-['Alex_Brush'] text-2xl text-pink-500">
                  SoulSeer
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Connecting souls through authentic psychic guidance. Join our community of gifted readers and seekers on a journey of spiritual discovery.
              </p>
              <p className="text-gray-500 text-xs">
                © 2025 SoulSeer. All rights reserved.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/readers" className="hover:text-pink-400">Find Readers</Link></li>
                <li><Link to="/live" className="hover:text-pink-400">Live Sessions</Link></li>
                <li><Link to="/shop" className="hover:text-pink-400">Shop</Link></li>
                <li><Link to="/community" className="hover:text-pink-400">Community</Link></li>
                <li><Link to="/about" className="hover:text-pink-400">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="mailto:support@soulseer.com" className="hover:text-pink-400">Contact Support</a></li>
                <li><Link to="/policies" className="hover:text-pink-400">Terms & Policies</Link></li>
                <li><a href="/help" className="hover:text-pink-400">Help Center</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;