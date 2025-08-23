"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceBotStatus } from "../context/VoiceBotContextProvider";
import { normalizeVolume } from "../utils/audioUtils";

interface OrbProps {
  agentVoiceAnalyser: AnalyserNode | null;
  userVoiceAnalyser: AnalyserNode | null;
  onOrbClick: () => void;
  status: VoiceBotStatus;
  socketState: number;
  isInitialized: boolean | null;
  requiresUserActionToInitialize: boolean;
}

export default function Orb({
  agentVoiceAnalyser,
  userVoiceAnalyser,
  onOrbClick,
  status,
  socketState,
  isInitialized,
  requiresUserActionToInitialize,
}: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [orbScale, setOrbScale] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = 60;

    let agentDataArray: Uint8Array | null = null;
    let userDataArray: Uint8Array | null = null;

    if (agentVoiceAnalyser) {
      agentDataArray = new Uint8Array(agentVoiceAnalyser.frequencyBinCount);
    }
    if (userVoiceAnalyser) {
      userDataArray = new Uint8Array(userVoiceAnalyser.frequencyBinCount);
    }

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      let agentVolume = 0;
      let userVolume = 0;

      // Get audio data
      if (agentVoiceAnalyser && agentDataArray) {
        agentVolume = normalizeVolume(agentVoiceAnalyser, agentDataArray, 255);
      }
      if (userVoiceAnalyser && userDataArray) {
        userVolume = normalizeVolume(userVoiceAnalyser, userDataArray, 255);
      }

      // Calculate dynamic radius based on audio
      const volumeMultiplier = Math.max(agentVolume, userVolume);
      const dynamicRadius = baseRadius + (volumeMultiplier * 20);

      // Determine orb color based on status
      let gradient;
      switch (status) {
        case VoiceBotStatus.LISTENING:
          gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
          gradient.addColorStop(0, `rgba(34, 197, 94, ${0.8 + volumeMultiplier * 0.2})`);
          gradient.addColorStop(1, `rgba(34, 197, 94, ${0.2 + volumeMultiplier * 0.1})`);
          break;
        case VoiceBotStatus.SPEAKING:
          gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
          gradient.addColorStop(0, `rgba(59, 130, 246, ${0.8 + volumeMultiplier * 0.2})`);
          gradient.addColorStop(1, `rgba(59, 130, 246, ${0.2 + volumeMultiplier * 0.1})`);
          break;
        case VoiceBotStatus.THINKING:
          gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
          gradient.addColorStop(0, `rgba(234, 179, 8, ${0.8 + Math.sin(Date.now() * 0.01) * 0.2})`);
          gradient.addColorStop(1, `rgba(234, 179, 8, ${0.2 + Math.sin(Date.now() * 0.01) * 0.1})`);
          break;
        case VoiceBotStatus.SLEEPING:
          gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
          gradient.addColorStop(0, "rgba(156, 163, 175, 0.6)");
          gradient.addColorStop(1, "rgba(156, 163, 175, 0.2)");
          break;
        default:
          gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dynamicRadius);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0.2)");
      }

      // Draw the main orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius * orbScale, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add outer glow ring
      if (status === VoiceBotStatus.LISTENING || status === VoiceBotStatus.SPEAKING) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (dynamicRadius + 10) * orbScale, 0, 2 * Math.PI);
        ctx.strokeStyle = status === VoiceBotStatus.LISTENING 
          ? `rgba(34, 197, 94, ${0.3 + volumeMultiplier * 0.2})` 
          : `rgba(59, 130, 246, ${0.3 + volumeMultiplier * 0.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [agentVoiceAnalyser, userVoiceAnalyser, status, orbScale]);

  const handleClick = () => {
    // Add click animation
    setOrbScale(0.95);
    setTimeout(() => setOrbScale(1), 150);
    onOrbClick();
  };

  const getStatusText = () => {
    if (socketState === -1 && requiresUserActionToInitialize && !isInitialized) {
      return "Tap to start";
    }
    if (socketState === 0) {
      return "Connecting...";
    }
    switch (status) {
      case VoiceBotStatus.LISTENING:
        return "Listening...";
      case VoiceBotStatus.SPEAKING:
        return "Speaking...";
      case VoiceBotStatus.THINKING:
        return "Thinking...";
      case VoiceBotStatus.SLEEPING:
        return "Sleeping - tap to wake";
      default:
        return "Ready";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case VoiceBotStatus.LISTENING:
        return "text-green-400";
      case VoiceBotStatus.SPEAKING:
        return "text-primary-400";
      case VoiceBotStatus.THINKING:
        return "text-yellow-400";
      case VoiceBotStatus.SLEEPING:
        return "text-gray-400";
      default:
        return "text-primary-400";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 touch-target"
        onClick={handleClick}
        style={{ 
          minHeight: '48px', 
          minWidth: '48px',
          padding: '8px',
          borderRadius: '50%'
        }}
        role="button"
        aria-label={getStatusText()}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <canvas 
          ref={canvasRef}
          className="w-40 h-40 sm:w-48 sm:h-48 pointer-events-none"
          style={{ filter: "blur(0.5px)" }}
        />
        
        {/* Microphone icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg 
            className={`w-6 h-6 sm:w-8 sm:h-8 ${getStatusColor()} transition-colors duration-300`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
        </div>
      </div>
      
      <div className={`mt-4 text-sm sm:text-base font-medium ${getStatusColor()} transition-colors duration-300`}>
        {getStatusText()}
      </div>
      
      <div className="mt-2 text-xs sm:text-sm text-apex-text text-center max-w-xs px-4">
        {status === VoiceBotStatus.SLEEPING ? (
          "Tap the orb to wake me up and start our conversation"
        ) : socketState === 1 ? (
          "Speak naturally or tap the orb to pause"
        ) : (
          "Initializing voice connection..."
        )}
      </div>
    </div>
  );
}