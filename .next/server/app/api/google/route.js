"use strict";(()=>{var e={};e.id=897,e.ids=[897],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2558:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>f,patchFetch:()=>y,requestAsyncStorage:()=>m,routeModule:()=>g,serverHooks:()=>h,staticGenerationAsyncStorage:()=>d});var o={};s.r(o),s.d(o,{POST:()=>c});var r=s(9303),n=s(8716),a=s(670),i=s(7070),u=s(1258),l=s(6815);let p=new u.$D("AIzaSyBRpWdxJGndR9lCCx536vmY3K3upd--sC0");async function c(e){try{let t=await e.json();console.log("Google API request:",JSON.stringify(t,null,2));let s="";if(t.messages&&Array.isArray(t.messages)){let e=t.messages[t.messages.length-1];s=e?.content||e?.message||""}else t.message?s=t.message:t.prompt?s=t.prompt:"string"==typeof t&&(s=t);if(!s)return i.NextResponse.json({error:"No message found in request"},{status:400});console.log("Processing message:",s);let o=p.getGenerativeModel({model:"gemini-2.5-flash"}),r=`${l.vj}

User: ${s}
Lexy:`,n=await o.generateContent(r),a=(await n.response).text();if(!a)throw Error("Empty response from Gemini");return console.log("Generated response:",a),i.NextResponse.json({choices:[{message:{role:"assistant",content:a.trim()}}]})}catch(e){return console.error("Google API error:",e),i.NextResponse.json({error:"Failed to generate response",details:e instanceof Error?e.message:"Unknown error"},{status:500})}}let g=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/google/route",pathname:"/api/google",filename:"route",bundlePath:"app/api/google/route"},resolvedPagePath:"/Users/leo/Desktop/apexaibot copy/app/api/google/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:m,staticGenerationAsyncStorage:d,serverHooks:h}=g,f="/api/google/route";function y(){return(0,a.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:d})}},6815:(e,t,s)=>{s.d(t,{vj:()=>o});let o=`You are Lexy from Apex Scale AI. Keep responses conversational, brief (under 3 sentences), and action-oriented. NEVER say your name, introduce yourself, or use repetitive greetings - users already know who you are.

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

Remember: You're a sales assistant. Get them to the next step!`}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),o=t.X(0,[276,972,258],()=>s(2558));module.exports=o})();