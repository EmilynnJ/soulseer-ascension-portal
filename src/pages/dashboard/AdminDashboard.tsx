import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, Eye, UserPlus, Settings, BarChart3, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Reader {
  id: string;
  email: string;
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
  created_at: string;
}

interface DashboardStats {
  totalUsers: number;
  totalReaders: number;
  totalRevenue: number;
  activeSessions: number;
  todayRevenue: number;
  weeklyGrowth: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReaders: 0,
    totalRevenue: 0,
    activeSessions: 0,
    todayRevenue: 0,
    weeklyGrowth: 0
  });
  const [readers, setReaders] = useState<Reader[]>([]);
  const [isCreateReaderOpen, setIsCreateReaderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newReader, setNewReader] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    specialties: '',
    yearsExperience: '',
    chatRate: '',
    audioRate: '',
    videoRate: '',
    profileImage: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadReaders()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const loadStats = async () => {
    try {
      // Get user counts
        .from('users')
        .select('*', { count: 'exact', head: true });

        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'reader');

      // Get revenue data (placeholder - would need proper transactions table)
        .from('sessions')
        .select('total_cost, created_at');

      const totalRevenue = sessions?.reduce((sum, session) => sum + (session.total_cost || 0), 0) || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const todayRevenue = sessions?.filter(s => s.created_at?.startsWith(today))
        .reduce((sum, session) => sum + (session.total_cost || 0), 0) || 0;

      // Get active sessions
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalUsers: totalUsers || 0,
        totalReaders: totalReaders || 0,
        totalRevenue,
        activeSessions: activeSessions || 0,
        todayRevenue,
        weeklyGrowth: 12.5 // Placeholder
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadReaders = async () => {
    try {
        .from('users')
        .select('*')
        .eq('role', 'reader')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReaders(data || []);
    } catch (error) {
      console.error('Error loading readers:', error);
    }
  };

  const createReader = async () => {
    setIsLoading(true);
    try {
      // Create auth user
        email: newReader.email,
        password: newReader.password,
        email_confirm: true,
        user_metadata: {
          role: 'reader'
        }
      });

      if (authError) throw authError;

      // Create user profile
        .from('users')
        .insert({
          id: authData.user.id,
          email: newReader.email,
          first_name: newReader.firstName,
          last_name: newReader.lastName,
          username: newReader.username,
          role: 'reader',
          bio: newReader.bio,
          specialties: newReader.specialties.split(',').map(s => s.trim()),
          years_experience: parseInt(newReader.yearsExperience),
          chat_rate: parseFloat(newReader.chatRate),
          audio_rate: parseFloat(newReader.audioRate),
          video_rate: parseFloat(newReader.videoRate),
          profile_image: newReader.profileImage,
          wallet_balance: 0
        });

      if (profileError) throw profileError;

      toast.success('Reader account created successfully');
      setIsCreateReaderOpen(false);
      setNewReader({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        username: '',
        bio: '',
        specialties: '',
        yearsExperience: '',
        chatRate: '',
        audioRate: '',
        videoRate: '',
        profileImage: ''
      });
      loadReaders();
    } catch (error) {
      console.error('Error creating reader:', error);
      toast.error('Failed to create reader account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-pink-400 font-['Alex_Brush'] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-white/80 font-['Playfair_Display']">
            Manage your SoulSeer platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
              <Users className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">{stats.totalUsers}</div>
              <p className="text-xs text-white/60">+{stats.weeklyGrowth}% from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Readers</CardTitle>
              <Eye className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">{stats.totalReaders}</div>
              <p className="text-xs text-white/60">Active psychic readers</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-white/60">Today: ${stats.todayRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Sessions</CardTitle>
              <BarChart3 className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-400">{stats.activeSessions}</div>
              <p className="text-xs text-white/60">Live readings now</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="readers" className="space-y-6">
          <TabsList className="bg-black/40 border-pink-500/30">
            <TabsTrigger value="readers" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Readers
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Users
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="readers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white font-['Playfair_Display']">
                Reader Management
              </h2>
              <Dialog open={isCreateReaderOpen} onOpenChange={setIsCreateReaderOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Reader
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/90 border-pink-500/30 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-pink-400 font-['Playfair_Display']">
                      Create New Reader Account
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                      Add a new psychic reader to the SoulSeer platform
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newReader.email}
                        onChange={(e) => setNewReader({ ...newReader, email: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="reader@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newReader.password}
                        onChange={(e) => setNewReader({ ...newReader, password: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="Secure password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName" className="text-white">First Name</Label>
                      <Input
                        id="firstName"
                        value={newReader.firstName}
                        onChange={(e) => setNewReader({ ...newReader, firstName: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newReader.lastName}
                        onChange={(e) => setNewReader({ ...newReader, lastName: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="Last name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <Input
                        id="username"
                        value={newReader.username}
                        onChange={(e) => setNewReader({ ...newReader, username: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="Unique username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="yearsExperience" className="text-white">Years Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        value={newReader.yearsExperience}
                        onChange={(e) => setNewReader({ ...newReader, yearsExperience: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="Years of experience"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chatRate" className="text-white">Chat Rate ($/min)</Label>
                      <Input
                        id="chatRate"
                        type="number"
                        step="0.01"
                        value={newReader.chatRate}
                        onChange={(e) => setNewReader({ ...newReader, chatRate: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="audioRate" className="text-white">Audio Rate ($/min)</Label>
                      <Input
                        id="audioRate"
                        type="number"
                        step="0.01"
                        value={newReader.audioRate}
                        onChange={(e) => setNewReader({ ...newReader, audioRate: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="videoRate" className="text-white">Video Rate ($/min)</Label>
                      <Input
                        id="videoRate"
                        type="number"
                        step="0.01"
                        value={newReader.videoRate}
                        onChange={(e) => setNewReader({ ...newReader, videoRate: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profileImage" className="text-white">Profile Image URL</Label>
                      <Input
                        id="profileImage"
                        value={newReader.profileImage}
                        onChange={(e) => setNewReader({ ...newReader, profileImage: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="specialties" className="text-white">Specialties (comma-separated)</Label>
                      <Input
                        id="specialties"
                        value={newReader.specialties}
                        onChange={(e) => setNewReader({ ...newReader, specialties: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="Tarot, Love, Career, Psychic Medium"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <Textarea
                        id="bio"
                        value={newReader.bio}
                        onChange={(e) => setNewReader({ ...newReader, bio: e.target.value })}
                        className="bg-black/40 border-pink-500/30 text-white"
                        placeholder="Reader bio and background..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={createReader}
                    disabled={isLoading}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    {isLoading ? 'Creating...' : 'Create Reader'}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {readers.map((reader) => (
                <Card key={reader.id} className="bg-black/40 border-pink-500/30">
                  <CardContent className="flex items-center justify-between p-6">
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
                          {reader.specialties?.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-pink-500/30 text-pink-400">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">
                        Chat: ${reader.chat_rate}/min | Audio: ${reader.audio_rate}/min | Video: ${reader.video_rate}/min
                      </p>
                      <p className="text-white/60 text-xs">
                        {reader.years_experience} years experience
                      </p>
                      <Badge className={reader.is_online ? "bg-green-500" : "bg-gray-500"}>
                        {reader.is_online ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white font-['Playfair_Display']">User Management</CardTitle>
                <CardDescription className="text-white/80">
                  Manage all platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">User management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white font-['Playfair_Display']">Session Management</CardTitle>
                <CardDescription className="text-white/80">
                  Monitor and manage reading sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">Session management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-white font-['Playfair_Display']">Platform Analytics</CardTitle>
                <CardDescription className="text-white/80">
                  View detailed platform metrics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;