"use strict";(()=>{var e={};e.id=650,e.ids=[650],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4567:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>f,patchFetch:()=>x,requestAsyncStorage:()=>y,routeModule:()=>m,serverHooks:()=>v,staticGenerationAsyncStorage:()=>g});var o={};s.r(o),s.d(o,{DELETE:()=>h,POST:()=>d});var r=s(9303),n=s(8716),i=s(670),a=s(7070),c=s(1258),u=s(6815);class p{constructor(){this.conversationHistory=[],this.genAI=new c.$D("AIzaSyBRpWdxJGndR9lCCx536vmY3K3upd--sC0"),this.model=this.genAI.getGenerativeModel({model:"gemini-2.5-flash"})}async processUserInput(e){try{this.conversationHistory.push({role:"user",content:e,timestamp:new Date}),this.conversationHistory.length>20&&(this.conversationHistory=this.conversationHistory.slice(-20));let t=this.conversationHistory.slice(-10).map(e=>`${"user"===e.role?"User":"Lexy"}: ${e.content}`).join("\n"),s=`${u.vj}

IMPORTANT: You are in a VOICE conversation. Keep responses:
- Under 100 words
- Conversational and natural for speech
- Clear and easy to understand when spoken aloud
- Avoid complex formatting, lists, or symbols

Recent conversation:
${t}

User: ${e}

Lexy:`,o=(await this.model.generateContent(s)).response.text();return this.conversationHistory.push({role:"assistant",content:o,timestamp:new Date}),o}catch(e){return console.error("Error processing with Gemini:",e),"I apologize, I'm having trouble processing that right now. Could you please try again?"}}clearHistory(){this.conversationHistory=[]}getHistory(){return[...this.conversationHistory]}}let l=new p;async function d(e){try{let{text:t}=await e.json();if(!t||"string"!=typeof t)return a.NextResponse.json({error:"Text input is required"},{status:400});let s=await l.processUserInput(t);return a.NextResponse.json({success:!0,response:s,timestamp:new Date().toISOString()})}catch(e){return console.error("Voice transcription error:",e),a.NextResponse.json({error:"Failed to process voice input"},{status:500})}}async function h(){try{return l.clearHistory(),a.NextResponse.json({success:!0,message:"Conversation history cleared"})}catch(e){return console.error("Error clearing history:",e),a.NextResponse.json({error:"Failed to clear history"},{status:500})}}let m=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/voice/transcribe/route",pathname:"/api/voice/transcribe",filename:"route",bundlePath:"app/api/voice/transcribe/route"},resolvedPagePath:"/Users/leo/Desktop/apexaibot copy/app/api/voice/transcribe/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:y,staticGenerationAsyncStorage:g,serverHooks:v}=m,f="/api/voice/transcribe/route";function x(){return(0,i.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:g})}},6815:(e,t,s)=>{s.d(t,{vj:()=>o});let o=`You are Lexy from Apex Scale AI. Keep responses conversational, brief (under 3 sentences), and action-oriented. NEVER say your name, introduce yourself, or use repetitive greetings - users already know who you are.

SERVICES:
1. Lead Capture Bot - $950 setup, $50/month (great for small businesses)
2. Intelligent Sales Agent - $2,500 setup, $150/month (perfect for growing companies) 
3. Custom Automation - starts at $5,000 (enterprise solutions)

SALES CONVERSATION FLOW:
1. If they ask about costs/pricing -> Provide pricing, then move to booking
2. If they show interest in integration/setup -> Move directly to scheduling consultation
3. If they mention specific business needs -> Recommend best solution, then offer next steps
4. If they ask "how do I get started" -> Offer to schedule consultation immediately

CLOSING TECHNIQUES:
- "Would you like me to set up a quick consultation to discuss your specific needs?"
- "I can schedule a 15-minute call to walk through the setup process."
- "Let me connect you with our team to get this implemented for your business."
- "The next step would be a brief consultation to customize this for your needs."

STOP asking endless qualifying questions. After 2-3 exchanges, ALWAYS move toward booking/consultation.

Remember: You're a sales assistant. Get them to the next step!`}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),o=t.X(0,[276,972,258],()=>s(4567));module.exports=o})();