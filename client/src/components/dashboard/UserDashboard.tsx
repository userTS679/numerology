import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Star, 
  Heart, 
  DollarSign, 
  AlertTriangle, 
  Calendar,
  MessageCircle,
  Settings,
  Crown,
  Zap
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ChartPreview } from '@/components/vedic/ChartPreview';
import { ShortReading } from '@/components/vedic/ShortReading';
import { PaywallModal } from '@/components/vedic/PaywallModal';
import { ProgressiveProfile } from '@/components/vedic/ProgressiveProfile';

interface UserDashboardProps {
  onStartChat: () => void;
  onCheckCompatibility: () => void;
}

export function UserDashboard({ onStartChat, onCheckCompatibility }: UserDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Fetch user profile and Kundli
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/users/profile'],
    enabled: !!user,
  });

  const generateKundliMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/users/generate-kundli', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kundli तैयार हो गया! ✨",
        description: "आपका complete birth chart generate हो गया है।"
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">आपका dashboard लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  const profile = profileData?.profile;
  const kundli = profileData?.kundli;
  const hasKundli = profileData?.hasKundli;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                नमस्ते, {user?.fullName?.split(' ')[0] || 'Friend'}! 🙏
              </h1>
              <p className="text-lg text-gray-600">आपका personal astrology dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                Free Plan
              </Badge>
              <Button
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                data-testid="button-upgrade"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </div>
          </div>

          {/* Profile Completeness */}
          {profile && profile.profileCompleteness < 100 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Completeness</span>
                  <span className="text-sm text-orange-600">{profile.profileCompleteness}%</span>
                </div>
                <Progress value={profile.profileCompleteness} className="mb-3" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-orange-700">
                    Complete profile for better predictions
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowProfileModal(true)}
                    data-testid="button-complete-profile"
                  >
                    Complete करें
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="kundli" data-testid="tab-kundli">Kundli</TabsTrigger>
            <TabsTrigger value="compatibility" data-testid="tab-compatibility">Compatibility</TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Insights Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-red-700">
                    <Heart className="w-5 h-5 mr-2" />
                    Love & Relationships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-600 mb-3">
                    {kundli?.reading?.summary || "Venus strong position में है - love life में positive changes expected।"}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onCheckCompatibility}
                    className="w-full border-red-200 text-red-600 hover:bg-red-100"
                    data-testid="button-check-love"
                  >
                    Partner Compatibility Check करें
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-green-700">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Finance & Career
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600 mb-3">
                    2nd house में Jupiter - financial growth के strong chances हैं।
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowPaywall(true)}
                    className="w-full border-green-200 text-green-600 hover:bg-green-100"
                    data-testid="button-check-finance"
                  >
                    Detailed Career Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-amber-700">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Challenges & Remedies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-600 mb-3">
                    Saturn transit - patience और hard work की जरूरत है।
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowPaywall(true)}
                    className="w-full border-amber-200 text-amber-600 hover:bg-amber-100"
                    data-testid="button-check-remedies"
                  >
                    Remedies & Solutions
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Kundli Status */}
            {!hasKundli && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Star className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">आपका Kundli अभी तक नहीं बना है</h3>
                    <p className="text-gray-600 mb-4">
                      Complete birth chart और detailed predictions के लिए Kundli generate करें
                    </p>
                    <Button
                      onClick={() => generateKundliMutation.mutate()}
                      disabled={generateKundliMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700"
                      data-testid="button-generate-kundli"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {generateKundliMutation.isPending ? "Generate हो रहा है..." : "Kundli Generate करें"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Kundli generated</span>
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">AI chat session</span>
                    </div>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="kundli" className="space-y-6">
            {hasKundli && kundli ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <ChartPreview chart={kundli.natalChart} />
                <ShortReading reading={kundli.reading} />
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Kundli Generate करें</h3>
                  <p className="text-gray-600 mb-4">
                    आपका complete birth chart और predictions देखने के लिए
                  </p>
                  <Button
                    onClick={() => generateKundliMutation.mutate()}
                    disabled={generateKundliMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Generate My Kundli
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="compatibility">
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Compatibility Analysis</h3>
                <p className="text-gray-600 mb-4">
                  अपने partner के साथ compatibility check करें
                </p>
                <Button
                  onClick={onCheckCompatibility}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-start-compatibility"
                >
                  Start Compatibility Check
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Chat Support</h3>
                <p className="text-gray-600 mb-4">
                  अपने astrology questions पूछें
                </p>
                <Button
                  onClick={onStartChat}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-start-chat"
                >
                  Start Chat with NumenCoach
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />
      
      <ProgressiveProfile
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentProfile={profile}
      />
    </div>
  );
}