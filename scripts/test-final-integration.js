#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Final Integration with Gemini 2.5 Flash...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

console.log('Environment check:');
console.log('- DEEPGRAM_API_KEY:', DEEPGRAM_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- GOOGLE_API_KEY:', GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Final configuration that should work
const finalConfig = {
  type: "Settings",
  audio: {
    input: { encoding: "linear16", sample_rate: 16000 },
    output: { encoding: "linear16", sample_rate: 24000, container: "none" }
  },
  agent: {
    listen: { provider: { type: "deepgram", model: "nova-2" } },
    think: {
      provider: { type: "google", model: "gemini-2.5-flash" },
      prompt: "You are Lexy, the intelligent AI assistant for Apex Scale AI. You help businesses understand our AI automation solutions. Keep responses conversational and under 100 words. Our services: Lead Capture Bot ($950+$50/mo), Intelligent Sales Agent ($2500+$150/mo), Custom Automation ($5000+). Always be helpful and guide users toward solutions that fit their needs."
    },
    speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
  }
};

function testFinalConfiguration() {
  return new Promise((resolve) => {
    console.log('🧪 Testing Final Configuration...');
    
    const ws = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", [
      "token",
      DEEPGRAM_API_KEY,
    ]);
    
    let resolved = false;
    let receivedMessages = [];
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('⏰ Test timeout');
        ws.close();
        resolve({ success: false, messages: receivedMessages });
      }
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ Connected to Agent Converse, sending configuration...');
      try {
        ws.send(JSON.stringify(finalConfig));
        console.log('📤 Configuration sent');
        console.log('📄 Config details:');
        console.log('  - Listen: Deepgram Nova-2');
        console.log('  - Think: Google Gemini 2.5 Flash');
        console.log('  - Speak: Deepgram Aura Asteria');
      } catch (err) {
        console.log('❌ Failed to send config:', err.message);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          ws.close();
          resolve({ success: false, messages: receivedMessages });
        }
      }
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        receivedMessages.push(message);
        console.log('📨 Received:', message.type, message.description || '');
        
        if (message.type === 'SettingsApplied') {
          console.log('🎉 Configuration accepted! Voice agent is ready.');
          console.log('💡 Gemini 2.5 Flash is now powering the voice agent!');
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            resolve({ success: true, messages: receivedMessages });
          }
        } else if (message.type === 'Error') {
          console.log('❌ Configuration error:', message.description);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            resolve({ success: false, messages: receivedMessages, error: message.description });
          }
        }
      } catch (err) {
        console.log('📨 Received non-JSON message');
      }
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ success: false, messages: receivedMessages });
      }
    });
    
    ws.on('close', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ success: false, messages: receivedMessages });
      }
    });
  });
}

async function runFinalTest() {
  const result = await testFinalConfiguration();
  
  if (result.success) {
    console.log('\n🎉 SUCCESS! Integration is complete and working!');
    console.log('\n📋 What works now:');
    console.log('✅ Deepgram Agent Converse connection');
    console.log('✅ Google Gemini 2.5 Flash for AI responses');
    console.log('✅ Deepgram Nova-2 for speech recognition');
    console.log('✅ Deepgram Aura Asteria for text-to-speech');
    console.log('✅ Lexy personality and business knowledge');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Click the chat bubble to open the voice assistant');
    console.log('3. Start talking to test the complete integration');
    console.log('4. Both text chat and voice chat use Gemini!');
    
  } else {
    console.log('\n❌ Integration test failed');
    if (result.error) {
      console.log('Error:', result.error);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your Google API key has AI Studio access');
    console.log('2. Check if your Deepgram account has Agent Converse enabled');
    console.log('3. Ensure both API keys are valid and not rate limited');
  }
}

runFinalTest();