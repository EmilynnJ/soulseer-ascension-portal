import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminDashboard from './dashboard/AdminDashboard';
import ReaderDashboard from './dashboard/ReaderDashboard';
import ClientDashboard from './dashboard/ClientDashboard';

interface User {
  id: string;
  email: string;
  role: 'client' | 'reader' | 'admin';
  first_name?: string;
  last_name?: string;
  wallet_balance?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }

      // Get user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        navigate('/login');
        return;
      }

      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading Dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-['Playfair_Display'] mb-4">
            Please sign in to access your dashboard
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'reader':
      return <ReaderDashboard />;
    case 'client':
      return <ClientDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl font-['Playfair_Display'] mb-4">
              Invalid user role
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      );
  }
};

export default Dashboard;