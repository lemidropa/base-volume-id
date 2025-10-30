import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  const [{ data: agg }, { data: profile }, { count: inviteCount }] = await Promise.all([
    supabase.from('volume_aggregates').select('total_usd, updated_at').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('username, referral_code').eq('id', userId).maybeSingle(),
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('inviter_id', userId),
  ]);

  const total = agg?.total_usd ?? 0;
  const updatedAt = agg?.updated_at ?? new Date().toISOString();
  const name = profile?.username || 'Base User';

  const totalFmt = `$${Number(total).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  let badge = '';
  if ((inviteCount || 0) >= 100) badge = 'Gold Onboarder';
  else if ((inviteCount || 0) >= 50) badge = 'Silver Onboarder';
  else if ((inviteCount || 0) >= 10) badge = 'Bronze Onboarder';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="418" viewBox="0 0 800 418">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#0b2a52"/>
    </linearGradient>
  </defs>
  <rect width="800" height="418" fill="url(#g)" rx="24"/>
  <text x="40" y="80" fill="#7dd3fc" font-family="Inter, Arial" font-size="28" font-weight="600">Base Volume ID</text>
  <text x="40" y="130" fill="#e2e8f0" font-family="Inter, Arial" font-size="22">${name}</text>
  <text x="40" y="210" fill="#94a3b8" font-family="Inter, Arial" font-size="14">Total Volume</text>
  <text x="40" y="260" fill="#ffffff" font-family="Inter, Arial" font-size="48" font-weight="700">${totalFmt}</text>
  <text x="40" y="300" fill="#94a3b8" font-family="Inter, Arial" font-size="12">Updated: ${new Date(updatedAt).toISOString().slice(0,10)}</text>
  <rect x="640" y="300" width="120" height="40" rx="10" fill="#2563eb"/>
  <text x="700" y="327" fill="#ffffff" font-family="Inter, Arial" font-size="14" text-anchor="middle">on Base</text>
  ${badge ? `<rect x=\"600\" y=\"70\" width=\"180\" height=\"36\" rx=\"10\" fill=\"#16a34a\"/>\n  <text x=\"690\" y=\"94\" fill=\"#ffffff\" font-family=\"Inter, Arial\" font-size=\"14\" text-anchor=\"middle\">${badge}</text>` : ''}
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  });
}
