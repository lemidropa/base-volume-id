import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tierForInvites, ensureAwardRecorded } from '@/lib/awards';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });
  }

  const { code } = (await req.json()) as { code?: string };
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  supabase.auth.setAuth(token);
  const { data: userData } = await supabase.auth.getUser();
  const invitee = userData.user;
  if (!invitee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('id, referral_code')
    .eq('referral_code', code)
    .maybeSingle();

  if (!inviterProfile) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
  }
  if (inviterProfile.id === invitee.id) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
  }

  await supabase.from('profiles').upsert({ id: invitee.id }).select().single();

  const { error } = await supabase
    .from('referrals')
    .insert({ inviter_id: inviterProfile.id, invitee_id: invitee.id, code });

  if (error && !error.message.includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Compute invites and award tiers if thresholds crossed
  const { data: countRows } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('inviter_id', inviterProfile.id);

  const inviteCount = (countRows as any)?.length ? (countRows as any).length : (countRows as unknown as number) || 0;
  const tier = tierForInvites(inviteCount);
  if (tier) {
    await ensureAwardRecorded(supabase, inviterProfile.id, tier);
  }

  return NextResponse.json({ ok: true, inviterId: inviterProfile.id, invites: inviteCount, tier });
}
