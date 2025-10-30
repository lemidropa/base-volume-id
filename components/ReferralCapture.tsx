'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ReferralCapture() {
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('ref');
    if (!code) return;

    const key = `ref-claimed-${code}`;
    if (localStorage.getItem(key)) {
      setClaimed(true);
      return;
    }

    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return; // wait until user signs in

      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        localStorage.setItem(key, '1');
        setClaimed(true);
      }
    })();
  }, []);

  if (!claimed) return null;
  return <p className="mt-2 text-xs text-emerald-500">Referral captured 🎉</p>;
}
