import { useState } from 'react';
import RoleBasedNav from '@/components/RoleBasedNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Users, Video } from 'lucide-react';

const Dashboard = () => {
  // In a real app, this would come from auth context/state
  const [userRole] = useState<'admin' | 'reader' | 'client'>('client');
  const [userName] = useState('Sarah');

  const getDashboardContent = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'reader':
        return <ReaderDashboard />;
      case 'client':
        return <ClientDashboard userName={userName} />;
      default:
        return <ClientDashboard userName={userName} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-mystic-950 to-black">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black/30 backdrop-blur-xl border-r border-mystic-800/30 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Star className="h-8 w-8 text-mystic-400 glow-mystic" />
              <span className="text-xl font-bold text-gradient-mystic">SoulSeer</span>
            </div>
            <RoleBasedNav userRole={userRole} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {getDashboardContent()}
        </div>
      </div>
    </div>
  );
};

const ClientDashboard = ({ userName }: { userName: string }) => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gradient-mystic mb-2">
        Welcome back, {userName} ✨
      </h1>
      <p className="text-gray-400">Your spiritual journey awaits</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-mystic-900/20 border-mystic-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-mystic-400">12</div>
        </CardContent>
      </Card>

      <Card className="bg-celestial-900/20 border-celestial-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Upcoming Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-celestial-400">3</div>
        </CardContent>
      </Card>

      <Card className="bg-divine-900/20 border-divine-800/30 hover:glow-divine transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-divine-400">7</div>
        </CardContent>
      </Card>

      <Card className="bg-mystic-900/20 border-mystic-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Favorite Readers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-mystic-400">5</div>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="bg-black/20 border-mystic-800/30">
        <CardHeader>
          <CardTitle className="text-gradient-mystic">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 glow-mystic">
            <Calendar className="mr-2 h-4 w-4" />
            Book a Reading
          </Button>
          <Button variant="outline" className="w-full border-mystic-400 text-mystic-400 hover:bg-mystic-400 hover:text-black">
            <Video className="mr-2 h-4 w-4" />
            Start Live Session
          </Button>
          <Button variant="outline" className="w-full border-divine-400 text-divine-400 hover:bg-divine-400 hover:text-black">
            <Users className="mr-2 h-4 w-4" />
            Browse Readers
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-black/20 border-mystic-800/30">
        <CardHeader>
          <CardTitle className="text-gradient-mystic">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-mystic-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">Completed reading with Luna Star</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-celestial-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">New message from Crystal Moon</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-divine-400 rounded-full"></div>
              <p className="text-gray-300 text-sm">Booked session for tomorrow</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ReaderDashboard = () => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gradient-mystic mb-2">
        Reader Dashboard 🔮
      </h1>
      <p className="text-gray-400">Share your divine gifts with seekers</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-mystic-900/20 border-mystic-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Today's Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-mystic-400">8</div>
        </CardContent>
      </Card>

      <Card className="bg-celestial-900/20 border-celestial-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">This Week's Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-celestial-400">$340</div>
        </CardContent>
      </Card>

      <Card className="bg-divine-900/20 border-divine-800/30 hover:glow-divine transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-divine-400">4.9</div>
        </CardContent>
      </Card>

      <Card className="bg-mystic-900/20 border-mystic-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-mystic-400">156</div>
        </CardContent>
      </Card>
    </div>

    <p className="text-gray-400 text-center py-8">Reader dashboard features coming soon...</p>
  </div>
);

const AdminDashboard = () => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gradient-mystic mb-2">
        Admin Dashboard ⚡
      </h1>
      <p className="text-gray-400">Manage the SoulSeer platform</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-mystic-900/20 border-mystic-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-mystic-400">2,847</div>
        </CardContent>
      </Card>

      <Card className="bg-celestial-900/20 border-celestial-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Active Readers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-celestial-400">89</div>
        </CardContent>
      </Card>

      <Card className="bg-divine-900/20 border-divine-800/30 hover:glow-divine transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Daily Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-divine-400">234</div>
        </CardContent>
      </Card>

      <Card className="bg-mystic-900/20 border-mystic-800/30 hover:glow-mystic transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-mystic-400">$12.5K</div>
        </CardContent>
      </Card>
    </div>

    <p className="text-gray-400 text-center py-8">Admin dashboard features coming soon...</p>
  </div>
);

export default Dashboard;