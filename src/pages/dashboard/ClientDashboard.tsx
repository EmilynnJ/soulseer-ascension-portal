import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Clock, Heart, Star, Phone, Video, MessageCircle, CreditCard, History, User, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';

interface ClientStats {
  totalSpent: number;
  totalSessions: number;
  favoriteReaders: number;
  monthlySpent: number;
  averageSessionLength: number;
  walletBalance: number;
}

interface Session {
  id: string;
  reader_name: string;
  reader_username: string;
  type: 'chat' | 'audio' | 'video';
  duration_minutes: number;
  total_cost: number;
  status: string;
  start_time: string;
  end_time?: string;
  rating?: number;
  review?: string;
  reader_profile_image?: string;
}

interface FavoriteReader {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  specialties: string[];
  chat_rate: number;
  audio_rate: number;
  video_rate: number;
  is_online: boolean;
  profile_image: string;
  average_rating: number;
}

interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  wallet_balance: number;
  created_at: string;
}

const ClientDashboard: React.FC = () => {
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ClientStats>({
    totalSpent: 0,
    totalSessions: 0,
    favoriteReaders: 0,
    monthlySpent: 0,
    averageSessionLength: 0,
    walletBalance: 0
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [favoriteReaders, setFavoriteReaders] = useState<FavoriteReader[]>([]);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');

  useEffect(() => {
    if (clerkUser) {
      loadClientData();
    }
  }, [clerkUser]);

  const loadClientData = async () => {
    try {
      const dashboardData = await apiClient.getDashboardData('client');
      setStats(dashboardData.stats || {
        totalSpent: 0,
        totalSessions: 0,
        favoriteReaders: 0,
        monthlySpent: 0,
        averageSessionLength: 0,
        walletBalance: 0
      });
      setSessions(dashboardData.sessions || []);
      setFavoriteReaders(dashboardData.favoriteReaders || []);
      
      const userProfile = await apiClient.getProfile();
      setProfile({
        id: userProfile.profile?.id || '',
        first_name: clerkUser?.firstName || '',
        last_name: clerkUser?.lastName || '',
        email: clerkUser?.primaryEmailAddress?.emailAddress || '',
        wallet_balance: userProfile.profile?.balance || 0,
        created_at: clerkUser?.createdAt?.toString() || ''
      });
    } catch (error) {
      console.error('Error loading client data:', error);
      // Set default profile if API fails
      setProfile({
        id: clerkUser?.id || '',
        first_name: clerkUser?.firstName || '',
        last_name: clerkUser?.lastName || '',
        email: clerkUser?.primaryEmailAddress?.emailAddress || '',
        wallet_balance: 0,
        created_at: clerkUser?.createdAt?.toString() || ''
      });
    }
  };



  const addFunds = async () => {
    try {
      const amount = parseFloat(addFundsAmount);
      if (amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      const data = await apiClient.createCheckoutSession(amount * 100); // Convert to cents
      window.location.href = data.url;
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    }
  };

  const startSession = (readerId: string, sessionType: 'chat' | 'audio' | 'video') => {
    navigate(`/reading/${readerId}?type=${sessionType}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-pink-400 font-['Alex_Brush'] mb-2">
              My Dashboard
            </h1>
            <p className="text-white/80 font-['Playfair_Display']">
              Welcome back, {profile.first_name}
            </p>
          </div>
          
          <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/90 border-pink-500/30 text-white">
              <DialogHeader>
                <DialogTitle className="text-pink-400 font-['Playfair_Display']">
                  Add Funds to Wallet
                </DialogTitle>
                <DialogDescription className="text-white/80">
                  Add money to your wallet to pay for readings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-white">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    className="bg-black/40 border-pink-500/30 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddFundsAmount('25')}
                    className="border-pink-500/30 text-pink-400"
                  >
                    $25
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAddFundsAmount('50')}
                    className="border-pink-500/30 text-pink-400"
                  >
                    $50
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAddFundsAmount('100')}
                    className="border-pink-500/30 text-pink-400"
                  >
                    $100
                  </Button>
                </div>
                <Button onClick={addFunds} className="bg-pink-500 hover:bg-pink-600 text-white w-full">
                  Add Funds
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Wallet Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">
                {formatCurrency(stats.walletBalance)}
              </div>
              <p className="text-xs text-white/60">Available for readings</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Spent</CardTitle>
              <History className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">
                {formatCurrency(stats.totalSpent)}
              </div>
              <p className="text-xs text-white/60">
                {stats.totalSessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">This Month</CardTitle>
              <Clock className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">
                {formatCurrency(stats.monthlySpent)}
              </div>
              <p className="text-xs text-white/60">
                Avg: {stats.averageSessionLength.toFixed(0)} min/session
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Favorite Readers</CardTitle>
              <Heart className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">
                {favoriteReaders.length}
              </div>
              <p className="text-xs text-white/60">Readers you've connected with</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList className="bg-black/40 border-pink-500/30">
            <TabsTrigger value="favorites" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Favorite Readers
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Session History
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Wallet
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white font-['Playfair_Display']">
                  Your Favorite Readers
                </CardTitle>
                <CardDescription className="text-white/80">
                  Readers you've connected with most
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {favoriteReaders.map((reader) => (
                    <div key={reader.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={reader.profile_image || '/placeholder-avatar.png'}
                          alt={reader.first_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-white font-semibold">
                            {reader.first_name} {reader.last_name}
                          </h3>
                          <p className="text-white/60 text-sm">@{reader.username}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {reader.specialties?.slice(0, 3).map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-pink-500/30 text-pink-400">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={reader.is_online ? "bg-green-500" : "bg-gray-500"}>
                          {reader.is_online ? "Online" : "Offline"}
                        </Badge>
                        {reader.is_online && (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startSession(reader.id, 'chat')}
                              className="border-pink-500/30 text-pink-400"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startSession(reader.id, 'audio')}
                              className="border-pink-500/30 text-pink-400"
                            >
                              <Phone className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startSession(reader.id, 'video')}
                              className="border-pink-500/30 text-pink-400"
                            >
                              <Video className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {favoriteReaders.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/60">No favorite readers yet</p>
                      <Button 
                        className="mt-4 bg-pink-500 hover:bg-pink-600"
                        onClick={() => navigate('/readers')}
                      >
                        Find Readers
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white font-['Playfair_Display']">Session History</CardTitle>
                <CardDescription className="text-white/80">
                  Your recent reading sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={session.reader_profile_image || '/placeholder-avatar.png'}
                          alt={session.reader_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex items-center space-x-2">
                          {session.type === 'chat' && <MessageCircle className="w-4 h-4 text-pink-400" />}
                          {session.type === 'audio' && <Phone className="w-4 h-4 text-pink-400" />}
                          {session.type === 'video' && <Video className="w-4 h-4 text-pink-400" />}
                          <Badge variant="outline" className="border-pink-500/30 text-pink-400">
                            {session.type}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{session.reader_name}</p>
                          <p className="text-white/60 text-sm">{formatDate(session.start_time)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-pink-400 font-semibold">
                          {formatCurrency(session.total_cost)}
                        </p>
                        <p className="text-white/60 text-sm">
                          {session.duration_minutes} min
                        </p>
                        {session.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-yellow-400 text-xs">{session.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/60">No sessions yet</p>
                      <Button 
                        className="mt-4 bg-pink-500 hover:bg-pink-600"
                        onClick={() => navigate('/readers')}
                      >
                        Book Your First Reading
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-['Playfair_Display']">Current Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pink-400 mb-4">
                    {formatCurrency(stats.walletBalance)}
                  </div>
                  <Button 
                    onClick={() => setIsAddFundsOpen(true)}
                    className="bg-pink-500 hover:bg-pink-600 text-white w-full"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add Funds
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-['Playfair_Display']">Quick Add</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-pink-500/30 text-pink-400"
                    onClick={() => {
                      setAddFundsAmount('25');
                      setIsAddFundsOpen(true);
                    }}
                  >
                    Add $25
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-pink-500/30 text-pink-400"
                    onClick={() => {
                      setAddFundsAmount('50');
                      setIsAddFundsOpen(true);
                    }}
                  >
                    Add $50
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-pink-500/30 text-pink-400"
                    onClick={() => {
                      setAddFundsAmount('100');
                      setIsAddFundsOpen(true);
                    }}
                  >
                    Add $100
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white font-['Playfair_Display']">Profile Information</CardTitle>
                <CardDescription className="text-white/80">
                  Your account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Name</Label>
                    <p className="text-pink-400">{profile.first_name} {profile.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-white">Email</Label>
                    <p className="text-pink-400">{profile.email}</p>
                  </div>
                  <div>
                    <Label className="text-white">Member Since</Label>
                    <p className="text-pink-400">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDashboard;