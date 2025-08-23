"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useMicrophone } from "../context/MicrophoneContextProvider";
import { useVoiceBot, VoiceBotStatus } from "../context/VoiceBotContextProvider";
import { isMobile } from "react-device-detect";
import Orb from "./Orb";

interface FinalVoiceAssistantProps {
  requiresUserActionToInitialize?: boolean;
  className?: string;
}

export default function FinalVoiceAssistant({
  requiresUserActionToInitialize = false,
  className = "",
}: FinalVoiceAssistantProps) {
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
  const isConnecting = useRef(false);
  const maxReconnectAttempts = 3;
  const reconnectAttempts = useRef(0);
  const connectionEstablished = useRef(false);
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
      if (sttSocket.current) {
        sttSocket.current.close();
      }
      if (audioProcessor.current) {
        audioProcessor.current.disconnect();
      }
    };
  }, []);

  const cleanupConnection = () => {
    if (audioProcessor.current && microphone) {
      try {
        microphone.disconnect(audioProcessor.current);
        audioProcessor.current.disconnect();
        audioProcessor.current = null;
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (sttSocket.current) {
      sttSocket.current.close();
      sttSocket.current = null;
    }
    setIsListening(false);
    setConnectionStatus('disconnected');
    isConnecting.current = false;
    connectionEstablished.current = false;
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
          // Connect STT after greeting
          setTimeout(() => {
            connectSTT();
          }, 1000);
        } else {
          // Normal conversation flow - restart listening
          setIsProcessing(false);
          setTimeout(() => {
            if (connectionEstablished.current && sttSocket.current?.readyState === WebSocket.OPEN) {
              startListening();
              setIsListening(true);
            }
          }, 500);
        }
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsProcessing(false);
      if (isGreeting) {
        setHasGreeted(true);
        setTimeout(() => {
          connectSTT();
        }, 1000);
      }
    }
  };

  const playGreeting = async () => {
    if (hasGreeted) return;
    
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
        setIsProcessing(false);
        setTimeout(() => {
          connectSTT();
        }, 1000);
      }
    } catch (error) {
      console.error('Error playing greeting:', error);
      setHasGreeted(true);
      setIsProcessing(false);
      setTimeout(() => {
        connectSTT();
      }, 1000);
    }
  };

  const setupAudioProcessing = useCallback(() => {
    if (!microphone || !microphoneAudioContext || !sttSocket.current) {
      console.log("🎤 Missing dependencies for audio processing");
      return false;
    }
    if (sttSocket.current.readyState !== WebSocket.OPEN) {
      console.log("🎤 WebSocket not ready");
      return false;
    }
    if (audioProcessor.current) {
      console.log("🎤 Audio processing already active");
      return true;
    }

    try {
      console.log("🎤 Setting up audio processing...");
      const processor = microphoneAudioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (sttSocket.current?.readyState === WebSocket.OPEN && isListening && !isProcessing) {
          const inputData = event.inputBuffer.getChannelData(0);
          
          // Convert to Int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          
          try {
            sttSocket.current.send(pcmData.buffer);
          } catch (error) {
            console.error("Error sending audio data:", error);
          }
        }
      };

      microphone.connect(processor);
      processor.connect(microphoneAudioContext.destination);
      audioProcessor.current = processor;
      console.log("🎤 Audio processing active");
      return true;
    } catch (error) {
      console.error("Error setting up audio processing:", error);
      return false;
    }
  }, [microphone, microphoneAudioContext, isListening, isProcessing]);

  const connectSTT = useCallback(async () => {
    if (isConnecting.current) {
      console.log("🔌 Connection already in progress");
      return;
    }
    if (sttSocket.current?.readyState === WebSocket.OPEN) {
      console.log("🎤 STT already connected");
      return;
    }
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log("❌ Max reconnection attempts reached");
      setConnectionStatus('error');
      return;
    }

    try {
      isConnecting.current = true;
      setConnectionStatus('connecting');
      console.log(`🔌 Getting auth token... (attempt ${reconnectAttempts.current + 1})`);
      
      const tokenResponse = await fetch('/api/authenticate', { method: 'POST' });
      const authData = await tokenResponse.json();
      
      if (!authData.access_token && !authData.key) {
        throw new Error('No valid auth token received');
      }

      const token = authData.access_token || authData.key;
      
      console.log('🔌 Connecting to Deepgram STT...');
      const ws = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&language=en-US&punctuate=true&utterance_end_ms=1000',
        ['token', token]
      );

      ws.onopen = () => {
        console.log('✅ STT WebSocket connected');
        sttSocket.current = ws;
        setConnectionStatus('connected');
        isConnecting.current = false;
        connectionEstablished.current = true;
        reconnectAttempts.current = 0;
        
        // Start listening and setup audio
        setTimeout(() => {
          if (setupAudioProcessing()) {
            startListening();
            setIsListening(true);
          }
        }, 500);
      };

      ws.onmessage = (event) => {
        try {
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
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 STT WebSocket closed (Code: ${event.code})`);
        cleanupConnection();
        
        // Only try to reconnect if we had a successful connection before
        if (connectionEstablished.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 Reconnecting in 3 seconds... (attempt ${reconnectAttempts.current})`);
          setTimeout(() => {
            connectSTT();
          }, 3000);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionStatus('error');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ STT WebSocket error:', error);
        cleanupConnection();
        reconnectAttempts.current++;
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            connectSTT();
          }, 3000);
        } else {
          setConnectionStatus('error');
        }
      };

    } catch (error) {
      console.error('Error connecting to STT:', error);
      setConnectionStatus('error');
      isConnecting.current = false;
      reconnectAttempts.current++;
    }
  }, [setupAudioProcessing, startListening]);

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
        if (connectionEstablished.current) {
          setIsListening(true);
          startListening();
        }
      }

    } catch (error) {
      console.error('Error processing transcription:', error);
      setIsProcessing(false);
      if (connectionEstablished.current) {
        setIsListening(true);
        startListening();
      }
    }
  };

  const handleVoiceBotAction = () => {
    if (requiresUserActionToInitialize && !isInitialized) {
      console.log("🚀 Initializing voice assistant...");
      setIsInitialized(true);
      return;
    }

    if (connectionStatus === 'disconnected' && microphoneState === 1 && !isConnecting.current) {
      console.log("🔌 Manual connection start");
      connectSTT();
    } else if (connectionStatus === 'error') {
      console.log("🔄 Retry connection");
      reconnectAttempts.current = 0;
      setConnectionStatus('disconnected');
      connectSTT();
    } else if (connectionStatus === 'connected') {
      if (status !== VoiceBotStatus.NONE) {
        console.log("😴 Toggling sleep mode");
        toggleSleep();
      }
    }
  };

  // Auto-start sequence
  useEffect(() => {
    if (isInitialized && microphoneState === 1 && connectionStatus === 'disconnected' && !requiresUserActionToInitialize && !isConnecting.current && !hasGreeted) {
      console.log("🚀 Starting greeting sequence...");
      // Start with greeting, then connect STT
      setTimeout(() => {
        playGreeting();
      }, 1000);
    }
  }, [isInitialized, microphoneState, connectionStatus, requiresUserActionToInitialize, hasGreeted]);

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
          
          {isProcessing && (
            <div className="text-center mt-4">
              <div className="text-blue-400 text-sm">
                {status === VoiceBotStatus.SPEAKING ? "Lexy is speaking..." : "Processing your request..."}
              </div>
            </div>
          )}
          
          {hasGreeted && connectionStatus === 'connected' && !isProcessing && !isListening && (
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
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="text-center mt-4">
              <div className="text-red-400 text-sm mb-2">
                Connection failed
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={handleVoiceBotAction}
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