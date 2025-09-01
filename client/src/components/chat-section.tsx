import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bot, User, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSectionProps {
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

export default function ChatSection({ isLoggedIn, onAuthRequired }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! 🙏 Main आपकी numerology guide हूं। कोई भी सवाल पूछ सकते हैं।",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat', {
        message,
        sessionId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove the loading message
        {
          role: "user",
          content: inputMessage,
          timestamp: new Date().toISOString()
        },
        {
          role: "assistant", 
          content: data.response,
          timestamp: new Date().toISOString()
        }
      ]);
      
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      setInputMessage("");
    },
    onError: (error) => {
      // Remove loading message and show error
      setMessages(prev => prev.slice(0, -1));
      toast({
        title: "Chat Error",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleSendMessage = () => {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }
    
    if (!inputMessage.trim()) return;
    
    // Add loading message
    setMessages(prev => [
      ...prev,
      {
        role: "user",
        content: inputMessage,
        timestamp: new Date().toISOString()
      },
      {
        role: "assistant",
        content: "Typing...",
        timestamp: new Date().toISOString()
      }
    ]);
    
    chatMutation.mutate(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section id="chat" className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-blue-600">AI चैट गुरू</h3>
          <p className="text-lg text-gray-600">अपने सवाल पूछें और तुरंत जवाब पाएं</p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="border border-border overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="bg-primary text-primary-foreground p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center mr-3">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">NumenCoach AI</div>
                  <div className="text-sm opacity-90">Online • Ready to help</div>
                </div>
              </div>
            </CardHeader>
            
            {/* Chat Messages */}
            <CardContent className="p-0">
              <div className="h-96 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 ${
                      message.role === 'user' ? 'justify-end' : ''
                    }`}
                    data-testid={`message-${index}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-xs rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                {!isLoggedIn ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">चैट करने के लिए लॉग इन करें</p>
                    <Button
                      onClick={onAuthRequired}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="button-chat-login"
                    >
                      मुफ्त खाता बनाएं
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-3">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="अपना सवाल Hindi या English में पूछें..."
                        className="flex-1 text-lg p-3"
                        disabled={chatMutation.isPending}
                        data-testid="input-chat-message"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={chatMutation.isPending || !inputMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Powered by Groq AI • तुरंत जवाब पाएं
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
