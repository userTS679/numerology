import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, User, Calculator, MessageCircle, Lock, Unlock } from "lucide-react";
import CalculatorSection from "@/components/calculator-section";
import CompatibilitySection from "@/components/compatibility-section";
import ChatSection from "@/components/chat-section";
import { AuthModal } from "@/components/auth/AuthModal";

export interface NumerologyResult {
  reading: any;
  calculation: any;
  insight: string;
}

export interface CompatibilityResult {
  compatibilityScore: number;
  category: string;
  summary: string;
  analysis: {
    partner1: any;
    partner2: any;
    advanced: {
      score: number;
      category: string;
      summary: string;
      details: {
        lifePath: string;
        expression: string;
        soulUrge: string;
        personality: string;
        birthday: string;
        hiddenPassion: string;
        loShu: string;
        pinnacles: string;
      };
    };
    strengths: string[];
    challenges: string[];
    insight: string;
    detailedInsights: any;
  };
}

export default function Home() {
  const [numerologyResult, setNumerologyResult] = useState<NumerologyResult | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const { user, signOut, loading } = useAuth();

  const handleAuthRequired = (type: 'login' | 'signup' = 'login') => {
    setAuthTab(type);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setNumerologyResult(null);
    setCompatibilityResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-600">NumenCoach</h1>
              <span className="ml-2 text-sm text-gray-500 hidden sm:inline">
                आपका नुमेरोलॉजी गुरू
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Unlock className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700 hidden sm:inline">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    data-testid="button-signout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    साइन आउट
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleAuthRequired('login')}
                    variant="outline"
                    size="sm"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    data-testid="button-header-login"
                  >
                    <User className="w-4 h-4 mr-2" />
                    लॉग इन
                  </Button>
                  <Button
                    onClick={() => handleAuthRequired('signup')}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                    data-testid="button-header-signup"
                  >
                    साइन अप
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            स्वागत है NumenCoach में
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-6">
            अपनी नुमेरोलॉजी जानें, प्रेम संगम देखें, और AI से बात करें
          </p>
          {!user && (
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Lock className="w-4 h-4" />
              <span>पूरी रिपोर्ट के लिए मुफ्त खाता बनाएं</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white shadow-sm">
            <TabsTrigger 
              value="calculator" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600"
              data-testid="tab-calculator"
            >
              <Calculator className="w-4 h-4" />
              <span>कैलकुलेटर</span>
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-600"
              data-testid="tab-chat"
            >
              <MessageCircle className="w-4 h-4" />
              <span>AI चैट</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-8">
            <CalculatorSection 
              onResult={setNumerologyResult} 
              isLoggedIn={!!user}
              onAuthRequired={() => handleAuthRequired('signup')}
            />
            <CompatibilitySection 
              onResult={setCompatibilityResult}
              isLoggedIn={!!user}
              onAuthRequired={() => handleAuthRequired('signup')}
            />
          </TabsContent>

          <TabsContent value="chat">
            <ChatSection 
              isLoggedIn={!!user}
              onAuthRequired={() => handleAuthRequired('signup')}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">
            © 2025 NumenCoach - आपका डिजिटल नुमेरोलॉजी गुरू
          </p>
          <p className="text-sm text-gray-500 mt-2">
            भारतीय परंपरा के साथ आधुनिक तकनीक
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authTab}
      />
    </div>
  );
}