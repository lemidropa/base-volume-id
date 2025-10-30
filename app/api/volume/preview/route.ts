import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { alchemy } from '@/lib/alchemy';
import { recomputeUserVolumeLastDays } from '@/lib/volume';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
  }

  supabase.auth.setAuth(token);
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const days = Number(new URL(req.url).searchParams.get('days') || '30');

  const totalUsd = await recomputeUserVolumeLastDays(supabase, alchemy, user.id, days);
  return NextResponse.json({ totalUsd, days });
}
