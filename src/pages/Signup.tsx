import { SignUp } from '@clerk/clerk-react';
import { Star } from 'lucide-react';

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
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

        {/* Clerk SignUp Component */}
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              baseTheme: undefined,
              variables: {
                colorPrimary: '#ec4899',
                colorBackground: '#1f2937',
                colorInputBackground: '#374151',
                colorInputText: '#ffffff',
                colorText: '#ffffff',
                colorTextSecondary: '#9ca3af',
                borderRadius: '0.5rem'
              },
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-gray-800/80 backdrop-blur-sm border-gray-700 shadow-xl',
                headerTitle: 'text-white font-["Playfair_Display"]',
                headerSubtitle: 'text-gray-400',
                socialButtonsBlockButton: 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white',
                formButtonPrimary: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02]',
                footerActionLink: 'text-pink-400 hover:text-pink-300',
                identityPreviewText: 'text-white',
                identityPreviewEditButton: 'text-pink-400 hover:text-pink-300'
              }
            }}
            redirectUrl="/dashboard"
            signInUrl="/login"
          />
        </div>

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