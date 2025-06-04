import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Moon } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'client'
  });
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual signup logic with Supabase
    console.log('Signup attempt:', formData);
    navigate('/welcome');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-mystic-950 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Star className="h-12 w-12 text-mystic-400 glow-mystic float" />
            <span className="text-3xl font-bold text-gradient-mystic">SoulSeer</span>
          </div>
          <p className="text-gray-400">Begin your spiritual awakening</p>
        </div>

        <Card className="bg-black/30 border-mystic-800/30 backdrop-blur-xl glow-mystic">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gradient-mystic">Create Account</CardTitle>
            <CardDescription className="text-gray-400">
              Join our mystical community of seekers and guides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="bg-mystic-900/20 border-mystic-800/50 text-white focus:border-mystic-400"
                  placeholder="Choose your mystical name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-mystic-900/20 border-mystic-800/50 text-white focus:border-mystic-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="bg-mystic-900/20 border-mystic-800/50 text-white focus:border-mystic-400"
                  placeholder="Create a strong password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="bg-mystic-900/20 border-mystic-800/50 text-white focus:border-mystic-400"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-300">Join as</Label>
                <Select onValueChange={(value) => handleInputChange('role', value)} defaultValue="client">
                  <SelectTrigger className="bg-mystic-900/20 border-mystic-800/50 text-white">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-mystic-900 border-mystic-800">
                    <SelectItem value="client" className="text-white hover:bg-mystic-800">
                      Seeker (Client)
                    </SelectItem>
                    <SelectItem value="reader" className="text-white hover:bg-mystic-800">
                      Spiritual Guide (Reader)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-mystic"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-mystic-400 hover:text-mystic-300 font-medium">
                  Sign in here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Moon className="h-8 w-8 text-celestial-400 mx-auto mb-2 float" />
          <p className="text-gray-500 text-sm">
            Your spiritual adventure begins now ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;