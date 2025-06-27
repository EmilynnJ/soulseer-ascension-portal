import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, Heart, Scale, Lock, Eye } from 'lucide-react';

const Policies: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-pink-400 font-['Alex_Brush'] mb-4">
            Policies & Guidelines
          </h1>
          <p className="text-xl text-white/90 font-['Playfair_Display'] max-w-2xl mx-auto">
            Our commitment to your safety, privacy, and spiritual wellbeing
          </p>
        </div>

        <Tabs defaultValue="terms" className="space-y-8">
          <TabsList className="bg-black/40 border-pink-500/30 grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger 
              value="terms" 
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400"
            >
              <FileText className="w-4 h-4 mr-2" />
              Terms of Service
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400"
            >
              <Lock className="w-4 h-4 mr-2" />
              Privacy Policy
            </TabsTrigger>
            <TabsTrigger 
              value="community" 
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400"
            >
              <Heart className="w-4 h-4 mr-2" />
              Community Guidelines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-pink-400 font-['Alex_Brush'] flex items-center">
                  <Scale className="w-6 h-6 mr-2" />
                  Terms of Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-white/90 font-['Playfair_Display']">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h3>
                  <p className="leading-relaxed">
                    By accessing and using SoulSeer, you accept and agree to be bound by the terms and provision of this agreement. 
                    SoulSeer is a platform that connects spiritual seekers with gifted psychic readers for entertainment and guidance purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">2. Nature of Services</h3>
                  <p className="leading-relaxed mb-3">
                    SoulSeer provides a platform for spiritual guidance and entertainment. Our services include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Psychic readings via chat, audio, and video</li>
                    <li>Live streaming spiritual sessions</li>
                    <li>Community forums for spiritual discussion</li>
                    <li>Spiritual marketplace for tools and courses</li>
                  </ul>
                  <p className="leading-relaxed mt-3">
                    All readings are for entertainment purposes only and should not replace professional medical, legal, 
                    or financial advice. You must be 18 years or older to use our services.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">3. Payment and Billing</h3>
                  <p className="leading-relaxed">
                    SoulSeer operates on a per-minute billing system. Rates are displayed before each session. 
                    You must maintain sufficient wallet balance for uninterrupted service. Refunds are available 
                    within the first 3 minutes of a session if you're not satisfied.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">4. Reader Obligations</h3>
                  <p className="leading-relaxed">
                    Our readers agree to provide authentic, compassionate guidance. SoulSeer maintains a 70/30 revenue 
                    split in favor of readers. All readers undergo verification and background checks to ensure quality service.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">5. Prohibited Activities</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Sharing personal contact information outside the platform</li>
                    <li>Harassment, abuse, or inappropriate conduct</li>
                    <li>Making medical, legal, or financial predictions</li>
                    <li>Recording sessions without consent</li>
                    <li>Creating multiple accounts to circumvent policies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">6. Limitation of Liability</h3>
                  <p className="leading-relaxed">
                    SoulSeer and its readers provide spiritual guidance for entertainment purposes. We are not liable 
                    for decisions made based on readings. Users acknowledge that psychic readings are subjective 
                    and outcomes cannot be guaranteed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-pink-400 font-['Alex_Brush'] flex items-center">
                  <Shield className="w-6 h-6 mr-2" />
                  Privacy Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-white/90 font-['Playfair_Display']">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Data Collection</h3>
                  <p className="leading-relaxed mb-3">
                    We collect information necessary to provide our spiritual services:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Account information (email, name, payment details)</li>
                    <li>Session data (duration, ratings, feedback)</li>
                    <li>Communication content (for quality assurance)</li>
                    <li>Usage analytics (to improve our platform)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Data Protection</h3>
                  <p className="leading-relaxed">
                    Your spiritual journey is sacred. We use industry-standard encryption to protect your data. 
                    Session content is encrypted and automatically deleted after 30 days unless saved by mutual consent. 
                    We never share personal information with third parties without explicit consent.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Cookies and Tracking</h3>
                  <p className="leading-relaxed">
                    We use essential cookies for platform functionality and optional analytics cookies to improve 
                    user experience. You can control cookie preferences in your account settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Data Rights</h3>
                  <p className="leading-relaxed mb-3">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Access your personal data</li>
                    <li>Request data correction or deletion</li>
                    <li>Export your data</li>
                    <li>Withdraw consent for data processing</li>
                    <li>File complaints with data protection authorities</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Third-Party Services</h3>
                  <p className="leading-relaxed">
                    We use trusted third-party services for payment processing (Stripe), authentication (), 
                    and communication infrastructure. These partners maintain their own privacy policies and security standards.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Contact for Privacy Matters</h3>
                  <p className="leading-relaxed">
                    For privacy-related questions or requests, contact our Data Protection Officer at privacy@soulseer.com. 
                    We respond to all requests within 30 days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card className="bg-black/40 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-2xl text-pink-400 font-['Alex_Brush'] flex items-center">
                  <Heart className="w-6 h-6 mr-2" />
                  Community Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-white/90 font-['Playfair_Display']">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Our Sacred Space</h3>
                  <p className="leading-relaxed">
                    SoulSeer is more than a platform—it's a sacred community where souls connect, learn, and grow together. 
                    Our guidelines ensure this remains a safe, supportive space for all spiritual seekers.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Core Values</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Respect:</strong> Honor diverse spiritual paths and beliefs</li>
                    <li><strong>Compassion:</strong> Approach all interactions with kindness</li>
                    <li><strong>Authenticity:</strong> Share genuine experiences and insights</li>
                    <li><strong>Confidentiality:</strong> Respect the privacy of shared experiences</li>
                    <li><strong>Non-judgment:</strong> Create space for all perspectives</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Encouraged Behaviors</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Share personal spiritual experiences and insights</li>
                    <li>Ask questions with genuine curiosity</li>
                    <li>Offer support and encouragement to fellow seekers</li>
                    <li>Practice active listening in discussions</li>
                    <li>Welcome newcomers with open hearts</li>
                    <li>Express gratitude for guidance received</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Prohibited Behaviors</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Harassment, bullying, or personal attacks</li>
                    <li>Sharing others' private session content</li>
                    <li>Promoting competing platforms or services</li>
                    <li>Making medical, legal, or financial advice claims</li>
                    <li>Spreading fear-based or harmful predictions</li>
                    <li>Soliciting personal information or off-platform contact</li>
                    <li>Discrimination based on any personal characteristics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Reader Code of Ethics</h3>
                  <p className="leading-relaxed mb-3">
                    Our readers commit to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Providing honest, compassionate guidance</li>
                    <li>Maintaining professional boundaries</li>
                    <li>Respecting client confidentiality</li>
                    <li>Avoiding dependency-creating relationships</li>
                    <li>Empowering clients to make their own decisions</li>
                    <li>Refusing to provide harmful or fear-based readings</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Reporting and Moderation</h3>
                  <p className="leading-relaxed">
                    If you encounter behavior that violates our guidelines, please report it through our platform. 
                    Our moderation team reviews all reports within 24 hours. We believe in restorative rather than 
                    punitive approaches, focusing on education and community healing.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Consequences</h3>
                  <p className="leading-relaxed">
                    Violations may result in warnings, temporary suspensions, or permanent bans depending on severity. 
                    We always aim to preserve our community's sacred energy while ensuring accountability.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="bg-black/40 border-pink-500/30 mt-8">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Eye className="w-5 h-5 text-pink-400" />
              <span className="text-white font-['Playfair_Display']">Last updated: January 15, 2024</span>
            </div>
            <p className="text-white/80 font-['Playfair_Display']">
              For questions about these policies, contact us at{' '}
              <a href="mailto:support@soulseer.com" className="text-pink-400 hover:text-pink-300">
                support@soulseer.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Policies;