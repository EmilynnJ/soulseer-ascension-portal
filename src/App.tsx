import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import About from '@/pages/About';
import Readers from '@/pages/Readers';
import Shop from '@/pages/Shop';
import Live from '@/pages/Live';
import Community from '@/pages/Community';
import Policies from '@/pages/Policies';
import ReadingInterface from '@/components/reading/ReadingInterface';
import LiveStreamPage from '@/pages/live/LiveStreamPage';
import NotFound from '@/pages/NotFound';
import { WebRTCProvider } from '@/contexts/WebRTCContext';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
      <div className="text-white text-xl font-['Playfair_Display']">
        Loading SoulSeer...
      </div>
    </div>
  </div>
);

// Profile sync component
const ProfileSync = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  
  useEffect(() => {
    if (isLoaded && user) {
      // Sync user profile with backend
      const syncProfile = async () => {
        try {
          const response = await fetch('/api/auth/sync-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getToken()}`
            },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.imageUrl
            })
          });
          
          if (!response.ok) {
            console.error('Failed to sync profile');
          }
        } catch (error) {
          console.error('Profile sync error:', error);
        }
      };
      
      syncProfile();
    }
  }, [user, isLoaded]);
  
  if (!isLoaded) {
    return <LoadingSpinner />;
  }
  
  return <>{children}</>;
};

function App() {
  useEffect(() => {
    // Add Google Fonts
    const link1 = document.createElement('link');
    link1.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap';
    link1.rel = 'stylesheet';
    document.head.appendChild(link1);

    const link2 = document.createElement('link');
    link2.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap';
    link2.rel = 'stylesheet';
    document.head.appendChild(link2);

    // Set background image
    document.body.style.backgroundImage = 'url(https://i.postimg.cc/sXdsKGTK/DALL-E-2025-06-06-14-36-29-A-vivid-ethereal-background-image-designed-for-a-psychic-reading-app.webp)';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';

    return () => {
      document.head.removeChild(link1);
      document.head.removeChild(link2);
      document.body.style.backgroundImage = '';
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <WebRTCProvider>
          <ProfileSync>
            <Router>
              <div className="min-h-screen bg-gray-900/90 backdrop-blur-sm">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={
                    <Layout>
                      <Home />
                    </Layout>
                  } />
                  
                  <Route path="/login" element={
                    <SignedOut>
                      <Layout>
                        <Login />
                      </Layout>
                    </SignedOut>
                  } />
                  
                  <Route path="/signup" element={
                    <SignedOut>
                      <Layout>
                        <Signup />
                      </Layout>
                    </SignedOut>
                  } />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard/*" element={
                    <SignedIn>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </SignedIn>
                  } />
                  
                  {/* Reading session route (full screen) */}
                  <Route path="/reading/:id" element={
                    <SignedIn>
                      <ReadingInterface />
                    </SignedIn>
                  } />
                  
                  {/* Live stream route (full screen) */}
                  <Route path="/live/:id" element={
                    <SignedIn>
                      <LiveStreamPage />
                    </SignedIn>
                  } />
                  
                  {/* Reader routes */}
                  <Route path="/readers" element={
                    <Layout>
                      <Readers />
                    </Layout>
                  } />
                  
                  {/* Shop routes */}
                  <Route path="/shop" element={
                    <Layout>
                      <Shop />
                    </Layout>
                  } />
                  
                  {/* Live streams */}
                  <Route path="/live" element={
                    <Layout>
                      <Live />
                    </Layout>
                  } />
                  
                  {/* Community routes */}
                  <Route path="/community" element={
                    <Layout>
                      <Community />
                    </Layout>
                  } />
                  
                  {/* About page */}
                  <Route path="/about" element={
                    <Layout>
                      <About />
                    </Layout>
                  } />
                  
                  {/* Policies page */}
                  <Route path="/policies" element={
                    <Layout>
                      <Policies />
                    </Layout>
                  } />
                  
                  {/* 404 route */}
                  <Route path="*" element={
                    <Layout>
                      <NotFound />
                    </Layout>
                  } />
                </Routes>
              </div>
            </Router>
            
            {/* Toast notifications */}
            <Toaster 
              position="top-right" 
              richColors 
              theme="dark"
              toastOptions={{
                style: {
                  background: '#1f2937',
                  border: '1px solid #374151',
                  color: '#f9fafb',
                },
              }}
            />
          </ProfileSync>
        </WebRTCProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;