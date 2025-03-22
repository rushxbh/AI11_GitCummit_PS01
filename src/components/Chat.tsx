"use client";

import type React from "react";

import { useState, useCallback, useEffect, useRef } from "react";
import Avatar from "./Avatar";
import VoiceInterface from "./VoiceInterface";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "model";
  timestamp: Date;
  isLoading?: boolean;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        const response = await fetch(`/api/chat?userId=${user.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch chat history");
        }

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

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    // Add temporary loading message for assistant
    const loadingMessage = {
      id: (Date.now() + 1).toString(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    const currentInput = input.trim();
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, message: currentInput }),
      });

      const data = await response.json();

      // Replace loading message with actual response
      setMessages((prev) =>
        prev
          .filter((msg) => !msg.isLoading)
          .concat({
            id: (Date.now() + 2).toString(),
            content: data.content,
            role: "assistant",
            timestamp: new Date(),
          })
      );
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Replace loading message with error message
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

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto rounded-xl border shadow-sm overflow-hidden bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar isAnimating={isAssistantSpeaking} size={36} />
            {isAssistantSpeaking && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="font-semibold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {isAssistantSpeaking ? "Speaking..." : "Ready to help"}
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user.name || "User"}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {user.name?.charAt(0) || "U"}
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="mb-6 opacity-80">
              <Avatar isAnimating={false} size={80} />
            </div>
            <h3 className="text-xl font-medium mb-2">
              Welcome to AI Assistant
            </h3>
            <p className="text-muted-foreground max-w-md mb-8">
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
                <Button
                  key={suggestion}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 whitespace-normal text-left"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </Button>
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
                    : "bg-muted dark:bg-muted/40 rounded-tl-none"
                )}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                ) : message.role === "user" ? (
                  <div>{message.content}</div>
                ) : (
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                )}

                <div className="mt-1 text-xs opacity-60 text-right">
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 mt-1 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
        className="border-t p-4 bg-background/95 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <VoiceInterface
            onSpeechInput={handleSpeechInput}
            onSpeechStart={handleSpeechStart}
            onSpeechEnd={handleSpeechEnd}
          />

          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />

          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Login Sheet */}
      <Sheet open={showLoginPopup} onOpenChange={setShowLoginPopup}>
        <SheetContent
          side="bottom"
          className="sm:max-w-md sm:mx-auto rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>Login Required</SheetTitle>
            <SheetDescription>
              You need to be logged in to send messages and save your
              conversation history.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 pl-8">
            <p className="text-sm text-muted-foreground">
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
          <SheetFooter className="flex flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setShowLoginPopup(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLoginPopup(false);
                router.push("/login");
              }}
            >
              Login
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
