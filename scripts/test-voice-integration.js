#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Complete Voice Integration Test...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// This matches our agentConfig.ts
const config = {
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

function testVoiceIntegration() {
  return new Promise((resolve) => {
    console.log('🧪 Testing Voice Integration...');
    
    const ws = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", [
      "token",
      DEEPGRAM_API_KEY,
    ]);
    
    let resolved = false;
    let messageCount = 0;
    let settingsApplied = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('⏰ Test timeout after 30 seconds');
        ws.close();
        resolve({ success: false, timeout: true });
      }
    }, 30000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      console.log('📤 Sending configuration...');
      
      try {
        const configString = JSON.stringify(config);
        console.log('📄 Config being sent (first 200 chars):');
        console.log(configString.substring(0, 200) + '...');
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
        console.log(`📨 Message ${messageCount}:`, message.type, message.description || '');
        
        if (message.type === 'SettingsApplied') {
          console.log('🎉 Settings applied successfully!');
          settingsApplied = true;
          
          // Send a test text message to trigger speech
          console.log('💬 Sending test text input...');
          setTimeout(() => {
            ws.send('Hello Lexy, can you introduce yourself?');
          }, 1000);
          
        } else if (message.type === 'Error') {
          console.log('❌ Error from Deepgram:', message.description);
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            resolve({ success: false, error: message.description });
          }
        } else if (message.role === 'assistant') {
          console.log('🤖 Assistant response:', message.content);
          console.log('✅ Voice agent is working! AI responded successfully.');
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            resolve({ success: true, aiResponse: message.content });
          }
        }
      } catch (err) {
        if (data instanceof Buffer) {
          console.log('🔊 Received audio data:', data.length, 'bytes');
          if (settingsApplied) {
            console.log('✅ Voice synthesis is working! Received audio response.');
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              ws.close();
              resolve({ success: true, audioReceived: true });
            }
          }
        } else {
          console.log('📨 Non-JSON message:', data.toString().substring(0, 100));
        }
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
        resolve({ success: settingsApplied });
      }
    });
  });
}

async function runTest() {
  console.log('Environment check:');
  console.log('- DEEPGRAM_API_KEY:', DEEPGRAM_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  const result = await testVoiceIntegration();
  
  if (result.success) {
    console.log('\n🎉 Voice integration test PASSED!');
    if (result.aiResponse) {
      console.log('✅ AI Response received:', result.aiResponse);
    }
    if (result.audioReceived) {
      console.log('✅ Audio synthesis working');
    }
    console.log('\nThe voice agent configuration is working correctly.');
  } else {
    console.log('\n❌ Voice integration test FAILED');
    if (result.error) {
      console.log('Error:', result.error);
    }
    if (result.timeout) {
      console.log('Test timed out - agent might be working but slow');
    }
    console.log('\nThere is an issue with the voice agent configuration.');
  }
}

runTest();