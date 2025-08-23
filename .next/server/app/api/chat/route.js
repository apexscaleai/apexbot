"use strict";(()=>{var e={};e.id=744,e.ids=[744],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},5102:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>f,patchFetch:()=>y,requestAsyncStorage:()=>m,routeModule:()=>d,serverHooks:()=>g,staticGenerationAsyncStorage:()=>h});var n={};o.r(n),o.d(n,{POST:()=>c});var r=o(9303),s=o(8716),a=o(670),i=o(7070),u=o(1258),p=o(6815);let l=new u.$D("AIzaSyBRpWdxJGndR9lCCx536vmY3K3upd--sC0");async function c(e){try{let{message:t,sessionId:o}=await e.json();if(!t)return i.NextResponse.json({error:"Message is required"},{status:400});let n=[],r=[],s="";r.length>0&&(s="\n\nRelevant company information:\n"+r.map(e=>`- ${e.title}: ${e.content}`).join("\n"));let a="";n.length>0&&(a="\n\nRecent conversation:\n"+n.map(e=>`${e.role}: ${e.message}`).join("\n"));let u=`${p.vj}${s}${a}

User: ${t}
Lexy:`,c=l.getGenerativeModel({model:"gemini-2.5-flash"}),d=await c.generateContent({contents:[{role:"user",parts:[{text:u}]}],generationConfig:{temperature:.7,topK:40,topP:.95,maxOutputTokens:1024}}),m=(await d.response).text();if(!m)throw Error("Empty response from Gemini");return i.NextResponse.json({reply:m.trim(),sessionId:o})}catch(e){return console.error("Chat API error:",e),i.NextResponse.json({reply:"I apologize, but I'm experiencing some technical difficulties right now. However, I'd be happy to help you learn more about Apex Scale AI's solutions! Would you like to know about our Lead Capture Bot, Intelligent Sales & Support Agent, or Custom AI Workflow Automation? Or perhaps you'd like to schedule a free consultation?",error:"Technical error occurred"})}}let d=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/chat/route",pathname:"/api/chat",filename:"route",bundlePath:"app/api/chat/route"},resolvedPagePath:"/Users/leo/Desktop/apexaibot copy/app/api/chat/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:g}=d,f="/api/chat/route";function y(){return(0,a.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:h})}},6815:(e,t,o)=>{o.d(t,{vj:()=>n});let n=`You are Lexy from Apex Scale AI. Keep responses conversational, brief (under 3 sentences), and action-oriented. NEVER say your name, introduce yourself, or use repetitive greetings - users already know who you are.

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

Remember: You're a sales assistant. Get them to the next step!`}};var t=require("../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),n=t.X(0,[276,972,258],()=>o(5102));module.exports=n})();