import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { alchemy } from '@/lib/alchemy';
import { recomputeUserVolume } from '@/lib/volume';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const singleUserId = searchParams.get('userId');

  if (singleUserId) {
    const total = await recomputeUserVolume(supabaseAdmin, alchemy, singleUserId);
    return NextResponse.json({ userId: singleUserId, totalUsd: total });
  }

  // Batch over all profiles
  const pageSize = 500;
  let from = 0;
  let to = pageSize - 1;
  let processed = 0;

  while (true) {
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .range(from, to);

    if (!users || users.length === 0) break;

    for (const u of users) {
      await recomputeUserVolume(supabaseAdmin, alchemy, u.id);
      processed += 1;
    }

    from += pageSize;
    to += pageSize;
  }

  return NextResponse.json({ ok: true, processed });
}
