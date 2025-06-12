import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      termsAccepted: false,
    },
  });
  
  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      
      // Create user account
      const { error: signUpError, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.name,
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user?.id,
            display_name: data.name,
            email: data.email,
            role: 'client', // Default role is client
            status: 'active',
            balance: 0,
            created_at: new Date(),
          },
        ]);
      
      if (profileError) throw profileError;
      
      toast.success('Account created successfully! Please check your email to verify your account.');
      navigate('/login');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://i.postimg.cc/sXdsKGTK/DALL-E-2025-06-06-14-36-29-A-vivid-ethereal-background-image-designed-for-a-psychic-reading-app.webp" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      <Card className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm border-gray-700 relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="font-['Alex_Brush'] text-4xl text-pink-500">Join SoulSeer</CardTitle>
          <CardDescription className="font-['Playfair_Display'] text-gray-300">
            Create an account to begin your spiritual journey
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your Name"
                className="bg-gray-700 border-gray-600"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="bg-gray-700 border-gray-600"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-gray-700 border-gray-600"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-gray-700 border-gray-600"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="termsAccepted" {...register('termsAccepted')} />
              <Label htmlFor="termsAccepted" className="text-sm">
                I agree to the{' '}
                <Link to="/terms" className="text-pink-400 hover:text-pink-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-pink-400 hover:text-pink-300">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-red-500">{errors.termsAccepted.message}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-pink-600 hover:bg-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-pink-400 hover:text-pink-300">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;