import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Moon, Sun, Gem } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Hero Section */}
      <div className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-pink-400 font-['Alex_Brush'] mb-6">
            About SoulSeer
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-['Playfair_Display'] max-w-3xl mx-auto leading-relaxed">
            Connecting souls across dimensions through authentic psychic guidance and spiritual wisdom
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* Mission Statement */}
        <Card className="bg-black/40 border-pink-500/30 mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-pink-400 font-['Alex_Brush'] mb-4">
              Our Sacred Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-white/90 font-['Playfair_Display'] max-w-4xl mx-auto leading-relaxed">
              At SoulSeer, we believe that every soul deserves access to authentic spiritual guidance and psychic insight. 
              Our platform bridges the ethereal and digital realms, creating sacred spaces where gifted readers can share 
              their divine gifts with those seeking clarity, healing, and spiritual awakening. We are committed to fostering 
              genuine connections that transcend the physical world, empowering individuals on their journey of self-discovery 
              and spiritual evolution.
            </p>
          </CardContent>
        </Card>

        {/* Founder Section */}
        <Card className="bg-black/40 border-pink-500/30 mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-pink-400 font-['Alex_Brush'] text-center mb-8">
              Meet Our Founder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-center lg:text-left">
                <div className="relative inline-block mb-6">
                  <img 
                    src="https://i.postimg.cc/s2ds9RtC/FOUNDER.jpg" 
                    alt="Founder"
                    className="w-48 h-48 rounded-full object-cover mx-auto lg:mx-0 border-4 border-pink-500/50"
                  />
                  <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Gem className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                    Spiritual Visionary
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 ml-2">
                    Third-Generation Intuitive
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white font-['Playfair_Display']">
                  Emily Johnson
                </h3>
                <p className="text-white/90 font-['Playfair_Display'] leading-relaxed">
                  Emily comes from a long lineage of gifted psychics and spiritual healers. Born with the rare gift of 
                  clairvoyance and clairsentience, she has been providing spiritual guidance for over 15 years. Her journey 
                  began at the age of 7 when she first communicated with spirit guides, and she has since dedicated her life 
                  to helping others connect with their divine purpose.
                </p>
                <p className="text-white/90 font-['Playfair_Display'] leading-relaxed">
                  After witnessing the challenges that many face in finding authentic spiritual guidance in an increasingly 
                  digital world, Emily founded SoulSeer with the vision of creating a sacred digital sanctuary where genuine 
                  psychic readers could share their gifts with those in need of spiritual clarity and healing.
                </p>
                <div className="flex items-center space-x-4 text-pink-400">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-1 fill-current" />
                    <span className="font-['Playfair_Display']">15+ Years Experience</span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 mr-1 fill-current" />
                    <span className="font-['Playfair_Display']">10,000+ Readings</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Our Values */}
        <Card className="bg-black/40 border-pink-500/30 mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-pink-400 font-['Alex_Brush'] text-center mb-8">
              Our Sacred Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white font-['Playfair_Display'] mb-2">
                  Authentic Connection
                </h4>
                <p className="text-white/80 font-['Playfair_Display']">
                  We believe in fostering genuine spiritual connections between readers and clients, free from pretense or manipulation.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Moon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white font-['Playfair_Display'] mb-2">
                  Sacred Privacy
                </h4>
                <p className="text-white/80 font-['Playfair_Display']">
                  Your spiritual journey is sacred. We protect your privacy and ensure all sessions remain confidential and secure.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sun className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white font-['Playfair_Display'] mb-2">
                  Empowerment
                </h4>
                <p className="text-white/80 font-['Playfair_Display']">
                  We empower both readers and clients to embrace their spiritual gifts and find clarity on their life's path.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <Card className="bg-black/40 border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-3xl text-pink-400 font-['Alex_Brush'] text-center mb-8">
              The SoulSeer Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold text-white font-['Playfair_Display'] mb-4">
                  For Seekers
                </h4>
                <ul className="space-y-2 text-white/90 font-['Playfair_Display']">
                  <li>• Connect with verified, authentic psychic readers</li>
                  <li>• Choose from chat, audio, or video sessions</li>
                  <li>• Secure wallet system for convenient payments</li>
                  <li>• Private, confidential spiritual guidance</li>
                  <li>• Access to specialized readers for different needs</li>
                  <li>• Session history and reading records</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-bold text-white font-['Playfair_Display'] mb-4">
                  For Readers
                </h4>
                <ul className="space-y-2 text-white/90 font-['Playfair_Display']">
                  <li>• Professional platform to share your gifts</li>
                  <li>• Flexible scheduling and availability control</li>
                  <li>• Fair 70/30 revenue sharing model</li>
                  <li>• Advanced session management tools</li>
                  <li>• Client rating and feedback system</li>
                  <li>• Comprehensive analytics and earnings tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;