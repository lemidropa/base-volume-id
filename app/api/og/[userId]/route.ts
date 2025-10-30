import { NextRequest } from 'next/server';
import { Resvg } from '@resvg/resvg-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const userId = params.userId;

  // Build a stable cache key using updated_at + inviteCount
  const [{ data: agg }, { count: inviteCount }] = await Promise.all([
    supabaseAdmin.from('volume_aggregates').select('updated_at').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('referrals').select('*', { count: 'exact', head: true }).eq('inviter_id', userId),
  ]);

  const stamp = (agg?.updated_at ? new Date(agg.updated_at).getTime() : 0) + '-' + (inviteCount || 0);
  const bucket = 'og-cache';
  const key = `${userId}/${stamp}.png`;

  // Try cache
  try {
    const { data } = await supabaseAdmin.storage.from(bucket).download(key);
    if (data) {
      const buf = Buffer.from(await data.arrayBuffer());
      return new Response(buf, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
    }
  } catch {}

  // Render fresh and store
  const svgUrl = `${base}/api/card/${userId}`;
  const svg = await fetch(svgUrl, { cache: 'no-store' }).then((r) => r.text());

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Upload
  try {
    await supabaseAdmin.storage.from(bucket).upload(key, pngBuffer, { contentType: 'image/png', upsert: true });
    // Invalidate old objects for this user
    const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId, { limit: 100 });
    const toRemove = (files || []).map((f) => `${userId}/${f.name}`).filter((path) => path !== key);
    if (toRemove.length) {
      await supabaseAdmin.storage.from(bucket).remove(toRemove);
    }
  } catch {}

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
