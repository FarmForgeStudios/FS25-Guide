import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { useGameData } from '../lib/GameDataContext';
import { useLanguage } from '../lib/LanguageContext';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';

// Use global marked from CDN
declare global {
  interface Window {
    marked: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const { data } = useGameData();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Initialize the chat session when the component mounts or language changes
  useEffect(() => {
    const initChat = async () => {
      console.log("Initializing AI chat...");
      setInitError(null);
      try {
        // @ts-ignore - process.env is injected by the platform
        let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        
        if (!apiKey) {
          try {
            const res = await fetch('/api/env');
            const envData = await res.json();
            apiKey = envData.GEMINI_API_KEY;
          } catch (e) {
            console.error("Failed to fetch env from backend", e);
          }
        }
        
        console.log("API Key available:", !!apiKey);
        if (!apiKey) {
          const errorMsg = "Gemini API key is missing. Please check your environment variables.";
          console.error(errorMsg);
          setInitError(errorMsg);
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Create a summary of the game data to provide context without exceeding token limits
        const gameContext = {
          mapName: data.mapName,
          currentMonth: data.currentMonth,
          fieldsOwned: data.fields.filter(f => f.isOwned).length,
          totalFields: data.fields.length,
          animals: data.animals.map(a => `${a.count} ${a.type}`).join(', '),
          money: data.prices['money'] || 'Unknown',
          productions: Object.keys(data.productions).filter(k => data.productions[k].isOwned).join(', '),
        };

        const systemInstruction = `You are an expert agricultural advisor and AI assistant for Farming Simulator 25. 
The user is playing the game and here is a summary of their current savegame data:
${JSON.stringify(gameContext, null, 2)}

Answer their questions, give them advice on what to plant, what to sell, and how to optimize their farm. 
Be concise, helpful, and friendly. 
Respond in the user's preferred language: ${(language === 'fr' ? 'French' : language === 'de' ? 'German' : language === 'es' ? 'Spanish' : language === 'it' ? 'Italian' : language === 'pt' ? 'Portuguese' : language === 'pl' ? 'Polish' : language === 'ro' ? 'Romanian' : 'English')}.
Do not invent data that is not present in the game context, but you can use your general knowledge of Farming Simulator 25.`;

        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });

        // Add initial greeting
        setMessages([
          {
            id: 'init',
            role: 'assistant',
            content: language === 'fr' 
              ? "Bonjour ! Je suis votre assistant agricole IA. Comment puis-je vous aider à optimiser votre ferme aujourd'hui ?" 
              : "Hello! I am your AI agricultural assistant. How can I help you optimize your farm today?"
          }
        ]);
      } catch (error: any) {
        console.error("Failed to initialize AI chat:", error);
        setInitError(error.message || "Failed to initialize AI chat");
      }
    };
    
    initChat();
  }, [data.mapName, data.currentMonth, language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSend called", { input: input.trim(), isLoading, hasChatRef: !!chatRef.current });
    
    if (!input.trim() || isLoading) return;

    if (!chatRef.current) {
      setInitError("AI Chat is not initialized properly. Please check the API key or refresh the page.");
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response.text || (language === 'fr' ? "Désolé, je n'ai pas pu générer de réponse." : "Sorry, I couldn't generate a response.")
      }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: language === 'fr' 
          ? "Une erreur s'est produite lors de la communication avec l'IA. Veuillez réessayer." 
          : "An error occurred while communicating with the AI. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden max-w-4xl mx-auto my-4 h-[calc(100vh-18rem)] min-h-[500px] transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-800 p-4 flex items-center gap-3 text-white shrink-0">
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <Sparkles className="w-6 h-6 text-emerald-50" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{t('tab.ai')}</h2>
          <p className="text-emerald-100 text-sm">
            {language === 'fr' ? 'Posez vos questions sur Farming Simulator 25' : 'Ask questions about Farming Simulator 25'}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
        {initError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded-xl text-sm">
            <p className="font-bold mb-1">Initialization Error:</p>
            <p>{initError}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              msg.role === 'user' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-tr-none dark:bg-emerald-700" 
                : "bg-white text-gray-800 border border-gray-100 rounded-tl-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            )}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div 
                  className="markdown-body prose prose-sm prose-emerald dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: window.marked ? window.marked.parse(msg.content) : msg.content 
                  }}
                />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="shrink-0 w-8 h-8 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'fr' ? 'Réflexion en cours...' : 'Thinking...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0 transition-colors">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === 'fr' ? 'Posez une question sur votre ferme...' : 'Ask a question about your farm...'}
            className="flex-1 border border-gray-200 dark:border-gray-600 rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-gray-50 dark:bg-gray-700 dark:text-white transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
