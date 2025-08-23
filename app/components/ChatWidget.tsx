"use client";

import { useState, useRef, useEffect } from "react";
import { useVoiceBot, isConversationMessage, isUserMessage, isAssistantMessage } from "../context/VoiceBotContextProvider";
import { saveChatMessage } from "../lib/supabase";

export default function ChatWidget() {
  const { messages, addVoicebotMessage } = useVoiceBot();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setInputValue("");
    setIsLoading(true);

    // Add user message to the conversation
    addVoicebotMessage({ user: userMessage });

    // Save to Supabase
    try {
      await saveChatMessage({
        session_id: sessionId.current,
        role: "user",
        message: userMessage,
        metadata: { source: "text_widget" },
      });
    } catch (error) {
      console.warn("Failed to save user message:", error);
    }

    try {
      // Send to Gemini for processing
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId.current,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      if (data.reply) {
        // Add assistant response to the conversation
        addVoicebotMessage({ assistant: data.reply });

        // Save assistant response to Supabase
        try {
          await saveChatMessage({
            session_id: sessionId.current,
            role: "assistant",
            message: data.reply,
            metadata: { 
              source: "text_widget",
              model: "gemini-2.5-flash",
            },
          });
        } catch (error) {
          console.warn("Failed to save assistant message:", error);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addVoicebotMessage({ 
        assistant: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const conversationMessages = messages.filter(isConversationMessage);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationMessages.length === 0 && (
          <div className="text-center text-apex-text py-8">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-primary-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.014 8.014 0 01-2.84-.508l-5.58 2.14a.507.507 0 01-.638-.642l2.14-5.58A8.012 8.012 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-apex-heading mb-2">Start a Conversation</h3>
            <p className="text-sm">
              Ask me about our AI solutions, pricing, or how we can help your business grow.
            </p>
          </div>
        )}

        {conversationMessages.map((message, index) => {
          const isUser = isUserMessage(message);
          const content = isUser ? message.user : isAssistantMessage(message) ? message.assistant : "";

          return (
            <div
              key={index}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl ${
                  isUser
                    ? "bg-primary-500 text-white ml-2 sm:ml-4"
                    : "bg-apex-card text-apex-heading mr-2 sm:mr-4"
                }`}
              >
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {content}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-apex-card text-apex-heading px-4 py-2 rounded-2xl mr-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-apex-border safe-area-bottom">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-apex-card border border-apex-border rounded-lg px-4 py-3 text-apex-heading placeholder-apex-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base min-h-[48px]"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="btn btn-primary px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed touch-target min-h-[48px] min-w-[48px] flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        <div className="mt-2 text-xs text-apex-text lg:block hidden">
          You can also speak directly to the voice assistant on the left.
        </div>
        <div className="mt-2 text-xs text-apex-text lg:hidden">
          Switch to Voice Chat mode above to use voice commands.
        </div>
      </div>
    </div>
  );
}