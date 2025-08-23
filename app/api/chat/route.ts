import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LEXY_PROMPT } from "../../lib/constants";
import { getChatHistory, searchKnowledgeBase } from "../../lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Temporarily disable database calls until tables are created
    let chatHistory: any[] = [];
    let knowledgeResults: any[] = [];
    
    // Build context from knowledge base
    let contextualInfo = "";
    if (knowledgeResults.length > 0) {
      contextualInfo = "\n\nRelevant company information:\n" + 
        knowledgeResults.map((kb: any) => `- ${kb.title}: ${kb.content}`).join("\n");
    }

    // Build conversation history
    let conversationContext = "";
    if (chatHistory.length > 0) {
      conversationContext = "\n\nRecent conversation:\n" + 
        chatHistory.map((msg: any) => `${msg.role}: ${msg.message}`).join("\n");
    }

    // Create the full prompt
    const fullPrompt = `${LEXY_PROMPT}${contextualInfo}${conversationContext}

User: ${message}
Lexy:`;

    // Generate response with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    const reply = response.text();

    if (!reply) {
      throw new Error("Empty response from Gemini");
    }

    return NextResponse.json({
      reply: reply.trim(),
      sessionId,
    });

  } catch (error) {
    console.error("Chat API error:", error);
    
    // Return a fallback response
    return NextResponse.json({
      reply: "I apologize, but I'm experiencing some technical difficulties right now. However, I'd be happy to help you learn more about Apex Scale AI's solutions! Would you like to know about our Lead Capture Bot, Intelligent Sales & Support Agent, or Custom AI Workflow Automation? Or perhaps you'd like to schedule a free consultation?",
      error: "Technical error occurred",
    });
  }
}