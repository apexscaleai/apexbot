#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Gemini 2.5 Flash with Agent Converse...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Test Gemini 2.5 Flash configurations based on Deepgram demo
const gemini25Configs = [
  {
    name: "Gemini 2.5 Flash - Google Provider",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "google", model: "gemini-2.5-flash" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief and conversational."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Gemini 1.5 Flash - Google Provider",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "google", model: "gemini-1.5-flash" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief and conversational."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Gemini 1.5 Pro - Google Provider",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "google", model: "gemini-1.5-pro" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief and conversational."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Gemini Pro - Google Provider",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "google", model: "gemini-pro" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief and conversational."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  }
];

function testConfiguration(config) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${config.name}`);
    
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
    }, 8000);
    
    ws.on('open', () => {
      console.log('✅ Connected, sending configuration...');
      try {
        ws.send(JSON.stringify(config.config));
        console.log('📤 Configuration sent');
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
          console.log('🎉 Configuration accepted!');
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            resolve({ success: true, messages: receivedMessages, model: config.config.agent.think.provider.model });
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

async function runTests() {
  console.log('Testing Gemini 2.5 Flash configurations with Agent Converse...\n');
  
  let workingConfigs = [];
  
  for (const config of gemini25Configs) {
    const result = await testConfiguration(config);
    
    if (result.success) {
      console.log(`✅ ${config.name} works! Model: ${result.model}`);
      workingConfigs.push({ name: config.name, config: config.config, model: result.model });
    } else {
      console.log(`❌ ${config.name} failed`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (workingConfigs.length > 0) {
    console.log('\n🎉 Found working Gemini configurations!');
    
    workingConfigs.forEach((config, index) => {
      console.log(`\n${index + 1}. ${config.name} (${config.model})`);
      console.log(JSON.stringify(config.config, null, 2));
    });
    
    console.log('\n📋 Environment variables needed:');
    console.log('- DEEPGRAM_API_KEY=your_deepgram_api_key (already set ✅)');
    console.log('- GOOGLE_API_KEY=your_google_api_key (might be needed)');
    console.log('- Or Gemini API key might be automatically detected');
    
    console.log('\n💡 Recommended: Use the first working configuration');
    
    // Test with actual API key
    console.log('\n🔐 Testing if Gemini API key is properly configured...');
    console.log('Your GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'Not set');
    
  } else {
    console.log('\n❌ No Gemini configurations worked');
    console.log('💡 Possible issues:');
    console.log('1. Google API key not properly configured in Deepgram');
    console.log('2. Model names might be different');
    console.log('3. Need to set up Google AI Studio API access');
    console.log('\n🔄 Environment check:');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
  }
}

runTests();