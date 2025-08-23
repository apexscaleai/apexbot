"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
// import { useDeepgram } from "../context/DeepgramContextProvider"; // Not needed for hybrid
import { useMicrophone } from "../context/MicrophoneContextProvider";
import { EventType, useVoiceBot, VoiceBotStatus } from "../context/VoiceBotContextProvider";
import { isMobile } from "react-device-detect";
import Orb from "./Orb";

interface HybridVoiceAssistantProps {
  requiresUserActionToInitialize?: boolean;
  className?: string;
}

export default function HybridVoiceAssistant({
  requiresUserActionToInitialize = false,
  className = "",
}: HybridVoiceAssistantProps) {
  const {
    status,
    addVoicebotMessage,
    addBehindTheScenesEvent,
    toggleSleep,
    startListening,
    startSpeaking,
  } = useVoiceBot();
  
  const {
    setupMicrophone,
    microphone,
    microphoneState,
    microphoneAudioContext,
    startMicrophone,
  } = useMicrophone();
  
  const audioContext = useRef<AudioContext | null>(null);
  const agentVoiceAnalyser = useRef<AnalyserNode | null>(null);
  const userVoiceAnalyser = useRef<AnalyserNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(requiresUserActionToInitialize ? false : null);
  const [isListening, setIsListening] = useState(false);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);

  // STT setup
  const [sttSocket, setSttSocket] = useState<WebSocket | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // AUDIO MANAGEMENT
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

  // Setup microphone
  useEffect(() => {
    setupMicrophone();
  }, [setupMicrophone]);

  // Setup user voice analyzer
  useEffect(() => {
    if (microphoneAudioContext && microphone) {
      userVoiceAnalyser.current = microphoneAudioContext.createAnalyser();
      userVoiceAnalyser.current.fftSize = 2048;
      userVoiceAnalyser.current.smoothingTimeConstant = 0.96;
      microphone.connect(userVoiceAnalyser.current);
    }
  }, [microphoneAudioContext, microphone]);

  // Play greeting when initialized
  useEffect(() => {
    if (isInitialized && !hasPlayedGreeting && audioContext.current) {
      playGreeting();
      setHasPlayedGreeting(true);
    }
  }, [isInitialized, hasPlayedGreeting]);

  const playGreeting = async () => {
    try {
      startSpeaking();
      addVoicebotMessage({ 
        assistant: "Hi there! I'm Lexy, your AI assistant from Apex Scale AI. I'm here to help you understand how our intelligent automation solutions can transform your business. Whether you're interested in our Lead Capture Bot, Intelligent Sales Agent, or Custom Automation services, I'm ready to assist you. What would you like to know?" 
      });

      // Use Deepgram TTS for greeting
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hi there! I'm Lexy, your AI assistant from Apex Scale AI. I'm here to help you understand how our intelligent automation solutions can transform your business. Whether you're interested in our Lead Capture Bot, Intelligent Sales Agent, or Custom Automation services, I'm ready to assist you. What would you like to know?"
        })
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        await playAudio(audioBuffer);
      }
      
      // Start listening after greeting
      setTimeout(() => {
        startListening();
        startSTTConnection();
      }, 1000);
      
    } catch (error) {
      console.error("Error playing greeting:", error);
      startListening();
      startSTTConnection();
    }
  };

  const playAudio = async (audioData: ArrayBuffer) => {
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
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const startSTTConnection = async () => {
    try {
      const tokenResponse = await fetch('/api/authenticate', { method: 'POST' });
      const { access_token } = await tokenResponse.json();
      
      const ws = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&language=en-US',
        ['token', access_token]
      );

      ws.onopen = () => {
        console.log('🎤 STT WebSocket connected');
        setIsListening(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          if (transcript && !data.is_final) {
            // Interim results
            setTranscription(transcript);
          } else if (transcript && data.is_final) {
            // Final transcript
            console.log("🎯 Final transcript:", transcript);
            handleTranscription(transcript);
            setTranscription("");
          }
        }
      };

      ws.onclose = () => {
        console.log('🎤 STT WebSocket closed');
        setIsListening(false);
      };

      ws.onerror = (error) => {
        console.error('STT WebSocket error:', error);
        setIsListening(false);
      };

      setSttSocket(ws);
    } catch (error) {
      console.error('Error starting STT:', error);
    }
  };

  const handleTranscription = async (transcript: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    addVoicebotMessage({ user: transcript });

    try {
      // Send to Gemini chat API
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

      // Convert response to speech
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply })
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        await playAudio(audioBuffer);
      }

      // Resume listening
      setTimeout(() => {
        startListening();
        if (sttSocket?.readyState === WebSocket.OPEN) {
          // Continue with existing connection
        } else {
          startSTTConnection();
        }
      }, 500);

    } catch (error) {
      console.error('Error processing transcription:', error);
      startListening();
    } finally {
      setIsProcessing(false);
    }
  };

  // Send audio data to STT
  useEffect(() => {
    if (!microphone || !sttSocket || sttSocket.readyState !== WebSocket.OPEN) return;
    if (status === VoiceBotStatus.SLEEPING || isProcessing) return;

    // Create audio processor
    const processor = microphoneAudioContext?.createScriptProcessor(4096, 1, 1);
    if (!processor) return;

    processor.onaudioprocess = (event) => {
      if (sttSocket.readyState === WebSocket.OPEN && isListening && !isProcessing) {
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        sttSocket.send(pcmData.buffer);
      }
    };

    microphone.connect(processor);
    processor.connect(microphoneAudioContext!.destination);

    return () => {
      microphone.disconnect(processor);
      processor.disconnect();
    };
  }, [microphone, sttSocket, status, microphoneAudioContext, isListening, isProcessing]);

  const handleVoiceBotAction = () => {
    if (requiresUserActionToInitialize && !isInitialized) {
      setIsInitialized(true);
    } else if (status !== VoiceBotStatus.NONE) {
      toggleSleep();
    }
  };

  return (
    <div className={className}>
      <Orb
        agentVoiceAnalyser={agentVoiceAnalyser.current}
        userVoiceAnalyser={userVoiceAnalyser.current}
        onOrbClick={handleVoiceBotAction}
        status={status}
        socketState={isListening ? 1 : 0}
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
          {isListening && (
            <div className="text-center mt-4">
              <div className="text-apex-text text-sm">
                Listening... {isMobile ? "Tap" : "Click"} the orb to pause.
              </div>
              {transcription && (
                <div className="text-sm text-gray-500 mt-2">
                  "{transcription}"
                </div>
              )}
            </div>
          )}
          {status === VoiceBotStatus.SLEEPING && (
            <div className="text-center mt-4">
              <div className="text-apex-text text-sm">
                I've stopped listening. {isMobile ? "Tap" : "Click"} the orb to resume.
              </div>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
}