import { GoogleGenerativeAI } from "@google/generative-ai";
import { LEXY_PROMPT } from "./constants";

export interface VoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class GeminiVoiceAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private conversationHistory: VoiceMessage[] = [];

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async processUserInput(userText: string): Promise<string> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userText,
        timestamp: new Date()
      });

      // Keep only last 10 exchanges to manage context
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      // Build conversation context
      const conversationContext = this.conversationHistory
        .slice(-10) // Last 5 exchanges
        .map(msg => `${msg.role === 'user' ? 'User' : 'Lexy'}: ${msg.content}`)
        .join('\n');

      // Create the prompt with context
      const prompt = `${LEXY_PROMPT}

IMPORTANT: You are in a VOICE conversation. Keep responses:
- Under 100 words
- Conversational and natural for speech
- Clear and easy to understand when spoken aloud
- Avoid complex formatting, lists, or symbols

Recent conversation:
${conversationContext}

User: ${userText}

Lexy:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: text,
        timestamp: new Date()
      });

      return text;
    } catch (error) {
      console.error('Error processing with Gemini:', error);
      return "I apologize, I'm having trouble processing that right now. Could you please try again?";
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): VoiceMessage[] {
    return [...this.conversationHistory];
  }
}