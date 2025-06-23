import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  Video, 
  MessageCircle, 
  Wallet, 
  Clock,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Play,
  Settings,
  History,
  Heart,
  Gift
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'client' | 'reader' | 'admin';
  wallet_balance: number;
  created_at: string;
}

interface RecentSession {
  id: string;
  client_name?: string;
  reader_name?: string;
  status: string;
  duration: number;
  cost: number;
  created_at: string;
  rating?: number;
}

interface DashboardStats {
  total_sessions: number;
  total_spent?: number;
  total_earned?: number;
  average_rating?: number;
  total_minutes?: number;
}

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      // Fetch user profile
      const profileResponse = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setUserProfile(profile);

        // Fetch recent sessions
        const sessionsResponse = await fetch('/api/sessions/my-sessions?limit=5', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (sessionsResponse.ok) {
          const sessions = await sessionsResponse.json();
          setRecentSessions(sessions);
        }

        // Fetch dashboard stats
        const statsResponse = await fetch('/api/sessions/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (statsResponse.ok) {
          const dashboardStats = await statsResponse.json();
          setStats(dashboardStats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading Dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-['Playfair_Display'] mb-4">
            Please sign in to access your dashboard
          </div>
          <Link to="/login">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if we're on a sub-route
  const isSubRoute = location.pathname !== '/dashboard';

  if (isSubRoute) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Routes>
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<DashboardHome userProfile={userProfile} recentSessions={recentSessions} stats={stats} />} />
          </Routes>
        </div>
      </div>
    );
  }

  return <DashboardHome userProfile={userProfile} recentSessions={recentSessions} stats={stats} />;
};

// Placeholder components for sub-routes
const SessionsPage = () => (
  <div className="text-center py-12">
    <h2 className="font-['Playfair_Display'] text-3xl text-white mb-4">Sessions</h2>
    <p className="text-gray-400">Session management interface coming soon...</p>
  </div>
);

const WalletPage = () => (
  <div className="text-center py-12">
    <h2 className="font-['Playfair_Display'] text-3xl text-white mb-4">Wallet</h2>
    <p className="text-gray-400">Wallet management interface coming soon...</p>
  </div>
);

const EarningsPage = () => (
  <div className="text-center py-12">
    <h2 className="font-['Playfair_Display'] text-3xl text-white mb-4">Earnings</h2>
    <p className="text-gray-400">Earnings dashboard coming soon...</p>
  </div>
);

const SchedulePage = () => (
  <div className="text-center py-12">
    <h2 className="font-['Playfair_Display'] text-3xl text-white mb-4">Schedule</h2>
    <p className="text-gray-400">Schedule management interface coming soon...</p>
  </div>
);

const UsersPage = () => (
  <div className="text-center py-12">
    <h2 className="font-['Playfair_Display'] text-3xl text-white mb-4">Users</h2>
    <p className="text-gray-400">User management interface coming soon...</p>
  </div>
);

const AnalyticsPage = () => (
  <div className="text-center py-12">
    <h2 className="font-['Playfair_Display'] text-3xl text-white mb-4">Analytics</h2>
    <p className="text-gray-400">Analytics dashboard coming soon...</p>
  </div>
);

// Dashboard Home Component
const DashboardHome = ({ 
  userProfile, 
  recentSessions, 
  stats 
}: { 
  userProfile: UserProfile;
  recentSessions: RecentSession[];
  stats: DashboardStats | null;
}) => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={userProfile.avatar_url}
                alt={userProfile.full_name}
              />
              <AvatarFallback className="bg-pink-500 text-white text-xl">
                {userProfile.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-white mb-2">
                Welcome back, {userProfile.full_name.split(' ')[0]}
              </h1>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="secondary" 
                  className={`${
                    userProfile.role === 'reader' 
                      ? 'bg-purple-500/20 text-purple-400'
                      : userProfile.role === 'admin'
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </Badge>
                <div className="flex items-center space-x-2 text-green-400">
                  <Wallet className="w-4 h-4" />
                  <span className="font-medium">${userProfile.wallet_balance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total Sessions
                </CardTitle>
                <Video className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.total_sessions}</div>
              </CardContent>
            </Card>

            {userProfile.role === 'client' && (
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Total Spent
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    ${stats.total_spent?.toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>
            )}

            {userProfile.role === 'reader' && (
              <>
                <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Total Earned
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      ${stats.total_earned?.toFixed(2) || '0.00'}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Average Rating
                    </CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {stats.average_rating?.toFixed(1) || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total Minutes
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.total_minutes || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions Card */}
          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userProfile.role === 'client' && (
                <>
                  <Link to="/readers">
                    <Button className="w-full justify-start bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                      <Video className="mr-2 h-4 w-4" />
                      Find a Reader
                    </Button>
                  </Link>
                  <Link to="/dashboard/wallet">
                    <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Wallet className="mr-2 h-4 w-4" />
                      Add Funds
                    </Button>
                  </Link>
                </>
              )}
              
              {userProfile.role === 'reader' && (
                <>
                  <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                    <Play className="mr-2 h-4 w-4" />
                    Go Live
                  </Button>
                  <Link to="/dashboard/schedule">
                    <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Calendar className="mr-2 h-4 w-4" />
                      Manage Schedule
                    </Button>
                  </Link>
                </>
              )}
              
              <Link to="/dashboard/sessions">
                <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700">
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Sessions</CardTitle>
              <CardDescription className="text-gray-400">
                Your latest spiritual connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {userProfile.role === 'client' ? session.reader_name : session.client_name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">${session.cost.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">{session.duration} min</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <div className="text-gray-400">No sessions yet</div>
                  <div className="text-gray-500 text-sm">Your reading history will appear here</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;