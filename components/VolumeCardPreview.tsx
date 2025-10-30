'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function VolumeCardPreview() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        setLoading(false);
        return;
      }
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      setUserId(uid);
      const { data } = await supabase
        .from('volume_aggregates')
        .select('total_usd')
        .eq('user_id', uid)
        .maybeSingle();
      if (mounted) {
        setTotal(data?.total_usd ?? 0);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mt-8 w-full max-w-2xl">
      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : userId ? (
        <img
          src={`/api/card/${userId}`}
          alt="Base Volume ID"
          className="w-full rounded-xl border border-slate-800"
        />
      ) : (
        <div className="text-sm text-slate-400">Sign in to see your card.</div>
      )}
    </div>
  );
}
