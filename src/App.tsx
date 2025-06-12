import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import ReadingPage from '@/pages/reading/ReadingPage';
import LiveStreamPage from '@/pages/live/LiveStreamPage';
import NotFound from '@/pages/NotFound';
import { WebRTCProvider } from '@/contexts/WebRTCContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  if (isAuthenticated === null) {
    // Still checking auth state
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="soulseer-theme">
      <WebRTCProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              
              {/* Protected routes */}
              <Route path="dashboard/*" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Reading session route */}
              <Route path="reading/:id" element={
                <ProtectedRoute>
                  <ReadingPage />
                </ProtectedRoute>
              } />
              
              {/* Live stream route */}
              <Route path="live/:id" element={
                <ProtectedRoute>
                  <LiveStreamPage />
                </ProtectedRoute>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
        <Toaster position="top-right" richColors />
      </WebRTCProvider>
    </ThemeProvider>
  );
}

export default App;