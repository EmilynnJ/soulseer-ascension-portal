import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
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
import { useEffect, useState } from 'react';
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
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
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
        </WebRTCProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;