import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optionally warm leaderboard query to keep edge caches warm
  const { data } = await supabaseAdmin
    .from('volume_aggregates')
    .select('user_id, total_usd')
    .order('total_usd', { ascending: false })
    .limit(100);

  return NextResponse.json({ ok: true, warmed: data?.length || 0 });
}
