import { Button } from "@/components/ui/button";
import { Calculator, Play } from "lucide-react";

export default function HeroSection() {
  const scrollToCalculator = () => {
    const element = document.getElementById('calculator');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
          जानिए अपना भविष्य
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Numerology aur Vedic Astrology ke saath apni life ke secrets unlock करें। 
          Simple calculations, deep insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            onClick={scrollToCalculator}
            className="bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90"
            data-testid="button-start-reading"
          >
            <Calculator className="mr-2 h-5 w-5" />
            Start Free Reading
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="text-lg font-semibold"
            data-testid="button-watch-demo"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
