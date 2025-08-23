"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useMicrophone } from "../context/MicrophoneContextProvider";
import { useVoiceBot, VoiceBotStatus } from "../context/VoiceBotContextProvider";
import { isMobile } from "react-device-detect";
import Orb from "./Orb";

interface StableVoiceAssistantProps {
  requiresUserActionToInitialize?: boolean;
  className?: string;
}

export default function StableVoiceAssistant({
  requiresUserActionToInitialize = false,
  className = "",
}: StableVoiceAssistantProps) {
  const {
    status,
    addVoicebotMessage,
    toggleSleep,
    startListening,
    startSpeaking,
  } = useVoiceBot();
  
  const {
    microphone,
    microphoneState,
    microphoneAudioContext,
    setupMicrophone,
  } = useMicrophone();
  
  const audioContext = useRef<AudioContext | null>(null);
  const agentVoiceAnalyser = useRef<AnalyserNode | null>(null);
  const userVoiceAnalyser = useRef<AnalyserNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(!requiresUserActionToInitialize);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [hasGreeted, setHasGreeted] = useState(false);
  
  // STT WebSocket
  const sttSocket = useRef<WebSocket | null>(null);
  const audioProcessor = useRef<ScriptProcessorNode | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const isConnecting = useRef(false);
  const [transcription, setTranscription] = useState<string>("");

  // Initialize audio context once
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

  // Setup user voice analyzer when microphone is ready
  useEffect(() => {
    if (microphoneAudioContext && microphone && !userVoiceAnalyser.current) {
      userVoiceAnalyser.current = microphoneAudioContext.createAnalyser();
      userVoiceAnalyser.current.fftSize = 2048;
      userVoiceAnalyser.current.smoothingTimeConstant = 0.96;
      microphone.connect(userVoiceAnalyser.current);
      console.log("🎤 User voice analyzer setup complete");
    }
  }, [microphoneAudioContext, microphone]);

  // Setup microphone when component mounts
  useEffect(() => {
    if (microphoneState === null) {
      console.log("🎤 Setting up microphone...");
      setupMicrophone();
    }
  }, [microphoneState, setupMicrophone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (sttSocket.current) {
        sttSocket.current.close();
      }
      if (audioProcessor.current) {
        audioProcessor.current.disconnect();
      }
    };
  }, []);

  const cleanupConnection = () => {
    if (audioProcessor.current) {
      audioProcessor.current.disconnect();
      audioProcessor.current = null;
    }
    if (sttSocket.current) {
      sttSocket.current.close();
      sttSocket.current = null;
    }
    setIsListening(false);
    setConnectionStatus('disconnected');
    isConnecting.current = false;
  };

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
          setIsProcessing(false);
          // Start listening after greeting
          setTimeout(() => {
            startListening();
            setIsListening(true);
            setupAudioProcessing();
          }, 500);
        } else {
          // Normal conversation flow
          setIsProcessing(false);
          setTimeout(() => {
            startListening();
            setIsListening(true);
          }, 500);
        }
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsProcessing(false);
      if (isGreeting) {
        setHasGreeted(true);
        setTimeout(() => {
          startListening();
          setIsListening(true);
          setupAudioProcessing();
        }, 1000);
      } else {
        startListening();
        setIsListening(true);
      }
    }
  };

  const playGreeting = async () => {
    if (hasGreeted) return; // Prevent multiple greetings
    
    console.log("👋 Playing Lexy's greeting...");
    setIsProcessing(true);
    startSpeaking();
    
    const greetingText = "Hi there! I'm Lexy, your AI assistant from Apex Scale AI. I'm here to help you explore how our intelligent automation solutions can transform your business. How can I assist you today?";
    
    // Add greeting to conversation
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
        setIsProcessing(false);
        setTimeout(() => {
          startListening();
          setIsListening(true);
          setupAudioProcessing();
        }, 1000);
      }
    } catch (error) {
      console.error('Error playing greeting:', error);
      setHasGreeted(true);
      setIsProcessing(false);
      setTimeout(() => {
        startListening();
        setIsListening(true);
        setupAudioProcessing();
      }, 1000);
    }
  };

  const setupAudioProcessing = () => {
    if (!microphone || !microphoneAudioContext || !sttSocket.current) {
      console.log("🎤 Not ready for audio processing");
      return;
    }
    if (sttSocket.current.readyState !== WebSocket.OPEN) {
      console.log("🎤 WebSocket not ready");
      return;
    }
    if (audioProcessor.current) {
      console.log("🎤 Audio processing already set up");
      return;
    }

    console.log("🎤 Setting up audio processing...");
    const processor = microphoneAudioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (event) => {
      if (sttSocket.current?.readyState === WebSocket.OPEN && isListening && !isProcessing) {
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Convert to Int16
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        sttSocket.current.send(pcmData.buffer);
      }
    };

    microphone.connect(processor);
    processor.connect(microphoneAudioContext.destination);
    audioProcessor.current = processor;
    console.log("🎤 Audio processing active");
  };

  const connectSTT = useCallback(async () => {
    if (isConnecting.current) {
      console.log("🔌 Connection already in progress");
      return;
    }
    if (sttSocket.current?.readyState === WebSocket.OPEN) {
      console.log("🎤 STT already connected");
      return;
    }

    try {
      isConnecting.current = true;
      setConnectionStatus('connecting');
      console.log('🔌 Getting auth token...');
      
      const tokenResponse = await fetch('/api/authenticate', { method: 'POST' });
      const { access_token } = await tokenResponse.json();
      
      console.log('🔌 Connecting to Deepgram STT...');
      const ws = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&language=en-US&endpointing=300',
        ['token', access_token]
      );

      ws.onopen = () => {
        console.log('✅ STT WebSocket connected');
        sttSocket.current = ws;
        setConnectionStatus('connected');
        isConnecting.current = false;
        
        // Play greeting only once
        if (!hasGreeted) {
          playGreeting();
        } else {
          // Already greeted, just start listening
          setTimeout(() => {
            startListening();
            setIsListening(true);
            setupAudioProcessing();
          }, 500);
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          if (transcript) {
            if (!data.is_final) {
              setTranscription(transcript);
            } else {
              console.log("🎯 Final transcript:", transcript);
              setTranscription("");
              handleTranscription(transcript);
            }
          }
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 STT WebSocket closed (Code: ${event.code})`);
        cleanupConnection();
        
        // Only reconnect if we were successfully connected and it wasn't intentional
        if (hasGreeted && event.code !== 1000 && isInitialized) {
          console.log("🔄 Unexpected disconnect, reconnecting in 2 seconds...");
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          reconnectTimer.current = setTimeout(() => {
            connectSTT();
          }, 2000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ STT WebSocket error:', error);
        cleanupConnection();
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Error connecting to STT:', error);
      setConnectionStatus('error');
      isConnecting.current = false;
    }
  }, [hasGreeted, isInitialized]);

  const handleTranscription = async (transcript: string) => {
    if (isProcessing) {
      console.log("🔄 Already processing, ignoring new transcription");
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
        setIsListening(true);
        startListening();
      }

    } catch (error) {
      console.error('Error processing transcription:', error);
      setIsProcessing(false);
      setIsListening(true);
      startListening();
    }
  };

  const handleVoiceBotAction = () => {
    if (requiresUserActionToInitialize && !isInitialized) {
      console.log("🚀 Initializing voice assistant...");
      setIsInitialized(true);
      return;
    }

    if (connectionStatus === 'disconnected' && microphoneState === 1 && !isConnecting.current) {
      console.log("🔌 Starting voice connection...");
      connectSTT();
    } else if (connectionStatus === 'connected') {
      if (status !== VoiceBotStatus.NONE) {
        console.log("😴 Toggling sleep mode");
        toggleSleep();
      }
    }
  };

  // Auto-connect when ready (only once)
  useEffect(() => {
    if (isInitialized && microphoneState === 1 && connectionStatus === 'disconnected' && !requiresUserActionToInitialize && !isConnecting.current) {
      console.log("🔄 Auto-connecting STT...");
      const timer = setTimeout(() => {
        connectSTT();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, microphoneState, connectionStatus, requiresUserActionToInitialize, connectSTT]);

  return (
    <div className={className}>
      <Orb
        agentVoiceAnalyser={agentVoiceAnalyser.current}
        userVoiceAnalyser={userVoiceAnalyser.current}
        onOrbClick={handleVoiceBotAction}
        status={status}
        socketState={connectionStatus === 'connected' ? 1 : 0}
        isInitialized={isInitialized}
        requiresUserActionToInitialize={requiresUserActionToInitialize}
      />
      
      {!microphone && (
        <div className="text-base text-apex-text text-center w-full mt-4">
          Loading microphone...
        </div>
      )}
      
      {microphone && (
        <Fragment>
          {!isInitialized && requiresUserActionToInitialize && (
            <button 
              className="text-center w-full mt-4 btn btn-primary" 
              onClick={handleVoiceBotAction}
            >
              <span className="text-xl">Tap to start!</span>
            </button>
          )}
          
          {microphoneState === 0 && (
            <div className="text-center mt-4">
              <div className="text-apex-text text-sm">
                Setting up microphone...
              </div>
            </div>
          )}
          
          {connectionStatus === 'connecting' && microphoneState === 1 && (
            <div className="text-center mt-4">
              <div className="text-apex-text text-sm">
                Connecting to voice assistant...
              </div>
            </div>
          )}
          
          {connectionStatus === 'connected' && isProcessing && !isListening && (
            <div className="text-center mt-4">
              <div className="text-blue-400 text-sm">
                {status === VoiceBotStatus.SPEAKING ? "Lexy is speaking..." : "Processing your request..."}
              </div>
            </div>
          )}
          
          {connectionStatus === 'connected' && !isProcessing && !isListening && !hasGreeted && (
            <div className="text-center mt-4">
              <div className="text-green-400 text-sm">
                Connected! Starting...
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
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="text-center mt-4">
              <div className="text-red-400 text-sm mb-2">
                Connection failed
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setConnectionStatus('disconnected');
                  connectSTT();
                }}
              >
                Retry
              </button>
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
      )}
    </div>
  );
}