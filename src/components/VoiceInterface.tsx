"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInterfaceProps {
  onSpeechInput: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  className?: string;
}

// Define SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceInterface({
  onSpeechInput,
  onSpeechStart,
  onSpeechEnd,
  className,
}: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join("");

          onSpeechInput(transcript);
        };

        recognitionInstance.onstart = () => {
          setIsListening(true);
          if (onSpeechStart) onSpeechStart();
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
          if (onSpeechEnd) onSpeechEnd();
        };

        recognitionInstance.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (onSpeechEnd) onSpeechEnd();
        };

        setRecognition(recognitionInstance);
      } else {
        setIsSupported(false);
      }
    }

    return () => {
      if (recognition) {
        recognition.onend = null;
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        if (isListening) recognition.stop();
      }
    };
  }, [onSpeechInput, onSpeechStart, onSpeechEnd]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }, [isListening, recognition]);

  if (!isSupported) {
    return null; // Don't render the button if speech recognition is not supported
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={toggleListening}
      className={cn("relative", className)}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
