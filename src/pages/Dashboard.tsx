import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import AdminDashboard from './dashboard/AdminDashboard';
import ReaderDashboard from './dashboard/ReaderDashboard';
import ClientDashboard from './dashboard/ClientDashboard';
import { apiClient } from '@/services/apiClient';

interface UserProfile {
  id: string;
  email: string;
  role: 'client' | 'reader' | 'admin';
  display_name?: string;
  balance?: number;
}

const Dashboard: React.FC = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      loadUserProfile();
    } else if (isLoaded && !clerkUser) {
      setLoading(false);
    }
  }, [isLoaded, clerkUser]);

  const loadUserProfile = async () => {
    try {
      const userProfile = await apiClient.getProfile();
      setProfile(userProfile.profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If profile doesn't exist, default to client role
      setProfile({
        id: clerkUser?.id || '',
        email: clerkUser?.primaryEmailAddress?.emailAddress || '',
        role: 'client',
        display_name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim(),
        balance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
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

  if (!clerkUser || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-['Playfair_Display'] mb-4">
            Welcome to SoulSeer!
          </div>
          <p className="text-gray-300 mb-6">
            Setting up your profile...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Route to role-specific dashboard
  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'reader':
      return <ReaderDashboard />;
    case 'client':
    default:
      return <ClientDashboard />;
  }
};

export default Dashboard;
