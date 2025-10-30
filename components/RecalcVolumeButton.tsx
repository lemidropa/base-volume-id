'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RecalcVolumeButton() {
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recalc = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('Please sign in first');

      const res = await fetch('/api/volume/recalculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to recalc');
      setTotal(json.totalUsd ?? 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        onClick={recalc}
        disabled={loading}
      >
        {loading ? 'Calculating...' : 'Recalculate Volume'}
      </button>
      {total !== null && (
        <p className="mt-2 text-sm">Total Volume (USD): ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
