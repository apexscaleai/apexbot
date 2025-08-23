"use client";

import { Suspense, useState, useEffect } from "react";
import { useVoiceBot, VoiceBotStatus } from "./context/VoiceBotContextProvider";
import { useMicrophone } from "./context/MicrophoneContextProvider";
import { isMobile } from "react-device-detect";

// Components
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Process from "./components/Process";
import SimpleWorkingVoiceAssistant from "./components/SimpleWorkingVoiceAssistant";
import { useState as useReactState } from "react";
import ChatWidget from "./components/ChatWidget";
import PromptSuggestions from "./components/PromptSuggestions";

export default function Home() {
  const { messages, status } = useVoiceBot();
  const [chatOpen, setChatOpen] = useState(false);
  const [assistantInitialized, setAssistantInitialized] = useState(false);
  const [useTextOnly, setUseTextOnly] = useReactState(false);

  const toggleChat = () => setChatOpen(!chatOpen);

  const initializeAssistant = () => {
    setAssistantInitialized(true);
    setChatOpen(true);
  };

  // Auto-open chat when there are messages (for mobile UX)
  useEffect(() => {
    if (messages.length > 0 && isMobile) {
      setChatOpen(true);
    }
  }, [messages.length]);

  return (
    <>
      {/* Main Landing Page */}
      <div className="min-h-screen bg-apex-dark">
        <Header onChatOpen={initializeAssistant} />
        
        <main>
          <Hero onChatOpen={initializeAssistant} />
          <Features />
          <Process />
        </main>

        {/* Floating Chat Bubble - Only show when chat is closed */}
        {!chatOpen && (
          <button
            onClick={initializeAssistant}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 sm:w-20 sm:h-20 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 flex items-center justify-center group hover:scale-105 active:scale-95 touch-target safe-area-bottom safe-area-right"
            aria-label="Open chat with Lexy"
          >
            <svg 
              className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.014 8.014 0 01-2.84-.508l-5.58 2.14a.507.507 0 01-.638-.642l2.14-5.58A8.012 8.012 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* Voice Assistant & Chat Interface */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          {/* Mobile Layout (< lg) */}
          <div className="lg:hidden h-full flex flex-col">
            {/* Header */}
            <div className="bg-apex-dark border-b border-apex-border p-4 flex items-center justify-between safe-area-top">
              <h3 className="font-semibold text-apex-heading text-lg">Chat with Lexy</h3>
              <button
                onClick={toggleChat}
                className="p-3 hover:bg-gray-800 rounded-lg transition-colors touch-target"
                aria-label="Close chat"
              >
                <svg className="w-6 h-6 text-apex-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mode Toggle - Mobile */}
            <div className="bg-apex-dark px-4 pb-4">
              <div className="flex bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setUseTextOnly(false)}
                  className={`flex-1 py-3 rounded-md text-sm font-medium transition-all touch-target ${
                    !useTextOnly 
                      ? 'bg-primary-500 text-white' 
                      : 'text-gray-400 active:text-white'
                  }`}
                >
                  Voice Chat
                </button>
                <button
                  onClick={() => setUseTextOnly(true)}
                  className={`flex-1 py-3 rounded-md text-sm font-medium transition-all touch-target ${
                    useTextOnly 
                      ? 'bg-primary-500 text-white' 
                      : 'text-gray-400 active:text-white'
                  }`}
                >
                  Text Only
                </button>
              </div>
            </div>

            {/* Voice Assistant Section - Mobile */}
            {!useTextOnly && (
              <div className="bg-gradient-to-br from-apex-dark to-gray-900 px-4 py-6 flex flex-col items-center">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-apex-heading mb-2">
                    Meet Lexy
                  </h2>
                  <p className="text-apex-text text-sm">
                    Your intelligent AI assistant for business automation
                  </p>
                </div>

                <Suspense fallback={<div className="text-apex-text">Loading voice assistant...</div>}>
                  <SimpleWorkingVoiceAssistant
                    requiresUserActionToInitialize={false}
                    className="flex flex-col items-center"
                  />
                </Suspense>

                {/* Quick suggestions when not talking - Mobile */}
                {status !== VoiceBotStatus.SLEEPING && 
                 status !== VoiceBotStatus.NONE && (
                  <div className="mt-6 w-full max-w-sm">
                    <div className="text-center text-sm text-apex-text mb-4">
                      Try saying:
                    </div>
                    <PromptSuggestions />
                  </div>
                )}
              </div>
            )}

            {/* Text Only Mode - Mobile */}
            {useTextOnly && (
              <div className="bg-gradient-to-br from-apex-dark to-gray-900 px-4 py-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.014 8.014 0 01-2.84-.508l-5.58 2.14a.507.507 0 01-.638-.642l2.14-5.58A8.012 8.012 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                  </div>
                  <p className="text-apex-text text-sm">
                    Text-only mode enabled. Use the chat below to talk with Lexy!
                  </p>
                </div>
                <div className="w-full max-w-sm mx-auto">
                  <div className="text-center text-sm text-apex-text mb-4">
                    Try asking:
                  </div>
                  <PromptSuggestions />
                </div>
              </div>
            )}

            {/* Chat Interface - Mobile */}
            <div className="flex-1 bg-apex-dark border-t border-apex-border flex flex-col safe-area-bottom">
              <ChatWidget />
            </div>
          </div>

          {/* Desktop Layout (>= lg) */}
          <div className="hidden lg:flex items-center justify-center p-4 h-full">
            <div className="bg-apex-dark border border-apex-border rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden">
              
              {/* Left Panel - Voice Assistant - Desktop */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-apex-dark to-gray-900">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-apex-heading mb-2">
                    Meet Lexy
                  </h2>
                  <p className="text-apex-text">
                    Your intelligent AI assistant for business automation
                  </p>
                </div>

                {/* Mode Toggle - Desktop */}
                <div className="mb-6">
                  <div className="flex bg-gray-800 p-1 rounded-lg">
                    <button
                      onClick={() => setUseTextOnly(false)}
                      className={`px-4 py-2 rounded-md text-sm transition-all ${
                        !useTextOnly 
                          ? 'bg-primary-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Voice Chat
                    </button>
                    <button
                      onClick={() => setUseTextOnly(true)}
                      className={`px-4 py-2 rounded-md text-sm transition-all ${
                        useTextOnly 
                          ? 'bg-primary-500 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Text Only
                    </button>
                  </div>
                </div>

                {!useTextOnly ? (
                  <>
                    <Suspense fallback={<div className="text-apex-text">Loading voice assistant...</div>}>
                      <SimpleWorkingVoiceAssistant
                        requiresUserActionToInitialize={false}
                        className="flex flex-col items-center"
                      />
                    </Suspense>

                    {/* Quick suggestions when not talking - Desktop */}
                    {status !== VoiceBotStatus.SLEEPING && 
                     status !== VoiceBotStatus.NONE && (
                      <div className="mt-8 max-w-md">
                        <div className="text-center text-sm text-apex-text mb-4">
                          Try saying:
                        </div>
                        <PromptSuggestions />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center max-w-md">
                    <div className="mb-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.014 8.014 0 01-2.84-.508l-5.58 2.14a.507.507 0 01-.638-.642l2.14-5.58A8.012 8.012 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                      </div>
                      <p className="text-apex-text text-sm">
                        Text-only mode enabled. Use the chat panel to talk with Lexy!
                      </p>
                    </div>
                    <div className="mt-6">
                      <div className="text-center text-sm text-apex-text mb-4">
                        Try asking:
                      </div>
                      <PromptSuggestions />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Chat Interface - Desktop */}
              <div className="w-96 border-l border-apex-border flex flex-col">
                <div className="p-4 border-b border-apex-border flex items-center justify-between">
                  <h3 className="font-semibold text-apex-heading">Chat with Lexy</h3>
                  <button
                    onClick={toggleChat}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Close chat"
                  >
                    <svg className="w-5 h-5 text-apex-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <ChatWidget />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}