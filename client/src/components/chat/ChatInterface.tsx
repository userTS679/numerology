import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  User, 
  Send, 
  MessageCircle, 
  Trash2, 
  Plus,
  Sparkles,
  Clock
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface ChatSession {
  id: string;
  name: string;
  messageCount: number;
  lastMessageAt: string;
  isActive: boolean;
  preview: string;
}

export function ChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const { data: chatHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['/api/chat/history'],
    enabled: !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat/send', {
        message,
        sessionId: currentSessionId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(data.messages);
      setCurrentSessionId(data.sessionId);
      setInputMessage('');
      setIsTyping(false);
      refetchHistory();
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Message भेजने में समस्या",
        description: error.message || "कुछ गलत हुआ है। कृपया दोबारा कोशिश करें।",
        variant: "destructive"
      });
    },
  });

  // Load session messages
  const loadSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('GET', `/api/chat/session/${sessionId}`);
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(data.messages);
      setCurrentSessionId(data.sessionId);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    setIsTyping(true);
    sendMessageMutation.mutate(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputMessage('');
  };

  const loadSession = (session: ChatSession) => {
    loadSessionMutation.mutate(session.id);
  };

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-6 h-[600px]">
      {/* Chat History Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chat History</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={startNewChat}
              data-testid="button-new-chat"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 p-4">
              {chatHistory?.sessions?.map((session: ChatSession) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id 
                      ? 'bg-orange-100 border border-orange-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => loadSession(session)}
                  data-testid={`chat-session-${session.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{session.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {session.messageCount}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{session.preview}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(session.lastMessageAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {(!chatHistory?.sessions || chatHistory.sessions.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">कोई chat history नहीं</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Interface */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-white/20">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">NumenCoach AI</CardTitle>
                <p className="text-sm opacity-90">आपका personal astrology guide</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Online
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4" data-testid="chat-messages">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Namaste {user?.fullName?.split(' ')[0]}! 🙏
                  </h3>
                  <p className="text-gray-600">
                    मैं आपकी astrology guide हूं। कोई भी सवाल पूछ सकते हैं।
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                  data-testid={`message-${index}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-orange-100">
                        <Bot className="w-4 h-4 text-orange-600" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100">
                        <User className="w-4 h-4 text-blue-600" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-orange-100">
                      <Bot className="w-4 h-4 text-orange-600" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="अपना सवाल Hindi या English में पूछें..."
                className="flex-1 text-lg p-3"
                disabled={sendMessageMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !inputMessage.trim()}
                className="bg-orange-600 hover:bg-orange-700 px-6"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Powered by Groq AI • तुरंत जवाब पाएं
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Sparkles className="w-3 h-3" />
                <span>Context-aware responses</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}