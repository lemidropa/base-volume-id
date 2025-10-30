'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ReferralLinkCopy() {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', uid)
        .maybeSingle();
      setCode(profile?.referral_code || null);
    })();
  }, []);

  const link = useMemo(() => {
    if (!code) return '';
    const base = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/?ref=${code}`;
  }, [code]);

  const onCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!code) return null;

  return (
    <div className="mt-4 flex items-center gap-2">
      <input className="w-80 max-w-full rounded border px-2 py-1 bg-slate-900 text-slate-200" readOnly value={link} />
      <button className="px-3 py-1 rounded bg-slate-800 border" onClick={onCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
