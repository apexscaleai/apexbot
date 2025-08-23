#!/usr/bin/env node

const https = require('http');

console.log('🧪 Testing Apex Scale AI Local Setup...\n');

// Test 1: Server is running
function testServer() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Testing server connection...');
    
    const req = https.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running on http://localhost:3000');
        resolve(true);
      } else {
        console.log(`❌ Server returned status: ${res.statusCode}`);
        reject(false);
      }
    });

    req.on('error', (err) => {
      console.log('❌ Server is not running or not accessible');
      console.log('💡 Make sure you ran: npm run dev');
      reject(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Server timeout - may be starting up');
      reject(false);
    });
  });
}

// Test 2: Chat API
function testChatAPI() {
  return new Promise((resolve, reject) => {
    console.log('\n2️⃣ Testing chat API...');
    
    const postData = JSON.stringify({
      message: 'Hello, what services do you offer?',
      sessionId: 'test-session'
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

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.reply) {
            console.log('✅ Chat API is working');
            console.log(`📝 Sample response: "${response.reply.substring(0, 100)}..."`);
            resolve(true);
          } else if (response.error) {
            console.log('⚠️ Chat API returned error - check your GEMINI_API_KEY');
            console.log(`Error: ${response.error}`);
            resolve(false);
          } else {
            console.log('❌ Chat API returned unexpected response');
            console.log(data);
            reject(false);
          }
        } catch (err) {
          console.log('❌ Chat API returned invalid JSON');
          console.log(data);
          reject(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Failed to connect to chat API');
      console.log(err.message);
      reject(false);
    });

    req.setTimeout(10000, () => {
      console.log('❌ Chat API timeout - may be slow or failing');
      reject(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Environment check
function testEnvironment() {
  console.log('\n3️⃣ Checking environment variables...');
  
  require('dotenv').config({ path: '.env.local' });
  
  const requiredVars = ['DEEPGRAM_API_KEY', 'GEMINI_API_KEY'];
  let allGood = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName] && process.env[varName] !== `your_${varName.toLowerCase()}_here`) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing or not configured`);
      allGood = false;
    }
  });
  
  // Optional variables
  const optionalVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  optionalVars.forEach(varName => {
    if (process.env[varName] && process.env[varName] !== `your_${varName.toLowerCase().replace(/_/g, '_')}_here`) {
      console.log(`ℹ️ ${varName} is set (optional)`);
    } else {
      console.log(`⚪ ${varName} not set (optional for testing)`);
    }
  });
  
  return allGood;
}

// Run all tests
async function runTests() {
  try {
    const envGood = testEnvironment();
    
    if (!envGood) {
      console.log('\n❌ Environment setup incomplete. Please check your .env.local file.');
      return;
    }
    
    await testServer();
    await testChatAPI();
    
    console.log('\n🎉 All tests passed! Your setup is ready.');
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Click "Try Lexy" to test the interface');
    console.log('3. Test both text chat and voice assistant');
    console.log('4. If everything works, you\'re ready to deploy!');
    
  } catch (error) {
    console.log('\n❌ Some tests failed. Please check the issues above.');
    console.log('\n🆘 Common solutions:');
    console.log('- Make sure npm run dev is running');
    console.log('- Check your API keys in .env.local');
    console.log('- Try refreshing your browser');
  }
}

runTests();