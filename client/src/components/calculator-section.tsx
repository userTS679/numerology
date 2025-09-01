import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Wand2, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LoShuGrid from "@/components/lo-shu-grid";
import type { NumerologyResult } from "@/pages/home";

interface CalculatorFormData {
  fullName: string;
  day: string;
  month: string;
  year: string;
  birthTime?: string;
  birthPlace?: string;
}

interface CalculatorSectionProps {
  onResult: (result: NumerologyResult) => void;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

export default function CalculatorSection({ onResult, isLoggedIn, onAuthRequired }: CalculatorSectionProps) {
  const [result, setResult] = useState<NumerologyResult | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CalculatorFormData>();
  
  const calculateMutation = useMutation({
    mutationFn: async (data: CalculatorFormData) => {
      const birthDate = `${data.year}-${data.month.padStart(2, '0')}-${data.day.padStart(2, '0')}`;
      const response = await apiRequest('POST', '/api/numerology/calculate', {
        fullName: data.fullName,
        birthDate,
        birthTime: data.birthTime,
        birthPlace: data.birthPlace
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      onResult(data);
      toast({
        title: "Calculation Complete!",
        description: "Your numerology reading has been generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Calculation Failed",
        description: "Unable to calculate your numerology. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CalculatorFormData) => {
    calculateMutation.mutate(data);
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  return (
    <section id="calculator" className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-orange-600">नुमेरोलॉजी कैलकुलेटर</h3>
          <p className="text-lg text-gray-600">अपने नंबर जानें और अपना भविष्य समझें</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Form */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCircle className="text-primary mr-3" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name (पूरा नाम)</Label>
                  <Input
                    id="fullName"
                    {...register("fullName", { required: "Full name is required" })}
                    placeholder="Enter your complete name"
                    className="text-lg"
                    data-testid="input-full-name"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Date</Label>
                    <Select onValueChange={(value) => setValue("day", value)}>
                      <SelectTrigger data-testid="select-day">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map(day => (
                          <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select onValueChange={(value) => setValue("month", value)}>
                      <SelectTrigger data-testid="select-month">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      {...register("year", { required: "Year is required" })}
                      placeholder="1977"
                      type="number"
                      className="text-lg"
                      data-testid="input-year"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthTime">Birth Time</Label>
                    <Input
                      id="birthTime"
                      {...register("birthTime")}
                      type="time"
                      className="text-lg"
                      data-testid="input-birth-time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthPlace">Birth Place</Label>
                    <Input
                      id="birthPlace"
                      {...register("birthPlace")}
                      placeholder="City, State"
                      className="text-lg"
                      data-testid="input-birth-place"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90"
                  disabled={calculateMutation.isPending}
                  data-testid="button-calculate"
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  {calculateMutation.isPending ? "Calculating..." : "Calculate My Numbers"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Results Display */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Quick Result - Always Visible */}
                <Card className="border-2 border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2" data-testid="main-life-path">
                        {result.calculation.lifePathNumber}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">आपका मुख्य लाइफ पाथ नंबर</h3>
                      <p className="text-gray-700 text-lg" data-testid="quick-insight">
                        {result.insight.split('.')[0]}.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Results - Login Required */}
                <div className="relative">
                  {!isLoggedIn && (
                    <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
                      <Card className="w-full max-w-md mx-4 shadow-lg border-orange-200">
                        <CardContent className="pt-6 text-center">
                          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-8 h-8 text-orange-600" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">पूरी रिपोर्ट देखें</h3>
                          <p className="text-gray-600 mb-4">
                            अपने सभी नंबर, Lo Shu Grid, और विस्तृत विश्लेषण के लिए लॉग इन करें
                          </p>
                          <Button
                            onClick={onAuthRequired}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            data-testid="button-unlock-details"
                          >
                            मुफ्त खाता बनाएं
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className={!isLoggedIn ? "filter blur-sm" : ""}>
                    {/* Core Numbers */}
                    <Card className="border border-border mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Star className="text-orange-600 mr-3" />
                          सभी मुख्य संख्याएं
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-3xl font-bold text-orange-600" data-testid="number-life-path">
                              {result.calculation.lifePathNumber}
                            </div>
                            <div className="text-sm font-medium">Life Path</div>
                            <div className="text-xs text-gray-500">मुख्य जीवन संख्या</div>
                          </div>
                          <div className="text-center p-4 bg-amber-50 rounded-lg">
                            <div className="text-3xl font-bold text-amber-600" data-testid="number-expression">
                              {result.calculation.expressionNumber}
                            </div>
                            <div className="text-sm font-medium">Expression</div>
                            <div className="text-xs text-gray-500">व्यक्तित्व संख्या</div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-600" data-testid="number-soul-urge">
                              {result.calculation.soulUrgeNumber}
                            </div>
                            <div className="text-sm font-medium">Soul Urge</div>
                            <div className="text-xs text-gray-500">आत्मा की इच्छा</div>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-3xl font-bold text-red-600" data-testid="number-personality">
                              {result.calculation.personalityNumber}
                            </div>
                            <div className="text-sm font-medium">Personality</div>
                            <div className="text-xs text-gray-500">बाहरी व्यक्तित्व</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Lo Shu Grid */}
                    <Card className="border border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <div className="w-6 h-6 bg-orange-600 rounded mr-3 flex items-center justify-center text-white text-sm">#</div>
                          Lo Shu Grid - लो शू ग्रिड
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LoShuGrid grid={result.calculation.loShuGrid} />
                        <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <strong>विशेष:</strong> यह ग्रिड आपकी ऊर्जाओं का नक्शा दिखाता है। 
                            खाली खाने कमी दर्शाते हैं, भरे हुए खाने शक्ति दिखाते हैं।
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <Card className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <Wand2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg">अपना विवरण भरें और अपना नुमेरोलॉजी देखें</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
