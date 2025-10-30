'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function tierForInvites(n: number): string | null {
  if (n >= 100) return 'Gold Onboarder';
  if (n >= 50) return 'Silver Onboarder';
  if (n >= 10) return 'Bronze Onboarder';
  return null;
}

export default function UserStatsPanel() {
  const [invites, setInvites] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_id', uid);
      setInvites(typeof count === 'number' ? count : 0);
    })();
  }, []);

  const tier = invites !== null ? tierForInvites(invites) : null;

  if (invites === null) return null;

  return (
    <div className="mt-4 w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">Invites</div>
          <div className="text-2xl font-semibold">{invites}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Tier</div>
          <div className="text-lg font-semibold">{tier || '—'}</div>
        </div>
      </div>
    </div>
  );
}
