'use client';

import { useEffect, useState } from 'react';
import ReferralLinkCopy from '@/components/ReferralLinkCopy';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const [autoCalc, setAutoCalc] = useState<boolean>(false);
  const [shareText, setShareText] = useState<string>('Just generated my Base Volume ID — track your on-chain volume across wallets and onboard friends!');
  const [ogUrl, setOgUrl] = useState<string>('');
  const [defaultShare, setDefaultShare] = useState<'x' | 'farcaster'>('x');
  const [invites, setInvites] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    setAutoCalc(localStorage.getItem('auto-calc') === '1');
    const txt = localStorage.getItem('share-text');
    if (txt) setShareText(txt);
    const ds = localStorage.getItem('default-share');
    if (ds === 'x' || ds === 'farcaster') setDefaultShare(ds);
  }, []);

  useEffect(() => {
    (async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return;
      const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const res = await fetch(`${base}/api/og-url/${uid}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (json?.url) setOgUrl(json.url);
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_id', uid);
      const c = typeof count === 'number' ? count : 0;
      setInvites(c);
      setTier(c >= 100 ? 'Gold Onboarder' : c >= 50 ? 'Silver Onboarder' : c >= 10 ? 'Bronze Onboarder' : null);
    })();
  }, []);

  const save = () => {
    localStorage.setItem('auto-calc', autoCalc ? '1' : '0');
    localStorage.setItem('share-text', shareText);
    localStorage.setItem('default-share', defaultShare);
    alert('Saved');
  };

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="mb-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autoCalc} onChange={(e) => setAutoCalc(e.target.checked)} />
          <span>Auto-recalculate volume every 10 minutes</span>
        </label>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-1">Default Share Text</label>
        <textarea
          className="w-full min-h-[100px] rounded border bg-slate-900 text-slate-200 p-2"
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-1">Default Share Destination</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="share" checked={defaultShare === 'x'} onChange={() => setDefaultShare('x')} /> X (Twitter)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="share" checked={defaultShare === 'farcaster'} onChange={() => setDefaultShare('farcaster')} /> Farcaster
          </label>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-1">Your Referral Link</label>
        <ReferralLinkCopy />
      </div>

      {ogUrl && (
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-1">Signed OG Image URL</label>
          <div className="flex items-center gap-2">
            <input className="w-80 max-w-full rounded border px-2 py-1 bg-slate-900 text-slate-200" readOnly value={ogUrl} />
            <button className="px-3 py-1 rounded bg-slate-800 border" onClick={() => navigator.clipboard.writeText(ogUrl)}>Copy</button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-1">Your Onboarder Stats</label>
        <div className="flex items-center gap-8 text-sm">
          <div>Invites: <span className="font-semibold">{invites ?? '—'}</span></div>
          <div>Tier: <span className="font-semibold">{tier || '—'}</span></div>
        </div>
      </div>

      <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={save}>Save</button>
    </main>
  );
}
