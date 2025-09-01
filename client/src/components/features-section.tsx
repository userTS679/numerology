import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Atom, MessageCircle } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Why Choose NumenCoach?</h3>
          <p className="text-lg text-muted-foreground">Trusted by thousands for accurate predictions</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="text-center border border-border">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="text-primary text-2xl h-8 w-8" />
              </div>
              <CardTitle>Accurate Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Authentic Pythagorean system के साथ precise numerology calculations।
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center border border-border">
            <CardHeader>
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Atom className="text-secondary text-2xl h-8 w-8" />
              </div>
              <CardTitle>Vedic Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Traditional Kundli generation के साथ complete astrological insights।
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center border border-border">
            <CardHeader>
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-accent text-2xl h-8 w-8" />
              </div>
              <CardTitle>AI Chat Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                24/7 available smart AI जो Hinglish में आपके सवालों का जवाब देता है।
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
