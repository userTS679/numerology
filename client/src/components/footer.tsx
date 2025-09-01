import { Infinity, Facebook, Twitter, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Infinity className="text-primary-foreground h-4 w-4" />
              </div>
              <span className="text-xl font-bold">NumenCoach</span>
            </div>
            <p className="text-sm opacity-80">
              Your trusted numerology और Vedic astrology guide for life insights.
            </p>
          </div>
          
          <div>
            <h5 className="font-semibold mb-4">Services</h5>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#" className="hover:opacity-100">Numerology Reading</a></li>
              <li><a href="#" className="hover:opacity-100">Kundli Generation</a></li>
              <li><a href="#" className="hover:opacity-100">Compatibility Check</a></li>
              <li><a href="#" className="hover:opacity-100">AI Consultation</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-semibold mb-4">Support</h5>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#" className="hover:opacity-100">Help Center</a></li>
              <li><a href="#" className="hover:opacity-100">Privacy Policy</a></li>
              <li><a href="#" className="hover:opacity-100">Terms of Service</a></li>
              <li><a href="#" className="hover:opacity-100">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-semibold mb-4">Connect</h5>
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80">
                <Facebook className="text-primary-foreground h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80">
                <Twitter className="text-primary-foreground h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80">
                <Instagram className="text-primary-foreground h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80">
                <MessageCircle className="text-primary-foreground h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm opacity-80">
          <p>&copy; 2024 NumenCoach. All rights reserved. Made with ❤️ for Indian users.</p>
        </div>
      </div>
    </footer>
  );
}
