import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMessage, type Hex } from 'viem';

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

  const body = await req.json();
  const { address, message, signature, nonce } = body as {
    address: string;
    message: string;
    signature: Hex;
    nonce: string;
  };

  if (!address || !message || !signature || !nonce) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  supabase.auth.setAuth(token);
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check nonce exists and not expired for this user
  const { data: nonceRows, error: nonceErr } = await supabase
    .from('auth_nonces')
    .select('*')
    .eq('nonce', nonce)
    .eq('user_id', user.id)
    .limit(1);

  if (nonceErr || !nonceRows || nonceRows.length === 0) {
    return NextResponse.json({ error: 'Invalid nonce' }, { status: 400 });
  }

  const now = Date.now();
  if (new Date(nonceRows[0].expires_at).getTime() < now) {
    return NextResponse.json({ error: 'Nonce expired' }, { status: 400 });
  }

  // Verify off-chain signature
  const verified = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature,
  });

  if (!verified) {
    return NextResponse.json({ error: 'Signature invalid' }, { status: 400 });
  }

  // Remove nonce (single-use)
  await supabase.from('auth_nonces').delete().eq('nonce', nonce);

  // Ensure profile exists
  await supabase.from('profiles').upsert({ id: user.id }).select().single();

  // Link wallet (lower-cased unique)
  const { error: insertErr } = await supabase
    .from('wallets')
    .insert({ user_id: user.id, address: address.toLowerCase() });

  if (insertErr && !insertErr.message.includes('duplicate')) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
