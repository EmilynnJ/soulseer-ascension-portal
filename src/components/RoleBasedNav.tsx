import { Link, useLocation } from 'react-router-dom';
import { 
  Layout, 
  Users, 
  Calendar, 
  MessageSquare, 
  Star, 
  Plus,
  Settings,
  BarChart3,
  Video,
  User
} from 'lucide-react';

interface RoleBasedNavProps {
  userRole: 'admin' | 'reader' | 'client';
}

const RoleBasedNav = ({ userRole }: RoleBasedNavProps) => {
  const location = useLocation();

  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Layout },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Readers', href: '/dashboard/readers', icon: Star },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const readerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Layout },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Earnings', href: '/dashboard/earnings', icon: Plus },
  ];

  const clientNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Layout },
    { name: 'Book Reading', href: '/dashboard/book', icon: Calendar },
    { name: 'My Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Shop', href: '/dashboard/shop', icon: Plus },
  ];

  const getNavigation = () => {
    switch (userRole) {
      case 'admin':
        return adminNavigation;
      case 'reader':
        return readerNavigation;
      case 'client':
        return clientNavigation;
      default:
        return clientNavigation;
    }
  };

  const navigation = getNavigation();

  return (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href || 
          (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-mystic-900/30 text-mystic-400 glow-mystic border border-mystic-800/50'
                : 'text-gray-300 hover:text-mystic-400 hover:bg-mystic-900/20'
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default RoleBasedNav;