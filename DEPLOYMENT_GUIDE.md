# 🚀 Deployment Guide for Apex Scale AI Voice Agent

This guide covers deploying the Apex Scale AI voice agent to production at `aibot.apexscaleai.com`.

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Setup
Ensure all production environment variables are properly configured:

```bash
# Required API Keys
DEEPGRAM_API_KEY=your_production_deepgram_api_key
GEMINI_API_KEY=your_production_gemini_api_key

# Production URL
NEXT_PUBLIC_APP_URL=https://aibot.apexscaleai.com

# Optional: Supabase (for chat history/analytics)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 2. Build Verification
```bash
npm run build
```
Should complete without errors and show all routes properly compiled.

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)
Vercel provides optimal Next.js hosting with edge functions and global CDN:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Option 2: Netlify
1. Build command: `npm run build`
2. Publish directory: `out` (if using static export) or `.next` (for SSR)
3. Configure environment variables
4. Enable functions for API routes

### Option 3: Custom Server/VPS
For custom deployment on your own infrastructure:

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔧 Configuration Updates for Production

### 1. Domain Configuration
The application automatically detects the domain and adjusts API endpoints accordingly. The Google API endpoint URL will resolve to:
- Local: `http://localhost:3000/api/google`
- Production: `https://aibot.apexscaleai.com/api/google`

### 2. SSL/HTTPS Requirements
- Deepgram Voice Agent requires HTTPS in production
- Microphone access requires secure context (HTTPS)
- WebSocket connections need secure protocols (WSS)

### 3. CORS Configuration
If deploying to a custom domain, ensure CORS is properly configured for:
- Deepgram API calls
- WebSocket connections
- TTS audio streaming

## 🧪 Testing Production Deployment

### 1. Voice Agent Test
1. Visit `https://aibot.apexscaleai.com`
2. Click the chat bubble to open the assistant
3. Test voice interaction by clicking the orb
4. Verify Lexy responds with Apex Scale AI knowledge

### 2. Text Chat Test
1. Use the text chat interface
2. Ask about services: "What are your services and pricing?"
3. Verify detailed responses about Lead Capture Bot, Sales Agent, etc.

### 3. Integration Test
1. Test voice-to-text transcription
2. Verify Gemini AI responses
3. Check text-to-speech audio playback
4. Confirm conversation flow works end-to-end

## 📊 Monitoring & Analytics

### Production Monitoring
- Monitor API response times
- Track Deepgram usage and costs  
- Monitor Gemini API usage
- Set up error tracking (Sentry, LogRocket)

### Performance Optimization
- Enable gzip compression
- Configure CDN for static assets
- Monitor Core Web Vitals
- Optimize images and audio files

## 🔐 Security Considerations

### API Key Security
- Never expose API keys in client-side code
- Use environment variables for all secrets
- Rotate API keys regularly
- Monitor API usage for anomalies

### Rate Limiting
- Implement rate limiting for API endpoints
- Monitor for abuse or excessive usage
- Set up alerts for unusual traffic patterns

## 🚨 Troubleshooting

### Common Issues

#### Voice Agent Not Connecting
- Check HTTPS is enabled
- Verify Deepgram API key is valid
- Ensure microphone permissions are granted

#### AI Responses Not Working
- Verify Gemini API key is active
- Check `/api/google` endpoint is accessible
- Review server logs for API errors

#### Audio Not Playing
- Confirm TTS endpoint is working
- Check browser audio permissions
- Verify audio context is properly initialized

### Debug Endpoints
- Health check: `GET /api/test-config`
- Gemini test: `POST /api/google`
- Deepgram auth: `POST /api/authenticate`

## 📈 Post-Deployment

### 1. DNS Configuration
Point `aibot.apexscaleai.com` to your deployment platform

### 2. SSL Certificate
Ensure valid SSL certificate is configured (automatic with Vercel/Netlify)

### 3. Performance Testing
- Run Lighthouse audits
- Test on mobile devices
- Verify loading speeds globally

### 4. User Feedback
- Monitor user interactions
- Collect feedback on voice quality
- Track conversation completion rates

## 🎯 Success Metrics

The deployment is successful when:
- ✅ Site loads under 3 seconds
- ✅ Voice interaction works on first try
- ✅ AI responses are contextual and accurate
- ✅ Audio quality is clear and natural
- ✅ Mobile experience is optimized
- ✅ Error rate < 1%

---

**🎉 Once deployed, Lexy will be ready to engage prospects and demonstrate the full power of Apex Scale AI's solutions!**