const WebSocket = require('ws');
const fetch = require('node-fetch');

async function testDeepgramSTT() {
  console.log('🔍 Testing Deepgram STT API Key...');
  
  try {
    // Test 1: Check API key authentication
    console.log('1️⃣ Testing API key authentication...');
    const authResponse = await fetch('http://localhost:3000/api/authenticate', {
      method: 'POST'
    });
    
    const authData = await authResponse.json();
    console.log('Auth response:', authData);
    
    const token = authData.access_token || authData.key;
    if (!token) {
      throw new Error('No valid token received');
    }
    
    // Test 2: Direct WebSocket connection
    console.log('2️⃣ Testing direct WebSocket connection...');
    const ws = new WebSocket(
      'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&language=en-US',
      ['token', token]
    );
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully!');
      
      // Send a test audio frame
      const testAudio = new ArrayBuffer(1024);
      ws.send(testAudio);
      
      setTimeout(() => {
        console.log('⏰ Closing connection after 3 seconds...');
        ws.close(1000, 'Test complete');
      }, 3000);
    });
    
    ws.on('message', (data) => {
      console.log('📨 Received message:', data.toString());
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed - Code: ${code}, Reason: ${reason}`);
      
      if (code === 1011) {
        console.log('❌ Code 1011 indicates server error - likely API key issue');
        console.log('💡 Possible causes:');
        console.log('   - API key doesn\'t have STT access');
        console.log('   - Usage limits exceeded');
        console.log('   - Invalid API key format');
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDeepgramSTT();