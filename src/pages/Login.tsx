import { SignIn } from '@clerk/clerk-react';
import { Star } from 'lucide-react';

const Login = () => {
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
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-400">
            Sign in to continue your spiritual journey
          </p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <SignIn 
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-gray-800/80 backdrop-blur-sm border-gray-700",
                headerTitle: "text-white font-['Playfair_Display']",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "border-gray-600 text-gray-300 hover:bg-gray-700",
                formButtonPrimary: "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700",
                formFieldInput: "bg-gray-700/50 border-gray-600 text-white",
                formFieldLabel: "text-gray-300",
                footerActionLink: "text-pink-400 hover:text-pink-300"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;