import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  // Ensure cache by hitting the PNG route once
  await fetch(`${base}/api/og/${params.userId}`, { cache: 'no-store' });

  const bucket = 'og-cache';
  const { data: files, error } = await supabaseAdmin.storage.from(bucket).list(params.userId, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  if (error || !files || files.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const path = `${params.userId}/${files[0].name}`;
  const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6); // 6 hours

  if (!signed?.signedUrl) return NextResponse.json({ error: 'Could not sign' }, { status: 500 });

  return NextResponse.json({ url: signed.signedUrl, path });
}
