#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Debug Voice Agent Configuration...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// This is the exact config that should work
const debugConfig = {
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

function debugVoiceAgent() {
  return new Promise((resolve) => {
    console.log('🧪 Testing Voice Agent Configuration...');
    
    const ws = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", [
      "token",
      DEEPGRAM_API_KEY,
    ]);
    
    let resolved = false;
    let messageCount = 0;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('⏰ Test timeout after 15 seconds');
        ws.close();
        resolve({ success: false });
      }
    }, 15000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      console.log('📤 Sending configuration...');
      
      try {
        const configString = JSON.stringify(debugConfig);
        console.log('📄 Config being sent:');
        console.log(configString);
        ws.send(configString);
        console.log('✅ Configuration sent successfully');
      } catch (err) {
        console.log('❌ Failed to send config:', err.message);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          ws.close();
          resolve({ success: false, error: err.message });
        }
      }
    });
    
    ws.on('message', (data) => {
      messageCount++;
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Message ${messageCount}:`, message);
        
        if (message.type === 'SettingsApplied') {
          console.log('🎉 Settings applied successfully!');
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            // Keep connection for a bit to see if more messages come
            setTimeout(() => {
              ws.close();
              resolve({ success: true });
            }, 2000);
          }
        } else if (message.type === 'Error') {
          console.log('❌ Error from Deepgram:', message.description);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            resolve({ success: false, error: message.description });
          }
        }
      } catch (err) {
        console.log('📨 Non-JSON message or parsing error:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      }
    });
    
    ws.on('close', (event) => {
      console.log(`🔌 WebSocket closed (Code: ${event.code}, Reason: ${event.reason || 'No reason'})`);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ success: false });
      }
    });
  });
}

async function runDebug() {
  console.log('Environment check:');
  console.log('- DEEPGRAM_API_KEY:', DEEPGRAM_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  const result = await debugVoiceAgent();
  
  if (result.success) {
    console.log('\n🎉 Voice agent configuration is working!');
    console.log('The issue might be in the frontend code, not the configuration.');
  } else {
    console.log('\n❌ Voice agent configuration failed');
    if (result.error) {
      console.log('Error:', result.error);
    }
    console.log('\nThis confirms the issue is with the configuration or API keys.');
  }
}

runDebug();