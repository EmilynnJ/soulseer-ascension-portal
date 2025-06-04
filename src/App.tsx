import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes without layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          
          {/* Main routes with layout */}
          <Route path="/" element={
            <Layout>
              <Home />
            </Layout>
          } />
          <Route path="/about" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">About SoulSeer</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/readers" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Reader Directory</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/live" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Live Readings</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/shop" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Mystical Shop</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/community" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Spiritual Community</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/help" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Help Center</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          <Route path="/policies" element={
            <Layout>
              <div className="min-h-screen py-20 px-4 text-center">
                <h1 className="text-4xl font-bold text-gradient-mystic mb-4">Policies</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </Layout>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
