'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ShareToFarcasterButton() {
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id || null;
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
    const base = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const site = `${base}/?ref=${encodeURIComponent(refCode || '')}`;
    const text = encodeURIComponent('Join me on Base — generate your Volume ID and onboard friends.');
    // Warpcast compose supports text and embeds[]
    return `https://warpcast.com/~/compose?text=${text}&embeds[]=${encodeURIComponent(site)}`;
  }, [refCode]);

  const disabled = !refCode;

  return (
    <a
      className={`mt-2 inline-flex items-center px-4 py-2 rounded bg-purple-600 text-white ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      Share to Farcaster
    </a>
  );
}
