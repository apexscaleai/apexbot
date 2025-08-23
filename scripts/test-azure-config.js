#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Azure OpenAI with Agent Converse...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Test Azure OpenAI configuration
const azureConfigs = [
  {
    name: "Azure OpenAI Provider",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "azure_openai", model: "gpt-4o-mini" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Azure OpenAI Alternative Format",
    config: {
      type: "Settings",
      audio: {
        input: { encoding: "linear16", sample_rate: 16000 },
        output: { encoding: "linear16", sample_rate: 24000, container: "none" }
      },
      agent: {
        listen: { provider: { type: "deepgram", model: "nova-2" } },
        think: {
          provider: { type: "azure-openai", model: "gpt-4o-mini" },
          prompt: "You are Lexy, a helpful AI assistant for Apex Scale AI. Keep responses brief."
        },
        speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
      }
    }
  },
  {
    name: "Regular OpenAI (fallback)",
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
  console.log('Testing Azure OpenAI configurations with Agent Converse...\n');
  
  let workingConfig = null;
  
  for (const config of azureConfigs) {
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
    console.log('\n🎉 Found working Azure configuration!');
    console.log(JSON.stringify(workingConfig.config, null, 2));
    console.log('\n📋 Environment variables you\'ll need:');
    
    if (workingConfig.config.agent.think.provider.type.includes('azure')) {
      console.log('- AZURE_OPENAI_API_KEY=your_azure_openai_api_key');
      console.log('- AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/');
      console.log('- AZURE_OPENAI_DEPLOYMENT_ID=your_deployment_id');
    } else {
      console.log('- OPENAI_API_KEY=your_openai_api_key');
    }
  } else {
    console.log('\n❌ No working configuration found');
    console.log('💡 Supported provider types might be limited');
    console.log('   Try setting up regular OpenAI or Azure OpenAI first');
  }
}

runTests();