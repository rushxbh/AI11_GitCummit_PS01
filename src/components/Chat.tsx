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
import Navbar from "./Navbar";

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

// Add CSS for hiding scrollbars while maintaining scroll functionality
const noScrollbarStyles = `
  .no-scrollbar {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

export default function Chat() {
  return (
    <ThemeProvider>
      <Navbar />
      {/* Add style tag for the custom scrollbar CSS */}
      <div className="my-5">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          IDMS Bot
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your intelligent companion for seamless conversations
        </p>
      </div>
      <style dangerouslySetInnerHTML={{ __html: noScrollbarStyles }} />
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

  // New avatar state variables
  const [lastAssistantMessage, setLastAssistantMessage] = useState<
    string | null
  >(null);
  const [avatarEmotion, setAvatarEmotion] = useState<
    "neutral" | "happy" | "thinking" | "confused"
  >("neutral");

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

    // Set avatar to thinking emotion when waiting for response
    setAvatarEmotion("thinking");

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

      const assistantContent = data.content || data.message;

      // Process assistant message for avatar emotion detection
      const plainTextMessage = assistantContent
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/\[(.*?)\]$$(.*?)$$/g, "$1")
        .replace(/```[\s\S]*?```/g, "Code snippet")
        .replace(/`(.*?)`/g, "$1")
        .replace(/#{1,6}\s(.*)/g, "$1");

      setLastAssistantMessage(plainTextMessage);

      // Set a default emotion - in a real app you'd analyze the message content
      const hasError =
        plainTextMessage.toLowerCase().includes("error") ||
        plainTextMessage.toLowerCase().includes("sorry");
      const hasExcitement =
        plainTextMessage.toLowerCase().includes("great") ||
        plainTextMessage.toLowerCase().includes("excellent");

      if (hasError) {
        setAvatarEmotion("confused");
      } else if (hasExcitement) {
        setAvatarEmotion("happy");
      } else {
        setAvatarEmotion("neutral");
      }

      setMessages((prev) =>
        prev
          .filter((msg) => !msg.isLoading)
          .concat({
            id: (Date.now() + 2).toString(),
            content: assistantContent,
            role: "assistant",
            timestamp: new Date(),
          })
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      setError("Failed to get response. Please try again.");
      setAvatarEmotion("confused");

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
    setAvatarEmotion("neutral");
  }, []);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  return (
    <div className="flex h-[calc(100vh-15rem)] max-w-4xl mx-auto rounded-xl border border-border shadow-sm overflow-hidden bg-background transition-colors duration-300 dark:bg-gray-900 dark:border-gray-800">
      {/* Chat Section (70% width) */}
      <div className="flex flex-col w-[70%] border-r border-border dark:border-gray-800">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium dark:bg-primary/20">
                AI
              </div>
              {isAssistantSpeaking && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="font-semibold dark:text-white">Sujal Tekwani</h2>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                {isAssistantSpeaking
                  ? "Speaking..."
                  : avatarEmotion === "thinking"
                  ? "Thinking..."
                  : "Ready to help"}
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

        {/* Messages Area - Added no-scrollbar class */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-gray-900 no-scrollbar">
          {isLoading && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground dark:text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
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
                  <div className="w-9 h-9 flex justify-center items-center p-2 flex-shrink-0 mt-1 bg-gray-500 text-primary-foreground rounded-full">
                    AI
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
      </div>

      {/* Avatar Section (30% width) */}
      <div className="w-[30%] flex flex-col bg-muted/20 dark:bg-gray-800/30">
        <div className="p-4 border-b border-border dark:border-gray-800">
          <h3 className="font-semibold dark:text-white">AI Avatar</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="mx-6">
            <Avatar
              isAnimating={isAssistantSpeaking}
              size={200}
              emotion={avatarEmotion}
              assistantMessage={lastAssistantMessage || undefined}
            />
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm font-medium dark:text-white">Current Mood</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400 capitalize">
              {avatarEmotion}
            </p>
          </div>
          {lastAssistantMessage && (
            <div className="mt-8 w-full px-4">
              <p className="text-sm font-medium dark:text-white mb-2">
                Last Response
              </p>
              {/* Added no-scrollbar class to this overflow area */}
              <div className="text-xs text-muted-foreground dark:text-gray-400 bg-background/50 dark:bg-gray-900/50 p-3 rounded-md max-h-32 overflow-y-auto no-scrollbar">
                {lastAssistantMessage}
              </div>
            </div>
          )}
        </div>
      </div>

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
