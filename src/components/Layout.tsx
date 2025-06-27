import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Wallet,
  Star,
  MessageCircle,
  Video,
  ShoppingBag,
  Users,
  Home as HomeIcon,
  Radio
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'client' | 'reader' | 'admin';
  wallet_balance: number;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          
          if (response.ok) {
            const profile = await response.json();
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUserProfile(null);
        } else if (event === 'SIGNED_IN' && session) {
          fetchUserProfile();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/readers', label: 'Readers', icon: Star },
    { path: '/live', label: 'Live', icon: Radio },
    { path: '/shop', label: 'Shop', icon: ShoppingBag },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/about', label: 'About', icon: MessageCircle },
  ];

  const userMenuItems = userProfile ? [
    ...(userProfile.role === 'client' ? [
      { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
      { path: '/dashboard/sessions', label: 'My Sessions', icon: Video },
      { path: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
    ] : []),
    ...(userProfile.role === 'reader' ? [
      { path: '/dashboard', label: 'Reader Dashboard', icon: HomeIcon },
      { path: '/dashboard/sessions', label: 'My Sessions', icon: Video },
      { path: '/dashboard/earnings', label: 'Earnings', icon: Wallet },
      { path: '/dashboard/schedule', label: 'Schedule', icon: Settings },
    ] : []),
    ...(userProfile.role === 'admin' ? [
      { path: '/dashboard', label: 'Admin Dashboard', icon: HomeIcon },
      { path: '/dashboard/users', label: 'Users', icon: Users },
      { path: '/dashboard/sessions', label: 'All Sessions', icon: Video },
      { path: '/dashboard/analytics', label: 'Analytics', icon: Settings },
    ] : []),
  ] : [];

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
              {!isLoading && (
                <>
                  {userProfile ? (
                    <div className="flex items-center space-x-4">
                      {/* Wallet Balance */}
                      <div className="hidden sm:flex items-center space-x-2 bg-gray-800/80 rounded-full px-3 py-1">
                        <Wallet className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">
                          ${userProfile.wallet_balance.toFixed(2)}
                        </span>
                      </div>

                      {/* User Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="relative h-10 w-10 rounded-full"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={userProfile.avatar_url}
                                alt={userProfile.full_name || userProfile.email}
                              />
                              <AvatarFallback className="bg-pink-500 text-white">
                                {(userProfile.full_name || userProfile.email).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64" align="end">
                          <DropdownMenuLabel className="p-4">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium text-white">
                                {userProfile.full_name || 'User'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {userProfile.email}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  userProfile.role === 'reader' 
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : userProfile.role === 'admin'
                                    ? 'bg-red-500/20 text-red-400' 
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                                </span>
                                <div className="flex items-center space-x-1 text-green-400">
                                  <Wallet className="w-3 h-3" />
                                  <span className="text-xs">${userProfile.wallet_balance.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {userMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <DropdownMenuItem key={item.path} asChild>
                                <Link
                                  to={item.path}
                                  className="flex items-center space-x-2 cursor-pointer"
                                >
                                  <Icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className="flex items-center space-x-2 cursor-pointer text-red-400"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
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
                  )}
                </>
              )}

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
              
              {userProfile && userMenuItems.length > 0 && (
                <>
                  <div className="border-t border-gray-700 my-2"></div>
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-pink-400 hover:bg-gray-800/50"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}
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