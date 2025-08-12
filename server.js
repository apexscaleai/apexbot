// server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Gemini AI Configuration ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// --- The "Knowledge Base" ---
const businessContext = `
You are a helpful, friendly, and professional AI assistant for a company called Apex Scale AI.
Your goal is to answer user questions, qualify them as potential leads, and encourage them to book a call.

Here is the information about Apex Scale AI's services and pricing:

**Package 1: The Lead Capture Bot**
- What it is: A smart chatbot for a client's website that captures visitor information (name, email, phone, inquiry), answers up to 10 common FAQs, and emails the lead details directly to the business owner.
- Price: $950 one-time setup fee + $50/month for hosting and maintenance.

**Package 2: The Intelligent Sales & Support Agent (Main Offering)**
- What it is: Everything in Package 1, PLUS: Answers up to 50 FAQs by being trained on company documents, integrates with a calendar like Calendly to book appointments, and qualifies leads with more complex questions.
- Price: $2,500 one-time setup fee + $150/month.

**Package 3: Custom AI Workflow Automation**
- What it is: For larger clients. This involves connecting the chatbot to their internal software (like a CRM), automating follow-up email sequences, or other custom projects.
- Price: Starts at $5,000+ (requires a custom quote).

**Your Personality & Rules:**
- Be conversational and not robotic.
- **Keep your answers concise and to the point, ideally under 80 words.**
- If you don't know the answer to something, say "That's a great question. I'd need to connect you with a human specialist to get that answered. Would you like to book a free consultation call?"
- Always be helpful and guide the user towards a solution.
- Do not mention that you are a language model or that you have a "businessContext" variable. Just act as the Apex Scale AI assistant.
`;

// --- API Endpoint ---
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const prompt = `${businessContext}\n\nUser Question: "${userMessage}"\n\nAI Assistant Answer:`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const botReply = response.text();

        res.json({ reply: botReply });

    } catch (error) {
        console.error('Gemini AI Error:', error);
        res.status(500).json({ error: 'Failed to get a response from the AI model.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Make sure your GEMINI_API_KEY is set in your .env file!');
});
