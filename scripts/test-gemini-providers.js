#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Gemini Providers with Agent Converse...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Test different Gemini provider configurations
const geminiConfigs = [
  {
    name: "Google Gemini Provider",
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
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Gemini Provider Alternative",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "gemini", model: "gemini-1.5-flash" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Google AI Provider",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "google_ai", model: "gemini-1.5-flash" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Google Generative AI",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "google_generative_ai", model: "gemini-1.5-flash" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Vertex AI Provider",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "vertex_ai", model: "gemini-1.5-flash" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
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
            resolve({ success: true, messages: receivedMessages, providerType: config.config.agent.think.provider.type });
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
  console.log('Testing Gemini provider configurations with Agent Converse...\n');
  
  let workingConfigs = [];
  
  for (const config of geminiConfigs) {
    const result = await testConfiguration(config);
    
    if (result.success) {
      console.log(`✅ ${config.name} works! Provider type: ${result.providerType}`);
      workingConfigs.push({ name: config.name, config: config.config, providerType: result.providerType });
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
      console.log(`\n${index + 1}. ${config.name} (${config.providerType})`);
      console.log(JSON.stringify(config.config, null, 2));
    });
    
    console.log('\n📋 Environment variables you\'ll need:');
    console.log('- GEMINI_API_KEY=your_gemini_api_key (already set ✅)');
    console.log('- GOOGLE_API_KEY=your_google_api_key (might be needed)');
    console.log('- Or the API key might be automatically detected from GEMINI_API_KEY');
    
    console.log('\n💡 Recommended: Use the first working configuration');
  } else {
    console.log('\n❌ No Gemini configurations worked');
    console.log('💡 Gemini might not be supported yet, or needs different configuration');
    console.log('🔄 Fallback: We can create a hybrid approach with our existing Gemini API');
  }
}

runTests();