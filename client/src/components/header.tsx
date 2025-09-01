import { Button } from "@/components/ui/button";
import { Infinity, Menu, User } from "lucide-react";

export default function Header() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Infinity className="text-primary-foreground text-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">NumenCoach</h1>
              <p className="text-sm text-muted-foreground">आपका numerology guide</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => scrollToSection('calculator')}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-calculator"
            >
              Calculator
            </button>
            <button 
              onClick={() => scrollToSection('compatibility')}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-compatibility"
            >
              Compatibility
            </button>
            <button 
              onClick={() => scrollToSection('chat')}
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-chat"
            >
              Chat
            </button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-login">
              <User className="mr-2 h-4 w-4" />
              Login
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
            <Menu className="text-xl" />
          </Button>
        </div>
      </div>
    </header>
  );
}
