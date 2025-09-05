import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MapPin, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  dateOfBirth: string;
  timeOfBirth?: string;
  placeOfBirth: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  gender?: string;
  dataConsent: boolean;
  marketingConsent: boolean;
}

interface RegistrationFormProps {
  onSuccess: (data: any) => void;
  onSwitchToLogin: () => void;
}

export function RegistrationForm({ onSuccess, onSwitchToLogin }: RegistrationFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<RegistrationData>();

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const response = await apiRequest('POST', '/api/users/register', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "खाता बन गया! 🎉",
        description: data.kundli ? "आपका Kundli भी तैयार हो गया है!" : "प्रोफाइल complete करें।"
      });
      onSuccess(data);
    },
    onError: (error: any) => {
      toast({
        title: "Registration में समस्या",
        description: error.message || "कुछ गलत हुआ है। कृपया दोबारा कोशिश करें।",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: RegistrationData) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "पासवर्ड मैच नहीं",
        description: "दोनों पासवर्ड एक जैसे होने चाहिए।",
        variant: "destructive"
      });
      return;
    }

    registerMutation.mutate(data);
  };

  const handleLocationSearch = async (place: string) => {
    // Mock geocoding - in production, use Google Maps API or similar
    const mockCoordinates = {
      'Delhi': { lat: 28.6139, lon: 77.2090, timezone: 'Asia/Kolkata' },
      'Mumbai': { lat: 19.0760, lon: 72.8777, timezone: 'Asia/Kolkata' },
      'Bangalore': { lat: 12.9716, lon: 77.5946, timezone: 'Asia/Kolkata' },
      'Chennai': { lat: 13.0827, lon: 80.2707, timezone: 'Asia/Kolkata' },
      'Kolkata': { lat: 22.5726, lon: 88.3639, timezone: 'Asia/Kolkata' },
    };

    const coords = mockCoordinates[place as keyof typeof mockCoordinates];
    if (coords) {
      setValue('latitude', coords.lat);
      setValue('longitude', coords.lon);
      setValue('timezone', coords.timezone);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-orange-600">
          NumenCoach में स्वागत है
        </CardTitle>
        <CardDescription>
          {step === 1 ? "अपना खाता बनाएं" : "जन्म की जानकारी दें"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <>
              {/* Basic Account Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    पूरा नाम *
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName", { required: "नाम जरूरी है" })}
                    placeholder="राम कुमार शर्मा"
                    className="text-lg p-3"
                    data-testid="input-full-name"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    ईमेल एड्रेस *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", { required: "ईमेल जरूरी है" })}
                    placeholder="ram@example.com"
                    className="text-lg p-3"
                    data-testid="input-email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      पासवर्ड *
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password", { required: "पासवर्ड जरूरी है" })}
                        placeholder="कम से कम 8 अक्षर"
                        className="text-lg p-3 pr-12"
                        data-testid="input-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">पासवर्ड दोबारा *</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      {...register("confirmPassword", { required: "पासवर्ड confirm करें" })}
                      placeholder="पासवर्ड दोबारा डालें"
                      className="text-lg p-3"
                      data-testid="input-confirm-password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-lg p-3"
                  data-testid="button-next-step"
                >
                  आगे बढ़ें - जन्म की जानकारी
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Birth Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    जन्म तारीख *
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth", { required: "जन्म तारीख जरूरी है" })}
                    className="text-lg p-3"
                    data-testid="input-date-of-birth"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeOfBirth" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    जन्म समय (सटीक Kundli के लिए जरूरी)
                  </Label>
                  <Input
                    id="timeOfBirth"
                    type="time"
                    {...register("timeOfBirth")}
                    className="text-lg p-3"
                    data-testid="input-time-of-birth"
                  />
                  <p className="text-xs text-gray-500">
                    अगर exact time नहीं पता, तो approximate time डालें
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    जन्म स्थान *
                  </Label>
                  <Input
                    id="placeOfBirth"
                    {...register("placeOfBirth", { required: "जन्म स्थान जरूरी है" })}
                    placeholder="दिल्ली, भारत"
                    className="text-lg p-3"
                    data-testid="input-place-of-birth"
                    onChange={(e) => {
                      const value = e.target.value;
                      setValue('placeOfBirth', value);
                      if (value.length > 3) {
                        handleLocationSearch(value);
                      }
                    }}
                  />
                  {errors.placeOfBirth && (
                    <p className="text-sm text-destructive">{errors.placeOfBirth.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">लिंग (वैकल्पिक)</Label>
                  <Select onValueChange={(value) => setValue("gender", value)}>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">पुरुष</SelectItem>
                      <SelectItem value="female">महिला</SelectItem>
                      <SelectItem value="other">अन्य</SelectItem>
                      <SelectItem value="prefer_not_to_say">नहीं बताना चाहते</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="dataConsent"
                      {...register("dataConsent", { required: "Data consent जरूरी है" })}
                      data-testid="checkbox-data-consent"
                    />
                    <Label htmlFor="dataConsent" className="text-sm leading-relaxed">
                      मैं अपनी जन्म की जानकारी NumenCoach के साथ share करने के लिए सहमत हूं। 
                      यह data सिर्फ Kundli बनाने के लिए use होगा। *
                    </Label>
                  </div>
                  {errors.dataConsent && (
                    <p className="text-sm text-destructive">{errors.dataConsent.message}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="marketingConsent"
                      {...register("marketingConsent")}
                      data-testid="checkbox-marketing-consent"
                    />
                    <Label htmlFor="marketingConsent" className="text-sm leading-relaxed">
                      मुझे astrology tips और offers के बारे में email भेजें (वैकल्पिक)
                    </Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    data-testid="button-back"
                  >
                    वापस
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-lg p-3"
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "खाता बना रहे हैं..." : "खाता बनाएं और Kundli पाएं"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>

        {step === 2 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              पहले से खाता है?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-orange-600 hover:text-orange-700 font-medium"
                data-testid="link-login"
              >
                लॉग इन करें
              </button>
            </p>
          </div>
        )}

        {/* Registration Benefits */}
        {step === 1 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">Registration के फायदे:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>✓ तुरंत automatic Kundli generation</li>
              <li>✓ Personalized numerology analysis</li>
              <li>✓ AI chat support 24/7</li>
              <li>✓ Compatibility checking with partners</li>
              <li>✓ Secure data storage और privacy</li>
            </ul>
          </div>
        )}

        {/* Privacy Notice */}
        {step === 2 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🔒 आपकी Privacy हमारी Priority</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• सभी personal data encrypted रहता है</li>
              <li>• कभी भी third party के साथ share नहीं करते</li>
              <li>• आप कभी भी अपना data delete कर सकते हैं</li>
              <li>• Industry standard security measures</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}