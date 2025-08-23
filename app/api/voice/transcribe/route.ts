import { NextRequest, NextResponse } from 'next/server';
import { GeminiVoiceAgent } from '../../../lib/geminiVoiceAgent';

// Initialize Gemini voice agent
const voiceAgent = new GeminiVoiceAgent();

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    // Process with Gemini
    const response = await voiceAgent.processUserInput(text);

    return NextResponse.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice input' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    voiceAgent.clearHistory();
    return NextResponse.json({ success: true, message: 'Conversation history cleared' });
  } catch (error) {
    console.error('Error clearing history:', error);
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }
}