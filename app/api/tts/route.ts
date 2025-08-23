import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Clean up text for better TTS speech
    let cleanedText = text
      // Convert markdown bold/italic to plain text
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Convert numbered lists to spoken format
      .replace(/^\s*(\d+)\.\s+\*\*(.*?)\*\*/gm, '$1. $2')
      .replace(/^\s*\*\s+\*\*(.*?)\*\*/gm, '$1')
      .replace(/^\s*\*\s+/gm, '')
      // Clean up extra whitespace and line breaks
      .replace(/\n\s*\n/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Truncate long text for better conversational flow (max ~400 characters for speech)
    const truncatedText = cleanedText.length > 400 
      ? cleanedText.substring(0, 380) + "... Would you like me to tell you more about any of these options?" 
      : cleanedText;

    // Call Deepgram TTS API
    const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: truncatedText,
      }),
    });

    if (!response.ok) {
      console.error("Deepgram TTS error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "TTS service error" },
        { status: 500 }
      );
    }

    // Return the audio data
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}