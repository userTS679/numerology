import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface LoginFormProps {
  onSwitchToSignup: () => void
  onClose: () => void
}

export function LoginForm({ onSwitchToSignup, onClose }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)
    
    if (error) {
      toast({
        title: "साइन इन में समस्या",
        description: error.message === 'Invalid login credentials' 
          ? "गलत ईमेल या पासवर्ड। कृपया दोबारा कोशिश करें।"
          : "कुछ गलत हुआ है। कृपया बाद में कोशिश करें।",
        variant: "destructive"
      })
    } else {
      toast({
        title: "स्वागत है!",
        description: "आप सफलतापूर्वक लॉग इन हो गए हैं।"
      })
      onClose()
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-orange-600">लॉग इन करें</CardTitle>
        <CardDescription>
          अपनी पूरी नुमेरोलॉजी रिपोर्ट देखने के लिए लॉग इन करें
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              ईमेल
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="आपका ईमेल एड्रेस"
              required
              data-testid="input-email"
              className="text-lg p-3"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              पासवर्ड
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="आपका पासवर्ड"
                required
                data-testid="input-password"
                className="text-lg p-3 pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-lg p-3"
            disabled={loading}
            data-testid="button-login"
          >
            {loading ? "लॉग इन कर रहे हैं..." : "लॉग इन करें"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            खाता नहीं है?{" "}
            <button
              onClick={onSwitchToSignup}
              className="text-orange-600 hover:text-orange-700 font-medium"
              data-testid="link-signup"
            >
              साइन अप करें
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}