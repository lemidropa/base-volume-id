import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get('pageSize') || '25')));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabaseAdmin
    .from('volume_aggregates')
    .select('user_id, total_usd', { count: 'exact' })
    .order('total_usd', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = (data || []).map((d) => d.user_id);
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, username, referral_code')
    .in('id', userIds);

  const rows = (data || []).map((d) => ({
    userId: d.user_id,
    totalUsd: Number(d.total_usd || 0),
    username: profiles?.find((p) => p.id === d.user_id)?.username || null,
    referralCode: profiles?.find((p) => p.id === d.user_id)?.referral_code || null,
  }));

  return NextResponse.json({ rows, page, pageSize, total: (data as any)?.length ?? 0 });
}
