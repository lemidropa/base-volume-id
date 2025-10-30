'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function VolumeFilters() {
  const [days, setDays] = useState(30);
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (d: number) => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch(`/api/volume/preview?days=${d}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (res.ok) setValue(json.totalUsd ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
  }, []);

  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        className={`px-3 py-1 rounded border ${days === 30 ? 'bg-slate-800' : ''}`}
        onClick={() => { setDays(30); load(30); }}
      >
        30d
      </button>
      <button
        className={`px-3 py-1 rounded border ${days === 90 ? 'bg-slate-800' : ''}`}
        onClick={() => { setDays(90); load(90); }}
      >
        90d
      </button>
      <span className="ml-4 text-sm">
        {loading ? 'Loading…' : value !== null ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
      </span>
    </div>
  );
}
