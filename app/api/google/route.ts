import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LEXY_PROMPT } from "../../lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Google API request:", JSON.stringify(body, null, 2));
    
    // Extract message from the request - Deepgram sends different formats
    let message = "";
    if (body.messages && Array.isArray(body.messages)) {
      // OpenAI-style format
      const lastMessage = body.messages[body.messages.length - 1];
      message = lastMessage?.content || lastMessage?.message || "";
    } else if (body.message) {
      message = body.message;
    } else if (body.prompt) {
      message = body.prompt;
    } else if (typeof body === 'string') {
      message = body;
    }

    if (!message) {
      return NextResponse.json(
        { error: "No message found in request" },
        { status: 400 }
      );
    }

    console.log("Processing message:", message);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Create full prompt with Lexy's personality
    const fullPrompt = `${LEXY_PROMPT}

User: ${message}
Lexy:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const reply = response.text();

    if (!reply) {
      throw new Error("Empty response from Gemini");
    }

    console.log("Generated response:", reply);

    // Return in OpenAI-compatible format for Deepgram
    return NextResponse.json({
      choices: [{
        message: {
          role: "assistant",
          content: reply.trim()
        }
      }]
    });

  } catch (error) {
    console.error("Google API error:", error);
    
    return NextResponse.json({
      error: "Failed to generate response",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}