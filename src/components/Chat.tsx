"use client";

import { useState, useCallback, useEffect } from "react";
import Avatar from "./Avatar";
import VoiceInterface from "./VoiceInterface";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Send, Loader2, Moon, Sun, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "model";
  timestamp: Date;
  isLoading?: boolean;
}

interface ThemeContextType {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

// Theme Provider
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemPreference;
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme Toggle Button
const ThemeToggle = () => {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("ThemeToggle must be used within ThemeProvider");

  const { theme, setTheme } = context;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-muted/60 transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};

export default function Chat() {
  return (
    <ThemeProvider>
      <ChatContent />
    </ThemeProvider>
  );
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/chat?userId=${user.id}`);
        const data = await response.json();

        if (!response.ok)
          throw new Error(data.error || "Failed to fetch chat history");

        if (data.chatHistory) {
          setMessages(
            data.chatHistory.map((msg: Message, index: number) => ({
              id: index.toString(),
              content: msg.content,
              role: msg.role === "model" ? "assistant" : "user",
              timestamp: new Date(),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setError("Failed to load chat history. Please try refreshing.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatHistory();
  }, [user]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!user) {
      setShowLoginPopup(true);
      return;
    }
  
    setMessages((prev) => [...prev, { id: Date.now().toString(), content: input, role: "user", timestamp: new Date() }]);
    setInput("");
  
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, message: input.trim() }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), content: data.content, role: "assistant", timestamp: new Date() }]);
    } catch (error) {
      console.error("Error getting AI response:", error);
    }
  };
  

  const handleSpeechInput = useCallback((text: string) => {
    setInput(text);
    // Auto-submit after voice input
    setTimeout(() => {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      document.querySelector('form')?.dispatchEvent(event);
    }, 500);
  }, []);

  const handleSpeechStart = useCallback(() => {
    setIsAssistantSpeaking(true);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsAssistantSpeaking(false);
    setAvatarEmotion("neutral");
  }, []);
  
  const handleEmotionChange = useCallback((emotion: string) => {
    setAvatarEmotion(emotion as "neutral" | "happy" | "thinking" | "confused");
  }, []);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 relative">
      <Avatar isAnimating={isAssistantSpeaking} />
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {message.role=="user"? message.content : <ReactMarkdown>{message.content}</ReactMarkdown>}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-4 bg-background/95 backdrop-blur-sm dark:bg-gray-900 dark:border-gray-800"
      >
        <div className="flex items-center gap-2">
          <VoiceInterface
            onSpeechInput={handleSpeechInput}
            onSpeechStart={handleSpeechStart}
            onSpeechEnd={handleSpeechEnd}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 dark:bg-black/70">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 animate-in slide-in-from-bottom-10 dark:bg-gray-800 dark:text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Login Required</h3>
              <button
                onClick={() => setShowLoginPopup(false)}
                className="h-6 w-6 rounded-full hover:bg-muted inline-flex items-center justify-center dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4 dark:text-gray-400">
              You need to be logged in to send messages and save your
              conversation history.
            </p>

            <div className="py-4 pl-8">
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Logging in allows you to:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  Save your conversation history
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  Continue conversations across devices
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  Access premium features
                </li>
              </ul>
            </div>

            <div className="flex flex-row gap-3 justify-end mt-6">
              <button
                onClick={() => setShowLoginPopup(false)}
                className="px-4 py-2 border border-input rounded-md hover:bg-accent dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLoginPopup(false);
                  router.push("/login");
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-10 flex gap-2 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg"
      >
        <VoiceInterface
          onSpeechInput={handleSpeechInput}
          onSpeechStart={handleSpeechStart}
          onSpeechEnd={handleSpeechEnd}
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}