import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Clock, Users, Star, Phone, Video, MessageCircle, TrendingUp, Calendar, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useWebRTC } from '@/contexts/WebRTCContext';

interface ReaderStats {
  totalEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  totalSessions: number;
  todaySessions: number;
  averageRating: number;
  totalReviews: number;
  pendingPayouts: number;
}

interface Session {
  id: string;
  client_name: string;
  type: 'chat' | 'audio' | 'video';
  duration_minutes: number;
  total_cost: number;
  status: string;
  start_time: string;
  end_time?: string;
  rating?: number;
  review?: string;
}

interface ReaderProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  bio: string;
  specialties: string[];
  years_experience: number;
  chat_rate: number;
  audio_rate: number;
  video_rate: number;
  is_online: boolean;
  profile_image: string;
  wallet_balance: number;
}

const ReaderDashboard: React.FC = () => {
  const [stats, setStats] = useState<ReaderStats>({
    totalEarnings: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    totalSessions: 0,
    todaySessions: 0,
    averageRating: 0,
    totalReviews: 0,
    pendingPayouts: 0
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<ReaderProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [rateForm, setRateForm] = useState({
    chatRate: '',
    audioRate: '',
    videoRate: ''
  });
  const { isInSession, sessionId } = useWebRTC();

  useEffect(() => {
    loadReaderData();
  }, []);

  const loadReaderData = async () => {
    try {
      if (!user) return;

      await Promise.all([
        loadProfile(user.id),
        loadStats(user.id),
        loadSessions(user.id)
      ]);
    } catch (error) {
      console.error('Error loading reader data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const loadProfile = async (userId: string) => {
    try {
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setIsOnline(data.is_online);
      setRateForm({
        chatRate: data.chat_rate?.toString() || '',
        audioRate: data.audio_rate?.toString() || '',
        videoRate: data.video_rate?.toString() || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      // Get sessions for earnings calculation
        .from('sessions')
        .select('total_cost, created_at, duration_minutes, rating')
        .eq('reader_id', userId)
        .eq('status', 'completed');

      if (sessions) {
        const totalEarnings = sessions.reduce((sum, session) => sum + (session.total_cost * 0.7 || 0), 0); // 70% to reader
        
        const today = new Date().toISOString().split('T')[0];
        const todayEarnings = sessions
          .filter(s => s.created_at?.startsWith(today))
          .reduce((sum, session) => sum + (session.total_cost * 0.7 || 0), 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weeklyEarnings = sessions
          .filter(s => new Date(s.created_at) >= weekStart)
          .reduce((sum, session) => sum + (session.total_cost * 0.7 || 0), 0);

        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - 30);
        const monthlyEarnings = sessions
          .filter(s => new Date(s.created_at) >= monthStart)
          .reduce((sum, session) => sum + (session.total_cost * 0.7 || 0), 0);

        const todaySessions = sessions.filter(s => s.created_at?.startsWith(today)).length;
        
        const ratingsData = sessions.filter(s => s.rating).map(s => s.rating);
        const averageRating = ratingsData.length > 0 
          ? ratingsData.reduce((sum, rating) => sum + rating, 0) / ratingsData.length 
          : 0;

        setStats({
          totalEarnings,
          todayEarnings,
          weeklyEarnings,
          monthlyEarnings,
          totalSessions: sessions.length,
          todaySessions,
          averageRating,
          totalReviews: ratingsData.length,
          pendingPayouts: totalEarnings // Simplified - would need actual payout tracking
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadSessions = async (userId: string) => {
    try {
        .from('sessions')
        .select(`
          *,
          client:users!sessions_client_id_fkey(first_name, last_name)
        `)
        .eq('reader_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const formattedSessions = data?.map(session => ({
        ...session,
        client_name: `${session.client?.first_name || ''} ${session.client?.last_name || ''}`.trim() || 'Anonymous'
      })) || [];
      
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      if (!user) return;

      const newStatus = !isOnline;
      
        .from('users')
        .update({ is_online: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      setIsOnline(newStatus);
      toast.success(`You are now ${newStatus ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error updating online status:', error);
      toast.error('Failed to update status');
    }
  };

  const updateRates = async () => {
    try {
      if (!user) return;

        .from('users')
        .update({
          chat_rate: parseFloat(rateForm.chatRate),
          audio_rate: parseFloat(rateForm.audioRate),
          video_rate: parseFloat(rateForm.videoRate)
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Rates updated successfully');
      setIsEditingRates(false);
      loadProfile(user.id);
    } catch (error) {
      console.error('Error updating rates:', error);
      toast.error('Failed to update rates');
    }
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
              Reader Dashboard
            </h1>
            <p className="text-white/80 font-['Playfair_Display']">
              Welcome back, {profile.first_name}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="online-status" className="text-white">
                {isOnline ? 'Online' : 'Offline'}
              </Label>
              <Switch
                id="online-status"
                checked={isOnline}
                onCheckedChange={toggleOnlineStatus}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
            {isInSession && (
              <Badge className="bg-green-500 text-white animate-pulse">
                In Session
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Today's Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">
                {formatCurrency(stats.todayEarnings)}
              </div>
              <p className="text-xs text-white/60">
                {stats.todaySessions} sessions today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">
                {formatCurrency(stats.totalEarnings)}
              </div>
              <p className="text-xs text-white/60">
                {stats.totalSessions} total sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">
                {stats.averageRating.toFixed(1)}/5
              </div>
              <p className="text-xs text-white/60">
                {stats.totalReviews} reviews
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Wallet Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">
                {formatCurrency(profile.wallet_balance)}
              </div>
              <p className="text-xs text-white/60">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-black/40 border-pink-500/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Earnings
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Rates */}
              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white font-['Playfair_Display']">
                      Current Rates
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Your per-minute pricing
                    </CardDescription>
                  </div>
                  <Dialog open={isEditingRates} onOpenChange={setIsEditingRates}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-pink-500/30 text-pink-400">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black/90 border-pink-500/30 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-pink-400 font-['Playfair_Display']">
                          Update Your Rates
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                          Set your per-minute rates for different session types
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="chatRate" className="text-white">Chat Rate ($/min)</Label>
                          <Input
                            id="chatRate"
                            type="number"
                            step="0.01"
                            value={rateForm.chatRate}
                            onChange={(e) => setRateForm({ ...rateForm, chatRate: e.target.value })}
                            className="bg-black/40 border-pink-500/30 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="audioRate" className="text-white">Audio Rate ($/min)</Label>
                          <Input
                            id="audioRate"
                            type="number"
                            step="0.01"
                            value={rateForm.audioRate}
                            onChange={(e) => setRateForm({ ...rateForm, audioRate: e.target.value })}
                            className="bg-black/40 border-pink-500/30 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="videoRate" className="text-white">Video Rate ($/min)</Label>
                          <Input
                            id="videoRate"
                            type="number"
                            step="0.01"
                            value={rateForm.videoRate}
                            onChange={(e) => setRateForm({ ...rateForm, videoRate: e.target.value })}
                            className="bg-black/40 border-pink-500/30 text-white"
                          />
                        </div>
                        <Button onClick={updateRates} className="bg-pink-500 hover:bg-pink-600 text-white w-full">
                          Update Rates
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-pink-400" />
                      <span className="text-white">Chat</span>
                    </div>
                    <span className="text-pink-400 font-semibold">
                      {formatCurrency(profile.chat_rate)}/min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-pink-400" />
                      <span className="text-white">Audio</span>
                    </div>
                    <span className="text-pink-400 font-semibold">
                      {formatCurrency(profile.audio_rate)}/min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4 text-pink-400" />
                      <span className="text-white">Video</span>
                    </div>
                    <span className="text-pink-400 font-semibold">
                      {formatCurrency(profile.video_rate)}/min
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Stats */}
              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-['Playfair_Display']">
                    Weekly Performance
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Your last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-white/80">Earnings</span>
                    <span className="text-pink-400 font-semibold">
                      {formatCurrency(stats.weeklyEarnings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Sessions</span>
                    <span className="text-pink-400 font-semibold">
                      {sessions.filter(s => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(s.start_time) >= weekAgo;
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Average Rating</span>
                    <span className="text-pink-400 font-semibold">
                      {stats.averageRating.toFixed(1)}/5
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white font-['Playfair_Display']">Recent Sessions</CardTitle>
                <CardDescription className="text-white/80">
                  Your latest reading sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {session.type === 'chat' && <MessageCircle className="w-4 h-4 text-pink-400" />}
                          {session.type === 'audio' && <Phone className="w-4 h-4 text-pink-400" />}
                          {session.type === 'video' && <Video className="w-4 h-4 text-pink-400" />}
                          <Badge variant="outline" className="border-pink-500/30 text-pink-400">
                            {session.type}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{session.client_name}</p>
                          <p className="text-white/60 text-sm">{formatDate(session.start_time)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-pink-400 font-semibold">
                          {formatCurrency(session.total_cost * 0.7)}
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-['Playfair_Display']">Weekly</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-400">
                    {formatCurrency(stats.weeklyEarnings)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-['Playfair_Display']">Monthly</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-400">
                    {formatCurrency(stats.monthlyEarnings)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="text-white font-['Playfair_Display']">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-400">
                    {formatCurrency(stats.totalEarnings)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white font-['Playfair_Display']">Profile Settings</CardTitle>
                <CardDescription className="text-white/80">
                  Manage your reader profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">Profile settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReaderDashboard;