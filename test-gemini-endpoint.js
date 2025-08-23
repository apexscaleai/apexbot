// Test what exact format Deepgram expects for Google API
const fetch = require('node-fetch');

async function testGoogleEndpoint() {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBRpWdxJGndR9lCCx536vmY3K3upd--sC0";
  
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: "Hello, what is your name?" }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 100
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.candidates && result.candidates[0]) {
      console.log('Generated text:', result.candidates[0].content.parts[0].text);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testGoogleEndpoint();