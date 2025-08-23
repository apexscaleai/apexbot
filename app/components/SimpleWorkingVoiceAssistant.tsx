"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useVoiceBot, VoiceBotStatus } from "../context/VoiceBotContextProvider";
import { isMobile } from "react-device-detect";
import Orb from "./Orb";

interface SimpleWorkingVoiceAssistantProps {
  requiresUserActionToInitialize?: boolean;
  className?: string;
}

export default function SimpleWorkingVoiceAssistant({
  requiresUserActionToInitialize = false,
  className = "",
}: SimpleWorkingVoiceAssistantProps) {
  const {
    status,
    addVoicebotMessage,
    toggleSleep,
    startListening,
    startSpeaking,
  } = useVoiceBot();
  
  const audioContext = useRef<AudioContext | null>(null);
  const agentVoiceAnalyser = useRef<AnalyserNode | null>(null);
  const recognition = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(!requiresUserActionToInitialize);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const greetingInProgress = useRef(false);
  const greetingTriggered = useRef(false);
  const speechSupportRef = useRef(false); // Stable ref for speech support
  const hasGreetedRef = useRef(false); // Stable ref for greeting state

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupportsSpeechRecognition(true);
      speechSupportRef.current = true; // Set stable ref
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';
      
      recognition.current.onstart = () => {
        console.log("🎤 Speech recognition started");
        setIsListening(true);
        startListening();
      };
      
      recognition.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscription(interimTranscript);
        
        if (finalTranscript) {
          console.log("🎯 Final transcript:", finalTranscript);
          setTranscription("");
          handleTranscription(finalTranscript);
        }
      };
      
      recognition.current.onend = () => {
        console.log("🎤 Speech recognition ended");
        setIsListening(false);
      };
      
      recognition.current.onerror = (event: any) => {
        console.error("🎤 Speech recognition error:", event.error);
        setIsListening(false);
      };
    } else {
      console.log("❌ Speech recognition not supported");
    }
  }, []);

  // Initialize audio context for TTS playback
  useEffect(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: "interactive",
        sampleRate: 24000,
      });
      agentVoiceAnalyser.current = audioContext.current.createAnalyser();
      agentVoiceAnalyser.current.fftSize = 2048;
      agentVoiceAnalyser.current.smoothingTimeConstant = 0.96;
    }
  }, []);

  const playAudio = async (audioData: ArrayBuffer, isGreeting = false) => {
    if (!audioContext.current) return;
    
    try {
      const audioBuffer = await audioContext.current.decodeAudioData(audioData);
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      
      if (agentVoiceAnalyser.current) {
        source.connect(agentVoiceAnalyser.current);
        agentVoiceAnalyser.current.connect(audioContext.current.destination);
      } else {
        source.connect(audioContext.current.destination);
      }
      
      source.start();
      
      source.onended = () => {
        console.log("🔊 Audio playback finished");
        if (isGreeting) {
          console.log("👋 Greeting complete, ready for user input");
          setHasGreeted(true);
          hasGreetedRef.current = true; // Set stable ref
          greetingInProgress.current = false;
          setIsProcessing(false);
          // Auto-start listening after greeting
          setTimeout(() => {
            if (speechSupportRef.current && !isListening) {
              console.log("🎤 Auto-starting voice recognition after greeting...");
              startVoiceRecognition();
            }
          }, 1000);
        } else {
          // After normal response, automatically start listening again
          setIsProcessing(false);
          setTimeout(() => {
            console.log(`🎤 Auto-listen check: speechSupportRef=${speechSupportRef.current}, hasGreetedRef=${hasGreetedRef.current}, isListening=${isListening}`);
            if (speechSupportRef.current && hasGreetedRef.current) {
              console.log("🎤 Auto-starting voice recognition...");
              setIsListening(false); // Force reset listening state
              setTimeout(() => {
                startVoiceRecognition();
              }, 100); // Small delay to ensure state updates
            }
          }, 800); // Slightly longer delay
        }
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsProcessing(false);
      if (isGreeting) {
        setHasGreeted(true);
        hasGreetedRef.current = true; // Set stable ref
        greetingInProgress.current = false;
      } else {
        // Auto-start listening even if audio fails
        setTimeout(() => {
          console.log(`🎤 Auto-listen check (error case): speechSupportRef=${speechSupportRef.current}, hasGreetedRef=${hasGreetedRef.current}, isListening=${isListening}`);
          if (speechSupportRef.current && hasGreetedRef.current) {
            console.log("🎤 Auto-starting voice recognition after audio error...");
            setIsListening(false); // Force reset listening state
            setTimeout(() => {
              startVoiceRecognition();
            }, 100); // Small delay to ensure state updates
          }
        }, 800); // Slightly longer delay
      }
    }
  };

  const playGreeting = async () => {
    if (hasGreeted || greetingInProgress.current) return;
    
    greetingInProgress.current = true;
    console.log("👋 Playing Lexy's greeting...");
    setIsProcessing(true);
    startSpeaking();
    
    const greetingText = "Hi there! I'm Lexy, your AI assistant from Apex Scale AI. I'm here to help you explore how our intelligent automation solutions can transform your business. How can I assist you today?";
    
    addVoicebotMessage({ assistant: greetingText });
    
    try {
      console.log("🔊 Converting greeting to speech...");
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: greetingText })
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        console.log("🔊 Playing greeting audio");
        await playAudio(audioBuffer, true);
      } else {
        console.error("TTS failed for greeting:", ttsResponse.status);
        setHasGreeted(true);
        hasGreetedRef.current = true; // Set stable ref
        greetingInProgress.current = false;
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error playing greeting:', error);
      setHasGreeted(true);
      hasGreetedRef.current = true; // Set stable ref
      greetingInProgress.current = false;
      setIsProcessing(false);
    }
  };

  const handleTranscription = async (transcript: string) => {
    if (isProcessing || transcript.length < 3) {
      console.log("🔄 Ignoring short or duplicate transcription:", transcript);
      return;
    }
    
    setIsProcessing(true);
    setIsListening(false);
    addVoicebotMessage({ user: transcript });

    try {
      console.log("🤖 Sending to Gemini:", transcript);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: transcript,
          sessionId: 'voice-session'
        })
      });

      const { reply } = await response.json();
      console.log("🤖 AI response:", reply);
      
      addVoicebotMessage({ assistant: reply });
      startSpeaking();

      console.log("🔊 Converting to speech...");
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply })
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        console.log("🔊 Playing audio response");
        await playAudio(audioBuffer, false);
      } else {
        console.error("TTS failed:", ttsResponse.status);
        setIsProcessing(false);
      }

    } catch (error) {
      console.error('Error processing transcription:', error);
      setIsProcessing(false);
    }
  };

  const startVoiceRecognition = () => {
    console.log(`🎤 startVoiceRecognition called: recognition=${!!recognition.current}, isListening=${isListening}, isProcessing=${isProcessing}`);
    if (recognition.current && !isListening && !isProcessing) {
      try {
        console.log("🎤 Starting speech recognition...");
        recognition.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    } else {
      console.log("🎤 Cannot start recognition - conditions not met");
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
    }
  };

  const handleVoiceBotAction = () => {
    if (requiresUserActionToInitialize && !isInitialized) {
      console.log("🚀 Initializing voice assistant...");
      setIsInitialized(true);
      return;
    }

    if (!hasGreeted) {
      playGreeting();
    } else if (isListening) {
      stopVoiceRecognition();
    } else if (!isProcessing) {
      startVoiceRecognition();
    }
  };

  // Auto-start greeting (using ref to prevent React StrictMode duplicates)
  useEffect(() => {
    if (isInitialized && !hasGreeted && !requiresUserActionToInitialize && 
        !greetingInProgress.current && !greetingTriggered.current) {
      greetingTriggered.current = true;
      console.log("🚀 Starting greeting sequence...");
      const timeoutId = setTimeout(() => {
        playGreeting();
      }, 1000);
      
      // Cleanup function to prevent duplicate execution
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isInitialized, hasGreeted, requiresUserActionToInitialize]);

  if (!supportsSpeechRecognition) {
    return (
      <div className={className}>
        <div className="text-center p-8">
          <div className="text-red-400 mb-4">Speech Recognition Not Supported</div>
          <div className="text-apex-text text-sm">
            Your browser doesn't support speech recognition. Please use the text chat instead.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Orb
        agentVoiceAnalyser={agentVoiceAnalyser.current}
        userVoiceAnalyser={null}
        onOrbClick={handleVoiceBotAction}
        status={status}
        socketState={hasGreeted ? 1 : 0}
        isInitialized={isInitialized}
        requiresUserActionToInitialize={requiresUserActionToInitialize}
      />
      
      <Fragment>
        {!isInitialized && requiresUserActionToInitialize && (
          <button 
            className="text-center w-full mt-4 btn btn-primary" 
            onClick={handleVoiceBotAction}
          >
            <span className="text-xl">Tap to start!</span>
          </button>
        )}
        
        {!hasGreeted && isInitialized && (
          <div className="text-center mt-4">
            <div className="text-apex-text text-sm">
              Starting Lexy...
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="text-center mt-4">
            <div className="text-blue-400 text-sm">
              {status === VoiceBotStatus.SPEAKING ? "Lexy is speaking..." : "Processing your request..."}
            </div>
          </div>
        )}
        
        {hasGreeted && !isProcessing && !isListening && (
          <div className="text-center mt-4">
            <div className="text-green-400 text-sm">
              Ready! {isMobile ? "Tap" : "Click"} the orb to start talking.
            </div>
          </div>
        )}
        
        {isListening && !isProcessing && hasGreeted && (
          <div className="text-center mt-4">
            <div className="text-green-400 text-sm">
              Listening... Speak now!
            </div>
            {transcription && (
              <div className="text-sm text-gray-500 mt-2">
                "{transcription}"
              </div>
            )}
            <div className="text-xs text-gray-600 mt-2">
              {isMobile ? "Tap" : "Click"} the orb to stop
            </div>
          </div>
        )}
        
        {status === VoiceBotStatus.SLEEPING && (
          <div className="text-center mt-4">
            <div className="text-apex-text text-sm">
              Voice assistant is sleeping. {isMobile ? "Tap" : "Click"} the orb to wake up.
            </div>
          </div>
        )}
      </Fragment>
    </div>
  );
}