"use client";

import { useState, useCallback, useEffect } from "react";
import Avatar from "./Avatar";
import VoiceInterface from "./VoiceInterface";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "model";
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) return;
  
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
  
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
  
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id, message: input.trim() }), // Include userId
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }
  
      if (!data.chatHistory) {
        throw new Error("Received empty chat history from server");
      }
  
      setMessages(
        data.chatHistory.map((msg: Message, index: number) => ({
          id: index.toString(),
          content: msg.content,
          role: msg.role === "model" ? "assistant" : "user",
          timestamp: new Date(),
        }))
      );
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I encountered an error. Please try again.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
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
          </div>
        ))}
      </div>

      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Login Required</h3>
            <p className="mb-6">You need to be logged in to send messages.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLoginPopup(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLoginPopup(false);
                  router.push("/login");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
