#!/usr/bin/env node

const WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Deepgram Agent Converse Connection...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.log('❌ DEEPGRAM_API_KEY not found');
  process.exit(1);
}

console.log('🔑 Using API key:', DEEPGRAM_API_KEY.slice(0, 8) + '...');

// Test different WebSocket connection approaches
async function testConnectionApproaches() {
  const approaches = [
    {
      name: "Bearer Protocol",
      url: "wss://agent.deepgram.com/v1/agent/converse",
      protocols: ["bearer", DEEPGRAM_API_KEY]
    },
    {
      name: "Token Protocol", 
      url: "wss://agent.deepgram.com/v1/agent/converse",
      protocols: ["token", DEEPGRAM_API_KEY]
    },
    {
      name: "No Protocol (API Key in URL)",
      url: `wss://agent.deepgram.com/v1/agent/converse?authorization=Token+${DEEPGRAM_API_KEY}`,
      protocols: []
    },
    {
      name: "Authorization Header Simulation",
      url: "wss://agent.deepgram.com/v1/agent/converse",
      protocols: [],
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`
      }
    }
  ];

  for (const approach of approaches) {
    await testApproach(approach);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
  }
}

function testApproach(approach) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${approach.name}`);
    console.log(`📡 URL: ${approach.url}`);
    
    let ws;
    let resolved = false;
    
    try {
      const options = {};
      if (approach.headers) {
        options.headers = approach.headers;
      }
      
      if (approach.protocols.length > 0) {
        ws = new WebSocket(approach.url, approach.protocols, options);
      } else {
        ws = new WebSocket(approach.url, options);
      }
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('⏰ Connection timeout (10s)');
          if (ws) ws.close();
          resolve();
        }
      }, 10000);
      
      ws.on('open', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('✅ Connection successful!');
          console.log('🎯 This approach works for Agent Converse');
          
          // Send a test configuration
          try {
            const testConfig = {
              type: "Settings",
              audio: {
                input: { encoding: "linear16", sample_rate: 16000 },
                output: { encoding: "linear16", sample_rate: 24000 }
              },
              agent: {
                listen: { provider: { type: "deepgram", model: "nova-2" } },
                think: {
                  provider: { type: "openai", model: "gpt-4o-mini" },
                  prompt: "You are a helpful assistant. Keep responses brief."
                },
                speak: { provider: { type: "deepgram", model: "aura-asteria-en" } }
              }
            };
            
            ws.send(JSON.stringify(testConfig));
            console.log('📤 Sent test configuration');
          } catch (err) {
            console.log('⚠️ Failed to send test config:', err.message);
          }
          
          ws.close();
          resolve();
        }
      });
      
      ws.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log('❌ Connection failed');
          console.log('📝 Error details:', error.message || 'Unknown error');
          
          if (error.message.includes('403')) {
            console.log('💡 403 error usually means API key doesn\'t have Agent Converse access');
          } else if (error.message.includes('401')) {
            console.log('💡 401 error means authentication failed');
          } else if (error.message.includes('upgrade')) {
            console.log('💡 Upgrade error might indicate protocol mismatch');
          }
          
          resolve();
        }
      });
      
      ws.on('close', (code, reason) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log(`🔌 Connection closed: ${code} ${reason.toString()}`);
          
          if (code === 1002) {
            console.log('💡 1002 = Protocol error');
          } else if (code === 1003) {
            console.log('💡 1003 = Unsupported data type');
          } else if (code === 1006) {
            console.log('💡 1006 = Abnormal closure (no close frame)');
          }
          
          resolve();
        }
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Received message:', JSON.stringify(message, null, 2));
        } catch {
          console.log('📨 Received binary data or non-JSON message');
        }
      });
      
    } catch (error) {
      if (!resolved) {
        resolved = true;
        console.log('❌ Failed to create WebSocket:', error.message);
        resolve();
      }
    }
  });
}

// Test API access first
async function testAPIAccess() {
  console.log('1️⃣ Testing basic Deepgram API access...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API access works');
      console.log(`📊 Projects: ${data.projects?.length || 0}`);
      return true;
    } else {
      console.log('❌ API access failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API test error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  const apiWorks = await testAPIAccess();
  
  if (!apiWorks) {
    console.log('\n🚫 Basic API access failed. Cannot test Agent Converse.');
    return;
  }
  
  console.log('\n2️⃣ Testing Agent Converse WebSocket connections...');
  await testConnectionApproaches();
  
  console.log('\n📋 Summary:');
  console.log('If none of the approaches worked, it likely means:');
  console.log('1. Agent Converse is not enabled for your API key');
  console.log('2. Your plan doesn\'t include Agent Converse');
  console.log('3. There might be a regional restriction');
  console.log('\n🔧 Next steps:');
  console.log('1. Check your Deepgram dashboard for Agent Converse access');
  console.log('2. Contact Deepgram support if needed');
  console.log('3. Consider using the basic STT/TTS approach as fallback');
}

runTests();