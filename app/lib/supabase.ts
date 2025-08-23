import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Temporarily disable Supabase for testing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface ChatMessage {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  message: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface KnowledgeBase {
  id?: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  created_at?: string;
}

export async function saveChatMessage(message: Omit<ChatMessage, 'id' | 'created_at'>) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping chat message save');
    return null;
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([message])
    .select()
    .single();

  if (error) {
    console.error('Error saving chat message:', error);
    return null;
  }

  return data;
}

export async function getChatHistory(sessionId: string, limit: number = 50) {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty chat history');
    return [];
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  return data || [];
}

export async function searchKnowledgeBase(query: string, limit: number = 5) {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty knowledge base results');
    return [];
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .textSearch('content', query)
    .limit(limit);

  if (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }

  return data || [];
}

export async function addKnowledgeBaseEntry(entry: Omit<KnowledgeBase, 'id' | 'created_at'>) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping knowledge base entry');
    return null;
  }

  const { data, error } = await supabase
    .from('knowledge_base')
    .insert([entry])
    .select()
    .single();

  if (error) {
    console.error('Error adding knowledge base entry:', error);
    return null;
  }

  return data;
}