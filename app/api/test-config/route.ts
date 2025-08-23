import { NextResponse } from 'next/server';
import { agentConfig } from '../../lib/agentConfig';

export async function GET() {
  return NextResponse.json({
    config: agentConfig,
    timestamp: new Date().toISOString(),
    hasLanguageField: 'language' in agentConfig
  });
}