// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
// CORRECTED: Use createClient from the Deepgram SDK
const { createClient } = require('@deepgram/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Configuration ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// CORRECTED: Initialize the Deepgram client with the new method
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const businessContext = `
You are Lexy, a helpful, friendly, and professional AI assistant for a company called Apex Scale AI. Your persona is warm, empathetic, and efficient. Your goal is to answer user questions, qualify them as potential leads, and encourage them to book a call. Keep your answers concise, conversational, and to the point. Speak in short, natural sentences.

Here is the information about Apex Scale AI's services and pricing:

**Package 1: The Lead Capture Bot** - $950 setup + $50/mo. It captures visitor info and answers up to 10 FAQs.

**Package 2: The Intelligent Sales & Support Agent** - $2,500 setup + $150/mo. It adds training on company documents for up to 50 FAQs, calendar booking, and advanced lead qualification.

**Package 3: Custom AI Workflow Automation** - Starts at $5,000+. This is for advanced solutions like CRM integration and automated follow-up sequences.

If you don't know an answer, say "That's a great question. I'd need to connect you with a human specialist to get that answered. Would you like to book a free consultation call?"
`;

// --- WebSocket Connection Handling ---
wss.on('connection', (ws) => {
    console.log('Client connected');
    let deepgramLive;
    let chatHistory = [];

    const processAndRespond = async (text) => {
        chatHistory.push({ role: 'user', parts: [{ text }] });
        
        try {
            const chat = generativeModel.startChat({
                history: [{ role: 'system', parts: [{ text: businessContext }] }, ...chatHistory.slice(0, -1)],
            });
            
            const result = await chat.sendMessage(text);
            const response = await result.response;
            const botReply = response.text();
            
            console.log('Lexy said:', botReply);
            chatHistory.push({ role: 'model', parts: [{ text: botReply }] });

            // Send text response back to client for display
            ws.send(JSON.stringify({ type: 'text', data: botReply }));

            // CORRECTED: Send text to Deepgram for TTS using the new SDK format
            const { stream } = await deepgram.speak.request(
                { text: botReply },
                { model: 'aura-luna-en', encoding: 'mulaw', sample_rate: 8000 }
            );

            stream.on('data', (chunk) => ws.send(chunk));
            stream.on('end', () => ws.send(JSON.stringify({ type: 'tts_complete' })));

        } catch (error) {
            console.error('Gemini AI Error:', error);
            ws.send(JSON.stringify({ type: 'error', data: 'Sorry, I had trouble thinking of a response.' }));
        }
    };

    const setupDeepgram = () => {
        deepgramLive = deepgram.listen.live({
            model: 'nova-2',
            interim_results: false,
            smart_format: true,
            language: 'en-US',
            punctuate: true,
        });

        // CORRECTED: Use the new 'on' method for event listeners
        deepgramLive.on('open', () => console.log('Deepgram STT connection opened.'));
        deepgramLive.on('close', () => console.log('Deepgram STT connection closed.'));
        deepgramLive.on('error', (error) => console.error('Deepgram STT error:', error));
        // CORRECTED: The event name is 'transcript', not 'transcriptReceived'
        deepgramLive.on('transcript', (data) => {
            const transcript = data.channel.alternatives[0].transcript;
            if (transcript) {
                console.log('User said:', transcript);
                processAndRespond(transcript);
            }
        });
    };
    
    setupDeepgram();

    ws.on('message', (message) => {
        // Check if message is text (JSON) or audio (binary)
        if (typeof message === 'string') {
            const msg = JSON.parse(message);
            if (msg.type === 'text') {
                console.log('User typed:', msg.data);
                processAndRespond(msg.data);
            }
        } else if (Buffer.isBuffer(message)) {
            if (deepgramLive && deepgramLive.getReadyState() === 1) {
                deepgramLive.send(message);
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (deepgramLive) {
            deepgramLive.finish();
        }
    });
});

// Serve the frontend files from the 'public' directory
app.use(express.static('public'));

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Make sure your GEMINI_API_KEY and DEEPGRAM_API_KEY are set in your .env file!');
});
