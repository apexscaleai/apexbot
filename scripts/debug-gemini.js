#!/usr/bin/env node

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Debugging Gemini API Issue...\n');

// Check environment variable
console.log('1️⃣ Checking environment variables...');
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log('❌ GEMINI_API_KEY not found in environment');
  console.log('💡 Check your .env.local file');
  process.exit(1);
}

console.log('✅ GEMINI_API_KEY found in environment');
console.log('🔑 API Key preview:', apiKey.slice(0, 10) + '...' + apiKey.slice(-4));
console.log('📏 API Key length:', apiKey.length);

// Check API key format
if (!apiKey.startsWith('AIza')) {
  console.log('⚠️ API key doesn\'t start with "AIza" - this might be wrong');
} else {
  console.log('✅ API key format looks correct');
}

// Test different Gemini models
async function testGeminiAPI() {
  console.log('\n2️⃣ Testing Gemini API directly...');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try different models
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro', 
    'gemini-pro',
    'gemini-2.0-flash-exp'
  ];
  
  for (const modelName of modelsToTest) {
    console.log(`\n🧪 Testing model: ${modelName}`);
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Hello! Say 'API test successful' if you receive this." }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      });
      
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        console.log(`✅ ${modelName} works!`);
        console.log(`📝 Response: "${text.substring(0, 50)}..."`);
        return { model: modelName, working: true };
      } else {
        console.log(`❌ ${modelName} returned empty response`);
      }
    } catch (error) {
      console.log(`❌ ${modelName} failed:`, error.message);
      
      if (error.message.includes('API key not valid')) {
        console.log('🔍 This suggests the API key is invalid');
      } else if (error.message.includes('not found')) {
        console.log('🔍 This model might not be available');
      } else if (error.message.includes('quota')) {
        console.log('🔍 You might have hit rate limits');
      }
    }
  }
  
  return { working: false };
}

// Test API key validation endpoint
async function testAPIKeyValidation() {
  console.log('\n3️⃣ Testing API key validation...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test with Google's model list endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid for Google AI');
      console.log(`📊 Available models: ${data.models?.length || 0}`);
      
      if (data.models && data.models.length > 0) {
        console.log('🎯 Available models:');
        data.models.slice(0, 5).forEach(model => {
          console.log(`   - ${model.name}`);
        });
      }
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ API key validation failed');
      console.log('📄 Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing API key validation:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const validationResult = await testAPIKeyValidation();
  
  if (validationResult) {
    const testResult = await testGeminiAPI();
    
    if (testResult.working) {
      console.log('\n🎉 Success! Gemini API is working');
      console.log(`💡 Use model: ${testResult.model}`);
      
      // Suggest updating the API route
      console.log('\n🔧 Next steps:');
      console.log('1. Update app/api/chat/route.ts to use the working model');
      console.log('2. Test the chat interface again');
    } else {
      console.log('\n❌ No working models found');
    }
  } else {
    console.log('\n❌ API key validation failed');
    console.log('\n🔧 To fix this:');
    console.log('1. Go to https://aistudio.google.com/app/apikey');
    console.log('2. Create a new API key');
    console.log('3. Make sure you have access to Gemini models');
    console.log('4. Update your .env.local file');
  }
}

runTests();