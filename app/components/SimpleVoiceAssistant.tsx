"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useMicrophone } from "../context/MicrophoneContextProvider";
import { useVoiceBot, VoiceBotStatus } from "../context/VoiceBotContextProvider";
import { isMobile } from "react-device-detect";
import Orb from "./Orb";

interface SimpleVoiceAssistantProps {
  requiresUserActionToInitialize?: boolean;
  className?: string;
}

export default function SimpleVoiceAssistant({
  requiresUserActionToInitialize = false,
  className = "",
}: SimpleVoiceAssistantProps) {
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
  const [isInitialized, setIsInitialized] = useState(requiresUserActionToInitialize ? false : true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  // STT WebSocket
  const sttSocket = useRef<WebSocket | null>(null);
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
      
      source.onended = () => {
        setTimeout(() => {
          startListening();
          if (!isListening) {
            startSTTConnection();
          }
        }, 500);
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      startListening();
    }
  };

  const startSTTConnection = useCallback(async () => {
    if (sttSocket.current?.readyState === WebSocket.OPEN) {
      console.log("🎤 STT already connected");
      return;
    }

    try {
      setConnectionStatus('connecting');
      const tokenResponse = await fetch('/api/authenticate', { method: 'POST' });
      const { access_token } = await tokenResponse.json();
      
      const ws = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&language=en-US',
        ['token', access_token]
      );

      ws.onopen = () => {
        console.log('🎤 STT WebSocket connected');
        setIsListening(true);
        setConnectionStatus('connected');
        sttSocket.current = ws;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.channel?.alternatives?.[0]) {
          const transcript = data.channel.alternatives[0].transcript;
          if (transcript && !data.is_final) {
            setTranscription(transcript);
          } else if (transcript && data.is_final) {
            console.log("🎯 Final transcript:", transcript);
            handleTranscription(transcript);
            setTranscription("");
          }
        }
      };

      ws.onclose = () => {
        console.log('🎤 STT WebSocket closed');
        setIsListening(false);
        setConnectionStatus('disconnected');
        sttSocket.current = null;
      };

      ws.onerror = (error) => {
        console.error('STT WebSocket error:', error);
        setIsListening(false);
        setConnectionStatus('error');
        sttSocket.current = null;
      };

    } catch (error) {
      console.error('Error starting STT:', error);
      setConnectionStatus('error');
    }
  }, []);

  const handleTranscription = async (transcript: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    addVoicebotMessage({ user: transcript });

    try {
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

      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply })
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        await playAudio(audioBuffer);
      }

    } catch (error) {
      console.error('Error processing transcription:', error);
      startListening();
    } finally {
      setIsProcessing(false);
    }
  };

  // Send audio data to STT when available
  useEffect(() => {
    if (!microphone || !sttSocket.current || sttSocket.current.readyState !== WebSocket.OPEN) return;
    if (status === VoiceBotStatus.SLEEPING || isProcessing) return;
    if (!microphoneAudioContext) return;

    const processor = microphoneAudioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (event) => {
      if (sttSocket.current?.readyState === WebSocket.OPEN && isListening && !isProcessing) {
        const inputData = event.inputBuffer.getChannelData(0);
        
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        sttSocket.current.send(pcmData.buffer);
      }
    };

    microphone.connect(processor);
    processor.connect(microphoneAudioContext.destination);

    return () => {
      microphone.disconnect(processor);
      processor.disconnect();
    };
  }, [microphone, sttSocket.current?.readyState, status, microphoneAudioContext, isListening, isProcessing]);

  const handleVoiceBotAction = () => {
    if (requiresUserActionToInitialize && !isInitialized) {
      setIsInitialized(true);
      setTimeout(() => startSTTConnection(), 1000);
    } else if (status !== VoiceBotStatus.NONE) {
      toggleSleep();
    } else {
      startSTTConnection();
    }
  };

  // Setup microphone when component mounts
  useEffect(() => {
    if (microphoneState === null) {
      console.log("🎤 Setting up microphone...");
      setupMicrophone();
    }
  }, [microphoneState, setupMicrophone]);

  // Auto-start when initialized and microphone is ready
  useEffect(() => {
    if (isInitialized && microphoneState === 1 && connectionStatus === 'disconnected') {
      console.log("🎤 Starting STT connection...");
      const timer = setTimeout(() => {
        startSTTConnection();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, microphoneState, connectionStatus, startSTTConnection]);

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
          
          {connectionStatus === 'connected' && !isListening && (
            <div className="text-center mt-4">
              <div className="text-green-400 text-sm">
                Connected! {isMobile ? "Tap" : "Click"} the orb to start talking.
              </div>
            </div>
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
          
          {connectionStatus === 'error' && (
            <div className="text-center mt-4">
              <div className="text-red-400 text-sm mb-2">
                Connection failed
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => startSTTConnection()}
              >
                Retry
              </button>
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