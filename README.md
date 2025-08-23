# Apex Scale AI - Intelligent Voice & Text Assistant

A modern, integrated AI assistant platform that combines the power of Deepgram's voice technology with Google's Gemini AI to create "Lexy" - an intelligent assistant for Apex Scale AI.

## 🚀 Features

- **Unified Voice & Text Interface**: Seamlessly switch between voice and text conversations
- **Real-time Voice Processing**: Powered by Deepgram's Agent Converse API
- **Intelligent Responses**: Google Gemini 2.5 Flash for contextual, business-aware conversations
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS
- **Supabase Integration**: Optional chat persistence and knowledge base
- **Responsive Design**: Works beautifully on desktop and mobile
- **Lexy Personality**: Custom-trained AI assistant specifically for Apex Scale AI

## 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Voice Processing**: Deepgram Agent Converse API
- **AI/LLM**: Google Gemini 2.5 Flash
- **Database**: Supabase (optional)
- **Audio Processing**: Web Audio API
- **State Management**: React Context + useReducer

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Deepgram API key (with Agent Converse access)
- Google Gemini API key
- Supabase project (optional, for persistence)

## 🔧 Installation

1. **Clone and install dependencies:**
   ```bash
   cd apexaibot
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys:
   ```env
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=your_supabase_project_url_here (optional)
   SUPABASE_ANON_KEY=your_supabase_anon_key_here (optional)
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🎯 Usage

### Voice Interaction
1. Click "Try Lexy" to open the assistant interface
2. Click the animated orb to start voice interaction
3. Speak naturally - Lexy will respond with both voice and text
4. The orb changes color based on status:
   - **Green**: Listening
   - **Blue**: Speaking  
   - **Yellow**: Thinking
   - **Gray**: Sleeping

### Text Chat
1. Use the text input in the right panel
2. Type your message and press Enter
3. Chat history is synchronized with voice conversations

### Features to Try
- Ask about Apex Scale AI services and pricing
- Request a consultation or demo
- Inquire about ROI and implementation timelines
- Get technical details about AI automation

## 🏗 Project Structure

```
apexaibot/
├── app/
│   ├── api/
│   │   ├── authenticate/     # Deepgram token endpoint
│   │   └── chat/            # Gemini chat endpoint
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Process.tsx
│   │   ├── VoiceAssistant.tsx
│   │   ├── Orb.tsx
│   │   ├── ChatWidget.tsx
│   │   └── PromptSuggestions.tsx
│   ├── context/             # React context providers
│   │   ├── DeepgramContextProvider.tsx
│   │   ├── MicrophoneContextProvider.tsx
│   │   └── VoiceBotContextProvider.tsx
│   ├── lib/                 # Utilities and configuration
│   │   ├── constants.ts     # Lexy prompt and configuration
│   │   └── supabase.ts      # Supabase integration
│   ├── utils/               # Helper functions
│   │   ├── audioUtils.ts    # Audio processing
│   │   └── deepgramUtils.ts # Deepgram utilities
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page component
├── public/                  # Static assets
└── README.md
```

## 🔮 Lexy's Capabilities

Lexy is specifically trained to:

- **Explain Apex Scale AI Services**: Lead Capture Bot, Intelligent Sales & Support Agent, Custom Automation
- **Provide Pricing Information**: Transparent pricing for all service tiers
- **Qualify Leads**: Ask relevant questions to understand business needs
- **Schedule Consultations**: Direct users to booking and contact information
- **Technical Education**: Explain AI automation benefits and implementation
- **ROI Discussion**: Discuss expected returns and success metrics

## 📊 Service Packages

### 1. Lead Capture Bot
- **Price**: $950 setup + $50/month
- **Features**: Visitor info capture, 10 FAQs, basic qualification
- **Ideal for**: Small businesses starting automation

### 2. Intelligent Sales & Support Agent  
- **Price**: $2,500 setup + $150/month
- **Features**: 50 FAQs, document training, calendar booking, advanced qualification
- **Ideal for**: Growing businesses scaling interactions

### 3. Custom AI Workflow Automation
- **Price**: Starting at $5,000+
- **Features**: Full customization, CRM integration, multi-channel automation
- **Ideal for**: Enterprise-level competitive advantage

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Digital Ocean App Platform
- AWS Amplify

## 🔧 Customization

### Branding
Update `app/lib/constants.ts` to customize:
- Company information
- Color scheme  
- Voice options
- Lexy's personality prompt

### Voice Settings
Modify `stsConfig` in `constants.ts` to adjust:
- Voice model (Deepgram voices)
- Audio quality settings
- Language settings

### UI Themes
Update `tailwind.config.ts` and `globals.css` for design changes.

## 🐛 Troubleshooting

### Common Issues

1. **Microphone not working**
   - Ensure HTTPS (required for microphone access)
   - Check browser permissions
   - Try refreshing the page

2. **Voice responses not playing**
   - Check audio output settings
   - Ensure Deepgram API key has proper permissions
   - Verify Agent Converse is enabled

3. **Chat responses failing**
   - Verify Gemini API key
   - Check API quotas and rate limits
   - Review browser console for errors

## 📞 Support

For technical support or business inquiries:
- Website: https://apexscaleai.com
- Email: hello@apexscaleai.com
- Demo: https://aibot.apexscaleai.com

## 📄 License

This project is proprietary software owned by Apex Scale AI.

---

Built with ❤️ by Apex Scale AI - Where Conversation Meets Conversion