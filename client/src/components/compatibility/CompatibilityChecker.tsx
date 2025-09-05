import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Calendar, MapPin, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CompatibilityFormData {
  partner2Name: string;
  partner2DateOfBirth: string;
  partner2TimeOfBirth?: string;
  partner2PlaceOfBirth: string;
  partner2Gender?: string;
}

interface CompatibilityResult {
  analysisId: string;
  overallScore: number;
  category: string;
  summary: string;
  categoryScores: {
    love: number;
    marriage: number;
    career: number;
    family: number;
    financial: number;
    spiritual: number;
    communication: number;
    lifestyle: number;
  };
  detailedAnalysis: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
    timing: any;
  };
  aiInsight: string;
}

export function CompatibilityChecker() {
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<CompatibilityFormData>();

  const analyzeMutation = useMutation({
    mutationFn: async (data: CompatibilityFormData) => {
      const response = await apiRequest('POST', '/api/compatibility/analyze', data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Compatibility Analysis Complete! 💕",
        description: `${data.overallScore}% compatibility score calculated`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "कुछ गलत हुआ है। कृपया दोबारा कोशिश करें।",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: CompatibilityFormData) => {
    analyzeMutation.mutate(data);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          💕 Love Compatibility Analysis
        </h2>
        <p className="text-lg text-gray-600">
          जानिए आपका partner कितना compatible है - complete Vedic + Numerology analysis
        </p>
      </div>

      {!result ? (
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center text-pink-700">
              <Users className="w-6 h-6 mr-2" />
              Partner की जानकारी दें
            </CardTitle>
            <CardDescription>
              सटीक compatibility analysis के लिए partner का complete birth data चाहिए
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="partner2Name" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Partner का नाम *
                </Label>
                <Input
                  id="partner2Name"
                  {...register("partner2Name", { required: "Partner का नाम जरूरी है" })}
                  placeholder="प्रिया शर्मा"
                  className="text-lg p-3"
                  data-testid="input-partner-name"
                />
                {errors.partner2Name && (
                  <p className="text-sm text-destructive">{errors.partner2Name.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partner2DateOfBirth" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    जन्म तारीख *
                  </Label>
                  <Input
                    id="partner2DateOfBirth"
                    type="date"
                    {...register("partner2DateOfBirth", { required: "जन्म तारीख जरूरी है" })}
                    className="text-lg p-3"
                    data-testid="input-partner-dob"
                  />
                  {errors.partner2DateOfBirth && (
                    <p className="text-sm text-destructive">{errors.partner2DateOfBirth.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partner2TimeOfBirth">जन्म समय (वैकल्पिक)</Label>
                  <Input
                    id="partner2TimeOfBirth"
                    type="time"
                    {...register("partner2TimeOfBirth")}
                    className="text-lg p-3"
                    data-testid="input-partner-tob"
                  />
                  <p className="text-xs text-gray-500">
                    Time of birth से ज्यादा accurate analysis मिलेगा
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partner2PlaceOfBirth" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  जन्म स्थान *
                </Label>
                <Input
                  id="partner2PlaceOfBirth"
                  {...register("partner2PlaceOfBirth", { required: "जन्म स्थान जरूरी है" })}
                  placeholder="मुंबई, महाराष्ट्र"
                  className="text-lg p-3"
                  data-testid="input-partner-place"
                />
                {errors.partner2PlaceOfBirth && (
                  <p className="text-sm text-destructive">{errors.partner2PlaceOfBirth.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-lg p-4"
                disabled={analyzeMutation.isPending}
                data-testid="button-analyze-compatibility"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {analyzeMutation.isPending ? "Analysis हो रहा है..." : "Compatibility Analysis करें"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className={`border-2 ${getScoreBg(result.overallScore)}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}%
                </div>
                <h3 className="text-2xl font-semibold mb-2">{result.category}</h3>
                <p className="text-lg text-gray-700 mb-4">{result.summary}</p>
                <Badge variant="outline" className="text-sm">
                  AI-Enhanced Analysis
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Category Scores */}
          <Card>
            <CardHeader>
              <CardTitle>विस्तृत Compatibility Breakdown</CardTitle>
              <CardDescription>
                हर category में आपकी compatibility score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(result.categoryScores).map(([category, score]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {getCategoryLabel(category)}
                      </span>
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  आपकी Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.detailedAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-sm text-green-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-700 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Growth Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.detailedAnalysis.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-amber-600 mt-1">⚠</span>
                      <span className="text-sm text-amber-700">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* AI Insight */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">
                    NumenCoach AI Insight
                  </h4>
                  <p className="text-blue-700">{result.aiInsight}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations for Better Relationship</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.detailedAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-orange-600 font-bold">{index + 1}.</span>
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              data-testid="button-new-analysis"
            >
              New Analysis करें
            </Button>
            <Button
              onClick={() => {/* Share functionality */}}
              className="bg-pink-600 hover:bg-pink-700"
              data-testid="button-share-result"
            >
              <Heart className="w-4 h-4 mr-2" />
              Result Share करें
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    love: '💕 Love & Romance',
    marriage: '💍 Marriage',
    career: '💼 Career',
    family: '👨‍👩‍👧‍👦 Family',
    financial: '💰 Financial',
    spiritual: '🕉️ Spiritual',
    communication: '💬 Communication',
    lifestyle: '🏠 Lifestyle'
  };
  return labels[category] || category;
}