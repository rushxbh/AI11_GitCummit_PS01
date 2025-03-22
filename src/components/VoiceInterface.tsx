"use client";

import { useState, useEffect, useRef } from 'react';

interface VoiceInterfaceProps {
  onSpeechInput: (text: string) => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  emotion?: (emotion: string) => void;
}

export default function VoiceInterface({ 
  onSpeechInput, 
  onSpeechStart, 
  onSpeechEnd,
  emotion
}: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<any>(null);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('Speech recognition not supported in this browser');
        return;
      }
    
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        // Notify parent component that speech recognition started
        if (onSpeechStart) onSpeechStart();
      };
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
          
        setTranscript(transcript);
        
        // If this is a final result, pass it to the parent component
        if (event.results[0].isFinal) {
          if (onSpeechInput) onSpeechInput(transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle specific errors
        if (event.error === 'no-speech') {
          setErrorMessage('No speech detected. Please try again.');
        } else if (event.error === 'aborted') {
          // This is often triggered when the recognition is stopped manually
          // or when another instance starts
          console.log('Recognition was aborted, this is usually normal behavior');
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        
        setIsListening(false);
        if (onSpeechEnd) onSpeechEnd();
        
        // Clear error message after a delay
        if (errorMessage) {
          setTimeout(() => setErrorMessage(''), 3000);
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        // Notify parent component that speech recognition ended
        if (onSpeechEnd) onSpeechEnd();
      };
      
      // Store the recognition instance
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error('Error aborting speech recognition:', error);
        }
      }
    };
  }, [onSpeechInput, onSpeechStart, onSpeechEnd, errorMessage]);

  // Function to toggle listening
  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.abort();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      setIsListening(false);
    } else {
      try {
        // Make sure any previous instances are properly stopped
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {
            console.log('Error aborting previous recognition instance:', e);
          }
        }
        
        // Small delay to ensure previous instance is fully aborted
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setErrorMessage('Failed to start speech recognition. Please try again.');
            setTimeout(() => setErrorMessage(''), 3000);
          }
        }, 100);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  // Text-to-speech function
  const speakText = (text: string) => {
    // Rest of the function remains unchanged
    if (!synth) return;
    
    // Cancel any ongoing speech
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices and select a good one
    let voices = synth.getVoices();
    if (voices.length > 0) {
      // Try to find a nice voice - prefer female voices for assistant
      const preferredVoice = voices.find(
        voice => voice.name.includes('female') || 
                 voice.name.includes('Samantha') || 
                 voice.name.includes('Google') ||
                 voice.name.includes('Microsoft')
      );
      utterance.voice = preferredVoice || voices[0];
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Setup events for lip-sync animation control
    utterance.onstart = () => {
      setIsSpeaking(true);
      onSpeechStart();
      // Set thinking emotion during response
      if (emotion) emotion('thinking');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      onSpeechEnd();
      // Return to neutral emotion after speaking
      if (emotion) emotion('neutral');
    };
    
    // Generate lip sync data
    // In a production environment you would use a proper lip sync API
    // This is just a placeholder functionality
    const words = text.split(' ').length;
    const avgDuration = words * 0.3; // ~0.3 seconds per word
    
    synth.speak(utterance);
  };

  // Expose the speak function to parent components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).speakText = speakText;
    }
  }, []);

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        className={`relative p-3 rounded-full transition-all duration-200 ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-6 h-6"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" 
          />
        </svg>
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>
      
      {errorMessage && (
        <div className="absolute top-full left-0 mt-2 text-red-500 text-sm whitespace-nowrap">
          {errorMessage}
        </div>
      )}
    </div>
  );
}