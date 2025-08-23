#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Agent Converse Configuration...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Test different configuration formats
const configurations = [
  {
    name: "OpenAI Think Provider",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "open_ai", model: "gpt-4o-mini" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Alternative Think Provider Format",
    config: {
      type: "Settings", 
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "openai", model: "gpt-4o-mini" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Minimal Configuration",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000 }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: { provider: { type: "open_ai", model: "gpt-4o-mini" } },
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
    }, 10000);
    
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

async function runTests() {
  console.log('Testing different Agent Converse configurations...\n');
  
  let workingConfig = null;
  
  for (const config of configurations) {
    const result = await testConfiguration(config);
    
    if (result.success) {
      console.log(`✅ ${config.name} works!`);
      workingConfig = config;
      break;
    } else {
      console.log(`❌ ${config.name} failed`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (workingConfig) {
    console.log('\n🎉 Found working configuration:');
    console.log(JSON.stringify(workingConfig.config, null, 2));
    console.log('\n💡 Use this configuration in your constants.ts file');
  } else {
    console.log('\n❌ No working configuration found');
    console.log('💡 You might need to:');
    console.log('1. Check if you have OpenAI API access with Agent Converse');
    console.log('2. Try different provider types');
    console.log('3. Contact Deepgram support for configuration help');
  }
}

runTests();