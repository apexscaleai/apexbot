#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Deepgram API Key...\n');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.log('❌ DEEPGRAM_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ API Key found:', DEEPGRAM_API_KEY.slice(0, 8) + '...');

// Test 1: Basic API access
async function testBasicAPI() {
  console.log('\n1️⃣ Testing basic Deepgram API access...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Basic API access works');
      console.log(`📊 Found ${data.projects?.length || 0} projects`);
      return data.projects?.[0]?.project_id;
    } else {
      console.log('❌ Basic API access failed:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing basic API:', error.message);
    return null;
  }
}

// Test 2: Agent Converse permissions
async function testAgentConversePermissions() {
  console.log('\n2️⃣ Testing Agent Converse permissions...');
  
  try {
    const WebSocket = require('ws');
    
    // Try to connect to Agent Converse endpoint
    const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', ['bearer', DEEPGRAM_API_KEY]);
    
    return new Promise((resolve) => {
      let resolved = false;
      
      ws.on('open', () => {
        if (!resolved) {
          resolved = true;
          console.log('✅ Agent Converse WebSocket connection successful!');
          ws.close();
          resolve(true);
        }
      });
      
      ws.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          console.log('❌ Agent Converse WebSocket connection failed');
          console.log('💡 This usually means Agent Converse is not enabled for your API key');
          resolve(false);
        }
      });
      
      ws.on('close', (code, reason) => {
        if (!resolved) {
          resolved = true;
          console.log(`❌ WebSocket closed: ${code} ${reason}`);
          resolve(false);
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('❌ WebSocket connection timeout');
          ws.close();
          resolve(false);
        }
      }, 10000);
    });
  } catch (error) {
    console.log('❌ Error testing Agent Converse:', error.message);
    return false;
  }
}

// Test 3: Create temporary token (alternative approach)
async function testTokenCreation(projectId) {
  if (!projectId) return false;
  
  console.log('\n3️⃣ Testing temporary token creation...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comment: 'Test ephemeral key',
        scopes: ['usage:write', 'listen', 'speak', 'agent:converse'],
        time_to_live_in_seconds: 300
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Temporary token creation works');
      console.log('🔑 Ephemeral key created successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Temporary token creation failed:', response.status);
      console.log('📝 Error:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error creating temporary token:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const projectId = await testBasicAPI();
  const agentConverseWorks = await testAgentConversePermissions();
  const tokenCreationWorks = await testTokenCreation(projectId);
  
  console.log('\n📊 Test Results:');
  console.log(`Basic API: ${projectId ? '✅' : '❌'}`);
  console.log(`Agent Converse: ${agentConverseWorks ? '✅' : '❌'}`);
  console.log(`Token Creation: ${tokenCreationWorks ? '✅' : '❌'}`);
  
  if (agentConverseWorks) {
    console.log('\n🎉 Your Deepgram setup looks good!');
    console.log('The voice assistant should work once we fix the other issues.');
  } else {
    console.log('\n⚠️ Agent Converse is not working');
    console.log('\n🔧 To fix this:');
    console.log('1. Go to https://console.deepgram.com/');
    console.log('2. Make sure your account has Agent Converse enabled');
    console.log('3. Check your plan includes this feature');
    console.log('4. If needed, contact Deepgram support to enable it');
  }
}

runTests();