"use client";

import type React from "react";
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ReactMarkdown, setReactMarkdown] = useState<any>(null);

  // Dynamically import ReactMarkdown (fix ESM issue)
  useEffect(() => {
    import("react-markdown").then((mod) => setReactMarkdown(() => mod.default));
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch previous chat history
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

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    const currentInput = input.trim();
    setInput("");
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, message: currentInput }),
      });
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to get AI response");

      setMessages((prev) =>
        prev
          .filter((msg) => !msg.isLoading)
          .concat({
            id: (Date.now() + 2).toString(),
            content: data.content || data.message,
            role: "assistant",
            timestamp: new Date(),
          })
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      setError("Failed to get response. Please try again.");

      setMessages((prev) =>
        prev
          .filter((msg) => !msg.isLoading)
          .concat({
            id: (Date.now() + 2).toString(),
            content: "Sorry, I encountered an error. Please try again.",
            role: "assistant",
            timestamp: new Date(),
          })
      );
    }
  };

  
  const handleSpeechInput = useCallback((text: string) => {
    setInput(text);
  }, []);

  const handleSpeechStart = useCallback(() => {
    setIsAssistantSpeaking(true);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsAssistantSpeaking(false);
  }, []);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto rounded-xl border border-border shadow-sm overflow-hidden bg-background transition-colors duration-300 dark:bg-gray-900 dark:border-gray-800">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar isAnimating={isAssistantSpeaking} size={36} />
            {isAssistantSpeaking && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="font-semibold dark:text-white">AI Assistant</h2>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              {isAssistantSpeaking ? "Speaking..." : "Ready to help"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground dark:text-gray-400">
                {user.name || "User"}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium dark:bg-primary/20">
                {user.name?.charAt(0) || "U"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 flex items-center gap-2 text-sm dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-gray-900">
        {isLoading && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground dark:text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="mb-6 opacity-80">
              <Avatar isAnimating={false} size={80} />
            </div>
            <h3 className="text-xl font-medium mb-2 dark:text-white">
              Welcome to AI Assistant
            </h3>
            <p className="text-muted-foreground dark:text-gray-400 max-w-md mb-8">
              Ask me anything! I can help with information, creative tasks, or
              just have a conversation.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {[
                "What can you help me with?",
                "Tell me a fun fact",
                "Write a short poem",
                "How does AI work?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="justify-start h-auto py-3 px-4 whitespace-normal text-left border rounded-md hover:bg-muted/50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 group animate-in fade-in-0 slide-in-from-bottom-3 duration-300",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 mt-1">
                  <Avatar isAnimating={message.isLoading || false} size={32} />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl p-4",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted dark:bg-gray-800 rounded-tl-none dark:text-gray-100"
                )}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" />
                  </div>
                ) : message.role === "user" ? (
                  <div>{message.content}</div>
                ) : (
                  ReactMarkdown && (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  )
                )}
                <div className="mt-1 text-xs opacity-60 text-right">
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 mt-1 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:bg-primary/20">
                  {user?.name?.charAt(0) || "U"}
                </div>
              )}
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
    </div>
  );
}
