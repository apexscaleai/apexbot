"use client";

import { useVoiceBot, isConversationMessage, isUserMessage, isAssistantMessage } from "../context/VoiceBotContextProvider";

export default function Transcript() {
  const { displayOrder } = useVoiceBot();

  const conversationMessages = displayOrder.filter(isConversationMessage);
  const recentMessages = conversationMessages.slice(-2); // Show only the last 2 messages

  if (recentMessages.length === 0) {
    return (
      <div className="text-center text-apex-text/60 text-sm">
        Start a conversation with Lexy...
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {recentMessages.map((message, index) => {
        const isUser = isUserMessage(message);
        const content = isUser ? message.user : isAssistantMessage(message) ? message.assistant : "";
        
        return (
          <div
            key={index}
            className={`text-sm p-2 rounded-lg max-w-full ${
              isUser 
                ? "bg-primary-500/20 text-primary-100 ml-8" 
                : "bg-apex-card/50 text-apex-text mr-8"
            }`}
          >
            <div className="text-xs opacity-70 mb-1">
              {isUser ? "You" : "Lexy"}
            </div>
            <div className="line-clamp-3">
              {content}
            </div>
          </div>
        );
      })}
    </div>
  );
}