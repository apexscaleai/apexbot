import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 }
      );
    }

    // For demo purposes, we'll return the API key directly
    // In production, you'd want to create a temporary token
    return NextResponse.json({ 
      access_token: DEEPGRAM_API_KEY 
    });

  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}