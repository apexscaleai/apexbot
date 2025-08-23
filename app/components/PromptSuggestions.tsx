"use client";

import { useVoiceBot } from "../context/VoiceBotContextProvider";

export default function PromptSuggestions() {
  const { addVoicebotMessage } = useVoiceBot();

  const suggestions = [
    "What services does Apex Scale AI offer?",
    "How much does the Lead Capture Bot cost?",
    "Tell me about your pricing packages",
    "How can AI help my business grow?",
    "What's included in the custom automation?",
    "Can I schedule a consultation?",
    "How quickly can you set up a chatbot?",
    "What kind of ROI can I expect?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    addVoicebotMessage({ user: suggestion });
    // Note: This would typically trigger the voice assistant to respond
    // In a full implementation, you'd want to integrate this with the voice processing
  };

  return (
    <div className="grid grid-cols-1 gap-3 w-full max-w-md">
      {suggestions.slice(0, 4).map((suggestion, index) => (
        <button
          key={index}
          onClick={() => handleSuggestionClick(suggestion)}
          className="text-left p-4 bg-apex-card/50 hover:bg-apex-card active:bg-apex-card border border-apex-border rounded-lg text-sm sm:text-base text-apex-text hover:text-apex-heading active:text-apex-heading transition-all duration-200 hover:scale-105 active:scale-95 touch-target"
        >
          &ldquo;{suggestion}&rdquo;
        </button>
      ))}
    </div>
  );
}