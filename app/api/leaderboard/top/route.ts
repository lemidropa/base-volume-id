import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get('pageSize') || '25')));
  // Aggregate referrals by inviter
  const { data, error } = await supabaseAdmin
    .from('referrals')
    .select('inviter_id')
    .limit(100000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const r of data || []) counts[r.inviter_id] = (counts[r.inviter_id] || 0) + 1;

  const inviterIds = Object.keys(counts);
  if (inviterIds.length === 0) return NextResponse.json({ rows: [] });

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, username, referral_code')
    .in('id', inviterIds);

  const { data: volumes } = await supabaseAdmin
    .from('volume_aggregates')
    .select('user_id, total_usd')
    .in('user_id', inviterIds);

  const volMap = new Map<string, number>((volumes || []).map((v) => [v.user_id, Number(v.total_usd || 0)]));

  const rowsAll = inviterIds
    .map((id) => ({
      inviterId: id,
      username: profiles?.find((p) => p.id === id)?.username || null,
      referralCode: profiles?.find((p) => p.id === id)?.referral_code || null,
      invites: counts[id] || 0,
      totalUsd: volMap.get(id) || 0,
    }))
    .sort((a, b) => b.invites - a.invites || b.totalUsd - a.totalUsd);

  const start = (page - 1) * pageSize;
  const rows = rowsAll.slice(start, start + pageSize);
  return NextResponse.json({ rows, page, pageSize, total: rowsAll.length });
}
