#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Apex Scale AI Assistant...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local from template...');
  const examplePath = path.join(__dirname, '..', '.env.example');
  fs.copyFileSync(examplePath, envPath);
  console.log('✅ .env.local created! Please add your API keys.\n');
} else {
  console.log('✅ .env.local already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Dependencies installed!\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Check environment variables
console.log('🔍 Checking environment configuration...');
require('dotenv').config({ path: envPath });

const requiredEnvVars = [
  'DEEPGRAM_API_KEY',
  'GEMINI_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('⚠️  Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Please add these to your .env.local file before running the app.\n');
} else {
  console.log('✅ All required environment variables are set!\n');
}

// Optional Supabase check
const optionalVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingOptional = optionalVars.filter(varName => !process.env[varName]);

if (missingOptional.length > 0) {
  console.log('ℹ️  Optional Supabase variables not set (chat persistence disabled):');
  missingOptional.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n');
}

console.log('🎉 Setup complete!\n');
console.log('Next steps:');
console.log('1. Add your API keys to .env.local');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:3000');
console.log('\n💡 Need help? Check the README.md for detailed instructions.\n');

console.log('🤖 Ready to meet Lexy, your AI assistant!');