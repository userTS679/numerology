import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        {activeTab === 'login' ? (
          <LoginForm 
            onSwitchToSignup={() => setActiveTab('signup')} 
            onClose={onClose}
          />
        ) : (
          <SignupForm 
            onSwitchToLogin={() => setActiveTab('login')} 
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}