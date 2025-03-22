"use client";

import { useEffect, useState, useCallback } from "react";

interface VoiceInterfaceProps {
  onSpeechInput: (text: string) => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
}

export default function VoiceInterface({
  onSpeechInput,
  onSpeechStart,
  onSpeechEnd,
}: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );

  useEffect(() => {
    if (
      (typeof window !== "undefined" && "SpeechRecognition" in window) ||
      "webkitSpeechRecognition" in window
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onstart = () => {
        setIsListening(true);
        onSpeechStart();
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        onSpeechEnd();
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onSpeechInput(transcript);
      };

      setRecognition(recognitionInstance);
    }
  }, [onSpeechInput, onSpeechStart, onSpeechEnd]);

  const startListening = useCallback(() => {
    if (recognition) {
      recognition.start();
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const speak = useCallback(
    (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      onSpeechStart();
      utterance.onend = onSpeechEnd;
    },
    [onSpeechStart, onSpeechEnd]
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`rounded-full p-3 transition-colors ${
          isListening
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        title={isListening ? "Stop listening" : "Start listening"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              isListening
                ? "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M16 12H8"
                : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            }
          />
        </svg>
      </button>
    </div>
  );
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
