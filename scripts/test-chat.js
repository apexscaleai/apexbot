#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing Text Chat API...\n');

// Test the chat API endpoint
function testChatAPI() {
  return new Promise((resolve, reject) => {
    console.log('💬 Testing chat API with sample message...');
    
    const postData = JSON.stringify({
      message: 'Hello! What services does Apex Scale AI offer?',
      sessionId: 'test-session-' + Date.now()
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.reply) {
            console.log('✅ Chat API is working!');
            console.log(`📝 Lexy responded: "${response.reply.substring(0, 150)}..."`);
            console.log(`📊 Response length: ${response.reply.length} characters`);
            resolve(true);
          } else {
            console.log('❌ Chat API returned an error:');
            console.log(`Status: ${res.statusCode}`);
            console.log(`Response:`, response);
            resolve(false);
          }
        } catch (err) {
          console.log('❌ Invalid JSON response from chat API');
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Failed to connect to chat API');
      console.log('Error:', err.message);
      console.log('💡 Make sure the dev server is running (npm run dev)');
      resolve(false);
    });

    req.setTimeout(15000, () => {
      console.log('❌ Chat API timeout - Gemini might be slow');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test server availability
function testServer() {
  return new Promise((resolve) => {
    console.log('🌐 Checking if server is running...');
    
    const req = http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running on http://localhost:3000');
        resolve(true);
      } else {
        console.log(`❌ Server returned status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', () => {
      console.log('❌ Server is not running');
      console.log('💡 Run: npm run dev');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Server timeout');
      resolve(false);
    });
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Testing Local Setup...\n');
  
  const serverRunning = await testServer();
  if (!serverRunning) {
    console.log('\n❌ Server is not running. Please run: npm run dev');
    return;
  }
  
  console.log('');
  const chatWorking = await testChatAPI();
  
  console.log('\n📊 Results:');
  console.log(`Server: ${serverRunning ? '✅' : '❌'}`);
  console.log(`Text Chat: ${chatWorking ? '✅' : '❌'}`);
  
  if (serverRunning && chatWorking) {
    console.log('\n🎉 Success! Your text chat is working!');
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Click "Try Lexy" to open the chat interface');
    console.log('3. Test the text chat on the right side');
    console.log('4. Try questions like "What services do you offer?"');
  } else {
    console.log('\n❌ Some issues need to be fixed.');
    if (!chatWorking) {
      console.log('💡 Check your GEMINI_API_KEY in .env.local');
    }
  }
}

runTests();