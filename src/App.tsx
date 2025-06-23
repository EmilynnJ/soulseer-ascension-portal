import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import ReadingInterface from '@/components/reading/ReadingInterface';
import LiveStreamPage from '@/pages/live/LiveStreamPage';
import NotFound from '@/pages/NotFound';
import { WebRTCProvider } from '@/contexts/WebRTCContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading SoulSeer...
          </div>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public route component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl font-['Playfair_Display']">
            Loading SoulSeer...
          </div>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
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
                  <PublicRoute>
                    <Layout>
                      <Login />
                    </Layout>
                  </PublicRoute>
                } />
                
                <Route path="/signup" element={
                  <PublicRoute>
                    <Layout>
                      <Signup />
                    </Layout>
                  </PublicRoute>
                } />
                
                {/* Protected routes */}
                <Route path="/dashboard/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* Reading session route (full screen) */}
                <Route path="/reading/:id" element={
                  <ProtectedRoute>
                    <ReadingInterface />
                  </ProtectedRoute>
                } />
                
                {/* Live stream route (full screen) */}
                <Route path="/live/:id" element={
                  <ProtectedRoute>
                    <LiveStreamPage />
                  </ProtectedRoute>
                } />
                
                {/* Reader routes */}
                <Route path="/readers" element={
                  <Layout>
                    <div className="min-h-screen py-12">
                      <div className="max-w-7xl mx-auto px-4">
                        <h1 className="font-['Alex_Brush'] text-5xl text-pink-500 text-center mb-8">
                          Our Gifted Readers
                        </h1>
                        {/* Reader directory component would go here */}
                      </div>
                    </div>
                  </Layout>
                } />
                
                {/* Shop routes */}
                <Route path="/shop" element={
                  <Layout>
                    <div className="min-h-screen py-12">
                      <div className="max-w-7xl mx-auto px-4">
                        <h1 className="font-['Alex_Brush'] text-5xl text-pink-500 text-center mb-8">
                          Spiritual Marketplace
                        </h1>
                        {/* Shop component would go here */}
                      </div>
                    </div>
                  </Layout>
                } />
                
                {/* Community routes */}
                <Route path="/community" element={
                  <Layout>
                    <div className="min-h-screen py-12">
                      <div className="max-w-7xl mx-auto px-4">
                        <h1 className="font-['Alex_Brush'] text-5xl text-pink-500 text-center mb-8">
                          Soul Tribe Community
                        </h1>
                        {/* Community forum component would go here */}
                      </div>
                    </div>
                  </Layout>
                } />
                
                {/* About page */}
                <Route path="/about" element={
                  <Layout>
                    <div className="min-h-screen py-12">
                      <div className="max-w-4xl mx-auto px-4">
                        <div className="text-center mb-12">
                          <h1 className="font-['Alex_Brush'] text-6xl text-pink-500 mb-8">
                            About SoulSeer
                          </h1>
                          <div className="mb-8">
                            <img 
                              src="https://i.postimg.cc/s2ds9RtC/FOUNDER.jpg" 
                              alt="Founder" 
                              className="w-48 h-48 rounded-full mx-auto object-cover border-4 border-pink-500"
                            />
                          </div>
                        </div>
                        <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-8 text-white">
                          <div className="font-['Playfair_Display'] text-lg leading-relaxed space-y-6">
                            <p>
                              At SoulSeer, we are dedicated to providing ethical, compassionate, and judgment-free spiritual guidance. Our mission is twofold: to offer clients genuine, heart-centered readings and to uphold fair, ethical standards for our readers.
                            </p>
                            <p>
                              Founded by psychic medium Emilynn, SoulSeer was created as a response to the corporate greed that dominates many psychic platforms. Unlike other apps, our readers keep the majority of what they earn and play an active role in shaping the platform.
                            </p>
                            <p>
                              SoulSeer is more than just an app—it's a soul tribe. A community of gifted psychics united by our life's calling: to guide, heal, and empower those who seek clarity on their journey.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
        </WebRTCProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;