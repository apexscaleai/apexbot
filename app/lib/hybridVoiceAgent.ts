// Hybrid Voice Agent: Deepgram STT + Gemini AI + Deepgram TTS
// Since Deepgram Agent Converse doesn't support Google providers,
// we'll use separate APIs for each component

export interface HybridVoiceConfig {
  stt: {
    provider: "deepgram";
    model: string;
    apiKey: string;
  };
  ai: {
    provider: "gemini";
    model: string;
    apiKey: string;
  };
  tts: {
    provider: "deepgram";
    model: string;
    apiKey: string;
  };
}

export const hybridConfig: HybridVoiceConfig = {
  stt: {
    provider: "deepgram",
    model: "nova-2",
    apiKey: process.env.DEEPGRAM_API_KEY || ""
  },
  ai: {
    provider: "gemini",
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY || ""
  },
  tts: {
    provider: "deepgram",
    model: "aura-asteria-en", 
    apiKey: process.env.DEEPGRAM_API_KEY || ""
  }
};

// This approach will:
// 1. Use Deepgram STT for speech-to-text
// 2. Send transcribed text to our existing Gemini chat API
// 3. Use Deepgram TTS for text-to-speech
// This gives us full control and ensures Gemini 2.5-Flash is used for AI responses