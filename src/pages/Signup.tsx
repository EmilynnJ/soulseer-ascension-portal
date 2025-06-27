import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Star, 
  AlertCircle, 
  Loader2,
  Heart,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'client' | 'reader';
  // Reader-specific fields
  bio?: string;
  specialties?: string;
  experience?: string;
  ratePerMinute?: number;
}

const Signup = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'client',
    bio: '',
    specialties: '',
    experience: '',
    ratePerMinute: 3.99,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ratePerMinute' ? parseFloat(value) || 0 : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleRoleChange = (role: 'client' | 'reader') => {
    setFormData(prev => ({
      ...prev,
      role
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.role === 'reader') {
      if (!formData.bio || !formData.specialties || !formData.experience) {
        setError('Please fill in all reader profile fields');
        return false;
      }
      if (formData.ratePerMinute! < 1 || formData.ratePerMinute! > 50) {
        setError('Rate per minute must be between $1.00 and $50.00');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!validateForm()) {
        return;
      }

      // Sign up with 
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
          }
        }
      });

      if (authError) {
        console.error('Signup error:', authError);
        
        if (authError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(authError.message || 'Failed to create account. Please try again.');
        }
        return;
      }

      if (data.user) {
        // Create user profile via API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: data.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role,
            ...(formData.role === 'reader' && {
              bio: formData.bio,
              specialties: formData.specialties.split(',').map(s => s.trim()),
              experience_years: parseInt(formData.experience!),
              rate_per_minute: formData.ratePerMinute,
            })
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create profile');
        }

        toast.success('Account created successfully! Please check your email to verify your account.');
        
        // Show email verification message
        setError('');
        navigate('/login', { 
          state: { 
            message: 'Please check your email and click the verification link before signing in.' 
          } 
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Google sign up error:', error);
        setError('Failed to sign up with Google. Please try again.');
      }
    } catch (error) {
      console.error('Google sign up error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
            <span className="font-['Alex_Brush'] text-4xl text-pink-500">
              SoulSeer
            </span>
          </div>
          
          <h2 className="font-['Playfair_Display'] text-3xl font-bold text-white">
            Join Our Soul Tribe
          </h2>
          <p className="mt-2 text-gray-400">
            Create your account and begin your spiritual journey
          </p>
        </div>

        {/* Signup Form */}
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Create Account</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Choose how you'd like to join our community
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Role Selection */}
            <Tabs value={formData.role} onValueChange={(value) => handleRoleChange(value as 'client' | 'reader')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger value="client" className="data-[state=active]:bg-pink-500">
                  <Heart className="w-4 h-4 mr-2" />
                  Seeker
                </TabsTrigger>
                <TabsTrigger value="reader" className="data-[state=active]:bg-purple-500">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Reader
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                <TabsContent value="client" className="m-0">
                  <div className="text-center">
                    <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                    <h3 className="text-white font-medium mb-2">Soul Seeker</h3>
                    <p className="text-gray-400 text-sm">
                      Connect with gifted psychics for guidance, healing, and spiritual insight on your journey.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="reader" className="m-0">
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="text-white font-medium mb-2">Gifted Reader</h3>
                    <p className="text-gray-400 text-sm">
                      Share your psychic gifts with our community and earn fair compensation for your spiritual services.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-300">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reader-specific fields */}
              {formData.role === 'reader' && (
                <div className="space-y-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <h3 className="text-white font-medium">Reader Profile Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-gray-300">Bio / Introduction *</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell clients about yourself, your gifts, and your approach to readings..."
                      value={formData.bio}
                      onChange={handleChange}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 min-h-[100px]"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="specialties" className="text-gray-300">Specialties *</Label>
                      <Input
                        id="specialties"
                        name="specialties"
                        type="text"
                        placeholder="e.g. Tarot, Love, Career, Mediumship"
                        value={formData.specialties}
                        onChange={handleChange}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-400">Separate multiple specialties with commas</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-gray-300">Years of Experience *</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        min="1"
                        max="50"
                        placeholder="5"
                        value={formData.experience}
                        onChange={handleChange}
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ratePerMinute" className="text-gray-300">Rate per Minute (USD) *</Label>
                    <Input
                      id="ratePerMinute"
                      name="ratePerMinute"
                      type="number"
                      min="1"
                      max="50"
                      step="0.01"
                      placeholder="3.99"
                      value={formData.ratePerMinute}
                      onChange={handleChange}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-400">Recommended range: $3.99 - $15.99 per minute</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  `Create ${formData.role === 'reader' ? 'Reader' : 'Seeker'} Account`
                )}
              </Button>
            </form>

            {/* Google Sign Up */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <a href="/terms" className="text-pink-400 hover:text-pink-300">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-pink-400 hover:text-pink-300">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;