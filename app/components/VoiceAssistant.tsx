"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useDeepgram } from "../context/DeepgramContextProvider";
import { useMicrophone } from "../context/MicrophoneContextProvider";
import { EventType, useVoiceBot, VoiceBotStatus } from "../context/VoiceBotContextProvider";
import { createAudioBuffer, playAudioBuffer } from "../utils/audioUtils";
import { sendSocketMessage, sendMicToSocket, StsConfig } from "../utils/deepgramUtils";
import { isMobile } from "react-device-detect";
import Orb from "./Orb";

interface VoiceAssistantProps {
  defaultStsConfig: StsConfig;
  requiresUserActionToInitialize?: boolean;
  className?: string;
}

export default function VoiceAssistant({
  defaultStsConfig,
  requiresUserActionToInitialize = false,
  className = "",
}: VoiceAssistantProps) {
  const {
    status,
    addVoicebotMessage,
    addBehindTheScenesEvent,
    isWaitingForUserVoiceAfterSleep,
    toggleSleep,
    startListening,
    startSpeaking,
  } = useVoiceBot();
  
  const {
    setupMicrophone,
    microphone,
    microphoneState,
    processor,
    microphoneAudioContext,
    startMicrophone,
  } = useMicrophone();
  
  const { socket, connectToDeepgram, socketState, rateLimited } = useDeepgram();
  
  const audioContext = useRef<AudioContext | null>(null);
  const agentVoiceAnalyser = useRef<AnalyserNode | null>(null);
  const userVoiceAnalyser = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef(-1);
  const [data, setData] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(requiresUserActionToInitialize ? false : null);
  const scheduledAudioSources = useRef<AudioBufferSourceNode[]>([]);

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

  const bufferAudio = useCallback((data: ArrayBuffer) => {
    if (!audioContext.current || !agentVoiceAnalyser.current) return;
    
    const audioBuffer = createAudioBuffer(audioContext.current, data);
    if (!audioBuffer) return;
    
    scheduledAudioSources.current.push(
      playAudioBuffer(audioContext.current, audioBuffer, startTimeRef, agentVoiceAnalyser.current),
    );
  }, []);

  const clearAudioBuffer = () => {
    scheduledAudioSources.current.forEach((source) => source.stop());
    scheduledAudioSources.current = [];
  };

  // MICROPHONE AND SOCKET MANAGEMENT
  useEffect(() => {
    setupMicrophone();
  }, [setupMicrophone]);

  useEffect(() => {
    let wakeLock: any;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (isInitialized) {
      requestWakeLock();
    }

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [isInitialized]);

  // EXACT COPY FROM WORKING DEMO
  useEffect(() => {
    if (microphoneState === 1 && socket && defaultStsConfig) {
      const onOpen = () => {
        console.log("📤 Sending configuration to Deepgram...");
        sendSocketMessage(socket, defaultStsConfig);
        startMicrophone();
        startListening(true);
      };

      socket.addEventListener("open", onOpen);

      return () => {
        socket.removeEventListener("open", onOpen);
        // Clean up microphone event handlers
      };
    }
  }, [microphone, socket, microphoneState, defaultStsConfig, startMicrophone, startListening]);

  useEffect(() => {
    if (!microphone) return;
    if (!socket) return;
    if (microphoneState !== 2) return;
    if (socketState !== 1) return;
    if (processor) {
      processor.onaudioprocess = sendMicToSocket(socket);
    }
  }, [microphone, socket, microphoneState, socketState, processor]);

  useEffect(() => {
    if (!processor || socket?.readyState !== 1) return;
    if (status === VoiceBotStatus.SLEEPING) {
      processor.onaudioprocess = null;
    } else if (processor) {
      processor.onaudioprocess = sendMicToSocket(socket);
    }
  }, [status, processor, socket]);

  useEffect(() => {
    if (microphoneAudioContext && microphone) {
      userVoiceAnalyser.current = microphoneAudioContext.createAnalyser();
      userVoiceAnalyser.current.fftSize = 2048;
      userVoiceAnalyser.current.smoothingTimeConstant = 0.96;
      microphone.connect(userVoiceAnalyser.current);
    }
  }, [microphoneAudioContext, microphone]);

  const onMessage = useCallback(
    async (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        if (status !== VoiceBotStatus.SLEEPING && !isWaitingForUserVoiceAfterSleep.current) {
          bufferAudio(event.data);
        }
      } else {
        console.log(event?.data);
        setData(event.data);
      }
    },
    [bufferAudio, status, isWaitingForUserVoiceAfterSleep],
  );

  useEffect(() => {
    if (
      microphoneState === 1 &&
      socketState === -1 &&
      (!requiresUserActionToInitialize || (requiresUserActionToInitialize && isInitialized))
    ) {
      connectToDeepgram();
    }
  }, [
    microphone,
    socket,
    microphoneState,
    socketState,
    isInitialized,
    requiresUserActionToInitialize,
    connectToDeepgram,
  ]);

  useEffect(() => {
    if (socket) {
      socket.addEventListener("message", onMessage);
      return () => socket.removeEventListener("message", onMessage);
    }
  }, [socket, onMessage]);

  useEffect(() => {
    if (typeof data === "string") {
      const userRole = (data: any) => {
        const userTranscript = data.content;
        if (status !== VoiceBotStatus.SLEEPING) {
          addVoicebotMessage({ user: userTranscript });
        }
      };

      const assistantRole = (data: any) => {
        if (status !== VoiceBotStatus.SLEEPING && !isWaitingForUserVoiceAfterSleep.current) {
          startSpeaking();
          const assistantTranscript = data.content;
          addVoicebotMessage({ assistant: assistantTranscript });
        }
      };

      try {
        const parsedData = JSON.parse(data);

        if (!parsedData) {
          throw new Error("No data returned in JSON.");
        }

        maybeRecordBehindTheScenesEvent(parsedData);

        if (parsedData.role === "user") {
          startListening();
          userRole(parsedData);
        }

        if (parsedData.role === "assistant") {
          if (status !== VoiceBotStatus.SLEEPING) {
            startSpeaking();
          }
          assistantRole(parsedData);
        }

        if (parsedData.type === EventType.AGENT_AUDIO_DONE) {
          startListening();
        }
        if (parsedData.type === EventType.USER_STARTED_SPEAKING) {
          isWaitingForUserVoiceAfterSleep.current = false;
          startListening();
          clearAudioBuffer();
        }
        if (parsedData.type === EventType.AGENT_STARTED_SPEAKING) {
          const { tts_latency, ttt_latency, total_latency } = parsedData;
          if (!tts_latency || !ttt_latency) return;
          const latencyMessage = { tts_latency, ttt_latency, total_latency };
          addVoicebotMessage(latencyMessage);
        }
      } catch (error) {
        console.error(data, error);
      }
    }
  }, [data, socket, status, addVoicebotMessage, startListening, startSpeaking, isWaitingForUserVoiceAfterSleep]);

  const handleVoiceBotAction = () => {
    if (requiresUserActionToInitialize && !isInitialized) {
      setIsInitialized(true);
    }

    if (status !== VoiceBotStatus.NONE) {
      toggleSleep();
    }
  };

  const maybeRecordBehindTheScenesEvent = (serverMsg: any) => {
    switch (serverMsg.type) {
      case EventType.SETTINGS_APPLIED:
        addBehindTheScenesEvent({
          type: EventType.SETTINGS_APPLIED,
        });
        break;
      case EventType.USER_STARTED_SPEAKING:
        if (status === VoiceBotStatus.SPEAKING) {
          addBehindTheScenesEvent({
            type: "Interruption",
          });
        }
        addBehindTheScenesEvent({
          type: EventType.USER_STARTED_SPEAKING,
        });
        break;
      case EventType.AGENT_STARTED_SPEAKING:
        addBehindTheScenesEvent({
          type: EventType.AGENT_STARTED_SPEAKING,
        });
        break;
      case EventType.CONVERSATION_TEXT: {
        const role = serverMsg.role;
        const content = serverMsg.content;
        addBehindTheScenesEvent({
          type: EventType.CONVERSATION_TEXT,
          role: role,
          content: content,
        });
        break;
      }
      case EventType.END_OF_THOUGHT:
        addBehindTheScenesEvent({
          type: EventType.END_OF_THOUGHT,
        });
        break;
    }
  };

  if (rateLimited) {
    return (
      <div className="text-center p-8">
        <div className="text-red-400 mb-4">Rate Limited</div>
        <div className="text-apex-text">Please try again later.</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Orb
        agentVoiceAnalyser={agentVoiceAnalyser.current}
        userVoiceAnalyser={userVoiceAnalyser.current}
        onOrbClick={handleVoiceBotAction}
        status={status}
        socketState={socketState}
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
          {socketState === -1 && requiresUserActionToInitialize && (
            <button 
              className="text-center w-full mt-4 btn btn-primary" 
              onClick={handleVoiceBotAction}
            >
              <span className="text-xl">Tap to start!</span>
            </button>
          )}
          {socketState === 0 && (
            <div className="text-base text-apex-text text-center w-full mt-4">
              Loading Deepgram...
            </div>
          )}
          {socketState > 0 && status === VoiceBotStatus.SLEEPING && (
            <div className="text-center mt-4">
              <div className="text-apex-text text-sm">
                I&apos;ve stopped listening. {isMobile ? "Tap" : "Click"} the orb to resume.
              </div>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
}