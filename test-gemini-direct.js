// Test script to check Gemini API directly
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = "AIzaSyBRpWdxJGndR9lCCx536vmY3K3upd--sC0";

async function testGemini() {
  try {
    console.log('🔌 Testing Gemini API directly...');
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Test with the actual prompt format used in Deepgram Agent Converse
    const LEXY_PROMPT = `You are Lexy, the intelligent AI assistant for Apex Scale AI. You help businesses understand our AI automation solutions. Keep responses conversational and under 100 words. Our services: Lead Capture Bot ($950+$50/mo), Intelligent Sales Agent ($2500+$150/mo), Custom Automation ($5000+). Always be helpful and guide users toward solutions that fit their needs.`;

    const prompt = `${LEXY_PROMPT}

User: Hello! What is your name?
Lexy:`;
    
    console.log('📤 Sending prompt to Gemini:', prompt);
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    const reply = response.text();
    
    console.log('✅ Gemini Response:', reply);
    console.log('📊 Response length:', reply.length);
    console.log('🔍 Response type:', typeof reply);
    
    // Check for problematic characters
    const problematicChars = reply.match(/[\x00-\x1f\x7f-\x9f]/g);
    if (problematicChars) {
      console.log('⚠️ Found problematic characters:', problematicChars);
    }
    
  } catch (error) {
    console.error('❌ Gemini API error:', error);
  }
}

testGemini();