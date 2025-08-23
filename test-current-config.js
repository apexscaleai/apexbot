#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Current Gemini Configuration...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

const currentConfig = {
  type: "Settings",
  audio: {
    input: { encoding: "linear16", sample_rate: 16000 },
    output: { encoding: "linear16", sample_rate: 24000, container: "none" }
  },
  agent: {
    listen: { provider: { type: "deepgram", model: "nova-2" } },
    think: {
      provider: {
        type: "google",
        temperature: 0.7
      },
      endpoint: {
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBRpWdxJGndR9lCCx536vmY3K3upd--sC0",
        headers: {
          "content-type": "application/json"
        }
      },
      prompt: "You are Lexy, a helpful AI assistant. Keep responses brief."
    },
    speak: { provider: { type: "deepgram", model: "aura-asteria-en" } },
    greeting: "Hi there! I'm Lexy, your AI assistant from Apex Scale AI. I'm here to help you understand how our intelligent automation solutions can transform your business. Whether you're interested in our Lead Capture Bot, Intelligent Sales Agent, or Custom Automation services, I'm ready to assist you. What would you like to know?"
  }
};

function testConfiguration() {
  return new Promise((resolve) => {
    console.log('🧪 Testing current configuration...');
    
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
        resolve({ success: false, messages: receivedMessages, error: "timeout" });
      }
    }, 15000);
    
    ws.on('open', () => {
      console.log('✅ Connected, sending configuration...');
      try {
        ws.send(JSON.stringify(currentConfig));
        console.log('📤 Configuration sent');
      } catch (err) {
        console.log('❌ Failed to send config:', err.message);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          ws.close();
          resolve({ success: false, messages: receivedMessages, error: err.message });
        }
      }
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        receivedMessages.push(message);
        console.log('📨 Received:', message.type, message.description || '');
        
        if (message.type === 'SettingsApplied') {
          console.log('🎉 Configuration accepted! Keeping connection alive for 10 seconds...');
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              ws.close();
              resolve({ success: true, messages: receivedMessages });
            }
          }, 10000);
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
        console.log('📨 Received non-JSON message:', data.toString().substring(0, 100));
      }
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ success: false, messages: receivedMessages, error: error.message });
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log('🔌 WebSocket closed. Code:', code, 'Reason:', reason.toString());
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ success: false, messages: receivedMessages, error: `Closed: ${code} ${reason}` });
      }
    });
  });
}

async function runTest() {
  const result = await testConfiguration();
  
  if (result.success) {
    console.log('\n✅ Configuration works! Connection was stable.');
  } else {
    console.log('\n❌ Configuration failed:', result.error);
    console.log('\nReceived messages:');
    result.messages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg.type}: ${msg.description || 'N/A'}`);
    });
  }
}

runTest();