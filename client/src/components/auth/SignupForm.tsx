import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

interface SignupFormProps {
  onSwitchToLogin: () => void
  onClose: () => void
}

export function SignupForm({ onSwitchToLogin, onClose }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: "पासवर्ड मैच नहीं",
        description: "दोनों पासवर्ड एक जैसे होने चाहिए।",
        variant: "destructive"
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "पासवर्ड छोटा है",
        description: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)
    
    if (error) {
      toast({
        title: "साइन अप में समस्या",
        description: error.message === 'User already registered' 
          ? "यह ईमेल पहले से उपयोग में है। कृपया लॉग इन करें।"
          : "कुछ गलत हुआ है। कृपया बाद में कोशिश करें।",
        variant: "destructive"
      })
    } else {
      toast({
        title: "खाता बन गया!",
        description: "कृपया अपना ईमेल चेक करें और वेरिफिकेशन लिंक पर क्लिक करें।"
      })
      onClose()
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-orange-600">साइन अप करें</CardTitle>
        <CardDescription>
          अपना मुफ्त खाता बनाएं और विस्तृत नुमेरोलॉजी रिपोर्ट पाएं
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              ईमेल
            </Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="आपका ईमेल एड्रेस"
              required
              data-testid="input-signup-email"
              className="text-lg p-3"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              पासवर्ड
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="कम से कम 6 अक्षर"
                required
                data-testid="input-signup-password"
                className="text-lg p-3 pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-signup-password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              पासवर्ड दोबारा डालें
            </Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="पासवर्ड की पुष्टि करें"
              required
              data-testid="input-confirm-password"
              className="text-lg p-3"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-lg p-3"
            disabled={loading}
            data-testid="button-signup"
          >
            {loading ? "खाता बना रहे हैं..." : "साइन अप करें"}
          </Button>
        </form>

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
      </CardContent>
    </Card>
  )
}