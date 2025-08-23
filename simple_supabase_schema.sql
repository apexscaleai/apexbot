-- Simple Supabase schema for the Apex Scale AI bot
-- Run this in your Supabase SQL editor to create the required tables

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created 
ON public.chat_messages (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_content 
ON public.knowledge_base USING gin(to_tsvector('english', content));

-- Enable Row Level Security (optional)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Basic policies (allow all for now - customize as needed)
CREATE POLICY "Allow all operations on chat_messages" ON public.chat_messages
FOR ALL USING (true);

CREATE POLICY "Allow all operations on knowledge_base" ON public.knowledge_base
FOR ALL USING (true);

-- Sample knowledge base entries for Apex Scale AI
INSERT INTO public.knowledge_base (title, content, category) VALUES
('Lead Capture Bot', 'Our Lead Capture Bot is perfect for small businesses starting their automation journey. It automatically engages website visitors, captures contact information, and answers up to 10 frequently asked questions. Price: $950 setup + $50/month.', 'services'),
('Intelligent Sales Agent', 'Our Intelligent Sales & Support Agent provides advanced AI training on your company documents. It handles up to 50 complex FAQs, integrates with calendars for lead booking, and offers advanced lead scoring. Price: $2,500 setup + $150/month.', 'services'),
('Custom AI Automation', 'Our Custom AI Workflow Automation provides fully customized AI solutions. Includes CRM integration, multi-channel communication, automated follow-up sequences, and enterprise-level security. Starting at $5,000+.', 'services'),
('Company Info', 'Apex Scale AI empowers businesses to grow and scale efficiently through intelligent automation and conversational AI solutions. We help businesses automate customer interactions, capture leads, and streamline operations.', 'company'),
('Contact Information', 'To learn more about our services or schedule a consultation, please reach out to us through our website contact form or speak with me directly about your automation needs.', 'contact')
ON CONFLICT DO NOTHING;