import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Lightbulb, Check, HeartPulse } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CompatibilityResult } from "@/pages/home";

interface CompatibilityFormData {
  partner1Name: string;
  partner1BirthDate: string;
  partner2Name: string;
  partner2BirthDate: string;
}

interface CompatibilitySectionProps {
  onResult: (result: CompatibilityResult) => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

export default function CompatibilitySection({ onResult, isLoggedIn, onAuthRequired }: CompatibilitySectionProps) {
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<CompatibilityFormData>();
  
  const calculateMutation = useMutation({
    mutationFn: async (data: CompatibilityFormData) => {
      const response = await apiRequest('POST', '/api/compatibility/calculate', data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      onResult(data);
      toast({
        title: "Compatibility Calculated!",
        description: "Your compatibility analysis is ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Calculation Failed",
        description: "Unable to calculate compatibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompatibilityFormData) => {
    calculateMutation.mutate(data);
  };

  const getCompatibilityLevel = (score: number) => {
    if (score >= 85) return { level: "Excellent", color: "text-green-600", bgColor: "bg-green-50" };
    if (score >= 75) return { level: "Very Good", color: "text-blue-600", bgColor: "bg-blue-50" };
    if (score >= 65) return { level: "Good", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    return { level: "Needs Work", color: "text-orange-600", bgColor: "bg-orange-50" };
  };

  return (
    <section id="compatibility" className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-red-600">प्रेम संगम विश्लेषण</h3>
          <p className="text-lg text-gray-600">जानिए आपका partner कितना compatible है</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Partner 1 */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="text-destructive mr-3" />
                  Partner 1
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="partner1Name">Your Name</Label>
                    <Input
                      id="partner1Name"
                      {...register("partner1Name", { required: "Name is required" })}
                      placeholder="Your name"
                      data-testid="input-partner1-name"
                    />
                    {errors.partner1Name && (
                      <p className="text-sm text-destructive">{errors.partner1Name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partner1BirthDate">Birth Date</Label>
                    <Input
                      id="partner1BirthDate"
                      {...register("partner1BirthDate", { required: "Birth date is required" })}
                      type="date"
                      data-testid="input-partner1-date"
                    />
                    {errors.partner1BirthDate && (
                      <p className="text-sm text-destructive">{errors.partner1BirthDate.message}</p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Partner 2 */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="text-secondary mr-3" />
                  Partner 2
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="partner2Name">Partner's Name</Label>
                    <Input
                      id="partner2Name"
                      {...register("partner2Name", { required: "Partner name is required" })}
                      placeholder="Partner's name"
                      data-testid="input-partner2-name"
                    />
                    {errors.partner2Name && (
                      <p className="text-sm text-destructive">{errors.partner2Name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partner2BirthDate">Birth Date</Label>
                    <Input
                      id="partner2BirthDate"
                      {...register("partner2BirthDate", { required: "Partner birth date is required" })}
                      type="date"
                      data-testid="input-partner2-date"
                    />
                    {errors.partner2BirthDate && (
                      <p className="text-sm text-destructive">{errors.partner2BirthDate.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mb-8">
            <Button 
              onClick={handleSubmit(onSubmit)}
              size="lg"
              className="bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90"
              disabled={calculateMutation.isPending}
              data-testid="button-check-compatibility"
            >
              <HeartPulse className="mr-2 h-5 w-5" />
              {calculateMutation.isPending ? "Calculating..." : "Check Compatibility"}
            </Button>
          </div>
          
          {/* Compatibility Results */}
          {result && (
            <div className="space-y-6">
              {/* Quick Result - Always Visible */}
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-red-600 mb-2" data-testid="text-compatibility-score">
                      {result.compatibilityScore}%
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {result.category || getCompatibilityLevel(result.compatibilityScore).level}
                    </h3>
                    <p className="text-gray-700 text-lg">
                      {result.summary || "बहुत अच्छी compatibility है"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results - Login Required */}
              <div className="relative">
                {!isLoggedIn && (
                  <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <Card className="w-full max-w-md mx-4 shadow-lg border-red-200">
                      <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Heart className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">पूरा विश्लेषण देखें</h3>
                        <p className="text-gray-600 mb-4">
                          8-factor विस्तृत compatibility analysis, शादी की सलाह, और विशेष टिप्स के लिए लॉग इन करें
                        </p>
                        <Button
                          onClick={onAuthRequired}
                          className="w-full bg-red-600 hover:bg-red-700"
                          data-testid="button-unlock-compatibility"
                        >
                          मुफ्त खाता बनाएं
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className={!isLoggedIn ? "filter blur-sm" : ""}>
                  {/* Strengths and Challenges */}
                  <Card className="border border-border mb-6">
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-semibold mb-3 text-green-600 flex items-center">
                            <Check className="mr-2 h-4 w-4" />
                            आपकी मजबूतियां
                          </h5>
                          <ul className="space-y-2 text-sm">
                            {result.analysis.strengths?.map((strength: string, index: number) => (
                              <li key={index} className="flex items-center" data-testid={`strength-${index}`}>
                                <Check className="text-green-600 mr-2 h-4 w-4" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold mb-3 text-amber-600 flex items-center">
                            <Lightbulb className="mr-2 h-4 w-4" />
                            सुधार की गुंजाइश
                          </h5>
                          <ul className="space-y-2 text-sm">
                            {result.analysis.challenges?.map((challenge: string, index: number) => (
                              <li key={index} className="flex items-center" data-testid={`challenge-${index}`}>
                                <Lightbulb className="text-amber-600 mr-2 h-4 w-4" />
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {result.analysis.insight && (
                        <div className="mt-6 p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-center" data-testid="text-compatibility-insight">
                            <strong>NumenCoach Insight:</strong> {result.analysis.insight}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Detailed 8-Factor Analysis */}
                  {result.analysis.advanced && (
                    <Card className="border border-border">
                      <CardContent className="pt-6">
                        <h4 className="text-lg font-semibold mb-4 text-center">8-Factor विस्तृत विश्लेषण</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="p-3 bg-red-50 rounded-lg">
                              <div className="font-medium text-red-600">Life Path Connection</div>
                              <div className="text-gray-600">{result.analysis.advanced.details.lifePath}</div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <div className="font-medium text-orange-600">Career & Goals</div>
                              <div className="text-gray-600">{result.analysis.advanced.details.expression}</div>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <div className="font-medium text-yellow-600">Emotional Bond</div>
                              <div className="text-gray-600">{result.analysis.advanced.details.soulUrge}</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="font-medium text-green-600">Social Chemistry</div>
                              <div className="text-gray-600">{result.analysis.advanced.details.personality}</div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="font-medium text-blue-600">Daily Harmony</div>
                              <div className="text-gray-600">{result.analysis.advanced.details.birthday}</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="font-medium text-purple-600">Hidden Desires</div>
                              <div className="text-gray-600">{result.analysis.advanced.details.hiddenPassion}</div>
                            </div>
                            <div className="p-3 bg-pink-50 rounded-lg">
                              <div className="font-medium text-pink-600">Energy Balance</div>
                              <div className="text-gray-600">{result.analysis.advanced.details.loShu}</div>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-lg">
                              <div className="font-medium text-indigo-600">Future Path</div>
                              <div className="text-gray-600">{result.analysis.advanced.details.pinnacles}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
