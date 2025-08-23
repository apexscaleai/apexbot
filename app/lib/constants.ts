import { StsConfig } from "../utils/deepgramUtils";

// Lexy's sales-focused conversational prompt optimized for voice interaction
export const LEXY_PROMPT = `You are Lexy from Apex Scale AI. Keep responses conversational, brief (under 3 sentences), and action-oriented. NEVER say your name, introduce yourself, or use repetitive greetings - users already know who you are.

SERVICES:
1. Lead Capture Bot - $950 setup, $50/month (great for small businesses)
2. Intelligent Sales Agent - $2,500 setup, $150/month (perfect for growing companies) 
3. Custom Automation - starts at $5,000 (enterprise solutions)

SALES CONVERSATION FLOW:
1. If they ask about costs/pricing -> Provide pricing, then move to booking
2. If they show interest in integration/setup -> Move directly to scheduling consultation
3. If they mention specific business needs -> Recommend best solution, then offer next steps
4. If they ask "how do I get started" -> Offer to schedule consultation immediately

CLOSING TECHNIQUES:
- "Would you like me to set up a quick consultation to discuss your specific needs?"
- "I can schedule a 15-minute call to walk through the setup process."
- "Let me connect you with our team to get this implemented for your business."
- "The next step would be a brief consultation to customize this for your needs."

STOP asking endless qualifying questions. After 2-3 exchanges, ALWAYS move toward booking/consultation.

Remember: You're a sales assistant. Get them to the next step!`;

export const stsConfig: StsConfig = {
  type: "Settings",
  audio: {
    input: {
      encoding: "linear16",
      sample_rate: 16000,
    },
    output: {
      encoding: "linear16",
      sample_rate: 24000,
      container: "none",
    },
  },
  agent: {
    listen: {
      provider: {
        type: "deepgram",
        model: "nova-2",
      },
    },
    think: {
      provider: {
        type: "google",
        model: "gemini-2.5-flash"
      },
      endpoint: {
        url: typeof window !== 'undefined' 
          ? `${window.location.origin}/api/google`
          : process.env.NEXT_PUBLIC_APP_URL 
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/google`
            : "http://localhost:3000/api/google",
        headers: {
          "Content-Type": "application/json"
        }
      },
      prompt: "You are Lexy, the intelligent AI assistant for Apex Scale AI. You help businesses understand our AI automation solutions. Keep responses conversational and under 100 words. Our services: Lead Capture Bot ($950+$50/mo), Intelligent Sales Agent ($2500+$150/mo), Custom Automation ($5000+). Always be helpful and guide users toward solutions that fit their needs.",
    },
    speak: {
      provider: {
        type: "deepgram",
        model: "aura-asteria-en",
      },
    },
  },
};

export const VOICE_OPTIONS = [
  {
    name: "Asteria",
    value: "aura-asteria-en",
    accent: "American",
    gender: "Female",
    description: "Warm and professional",
  },
  {
    name: "Luna",
    value: "aura-luna-en",
    accent: "American",
    gender: "Female", 
    description: "Friendly and conversational",
  },
  {
    name: "Stella",
    value: "aura-stella-en",
    accent: "American",
    gender: "Female",
    description: "Clear and articulate",
  },
  {
    name: "Athena",
    value: "aura-athena-en",
    accent: "British",
    gender: "Female",
    description: "Sophisticated and elegant",
  },
  {
    name: "Hera",
    value: "aura-hera-en",
    accent: "American",
    gender: "Female",
    description: "Confident and authoritative",
  },
  {
    name: "Orion",
    value: "aura-orion-en",
    accent: "American",
    gender: "Male",
    description: "Professional and trustworthy",
  },
  {
    name: "Arcas",
    value: "aura-arcas-en",
    accent: "American",
    gender: "Male",
    description: "Warm and approachable",
  },
  {
    name: "Perseus",
    value: "aura-perseus-en",
    accent: "American",
    gender: "Male",
    description: "Clear and engaging",
  },
  {
    name: "Angus",
    value: "aura-angus-en",
    accent: "Irish",
    gender: "Male",
    description: "Charming and distinctive",
  },
  {
    name: "Orpheus",
    value: "aura-orpheus-en",
    accent: "American",
    gender: "Male",
    description: "Melodic and expressive",
  },
];

export const APEX_BRAND = {
  name: "Apex Scale AI",
  tagline: "Where Conversation Meets Conversion",
  description: "Intelligent AI solutions that help businesses scale, reduce costs, and grow faster through conversational automation.",
  colors: {
    primary: "#3b82f6",
    secondary: "#1e40af", 
    accent: "#22c55e",
    dark: "#0d0d0d",
    light: "#ffffff",
  },
  contact: {
    website: "https://apexscaleai.com",
    email: "hello@apexscaleai.com",
    demo: "https://aibot.apexscaleai.com",
  },
};