'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ShareToXButton() {
  const [refCode, setRefCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id || null;
      setUserId(uid);
      if (!uid) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', uid)
        .maybeSingle();
      setRefCode(profile?.referral_code || null);
    })();
  }, []);

  const shareUrl = useMemo(() => {
    if (!userId) return '#';
    const base = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const card = `${base}/api/card/${userId}`;
    const site = `${base}/?ref=${encodeURIComponent(refCode || '')}`;
    const text = encodeURIComponent(
      'Just generated my Base Volume ID — track your on-chain volume across wallets and onboard friends for tiers!'
    );
    const url = encodeURIComponent(site);
    // X will include the site link; card image can be visible when the site has OG tags. For MVP we include the site link.
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }, [userId, refCode]);

  const disabled = !userId || !refCode;

  return (
    <a
      className={`mt-4 inline-flex items-center px-4 py-2 rounded bg-black text-white border border-slate-700 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      Share to X
    </a>
  );
}
