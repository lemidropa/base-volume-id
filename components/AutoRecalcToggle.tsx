'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AutoRecalcToggle() {
  const [enabled, setEnabled] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const start = async () => {
      // Run immediately once
      await runOnce();
      // Then schedule every 10 minutes
      intervalRef.current = window.setInterval(runOnce, 10 * 60 * 1000);
    };

    const stop = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    async function runOnce() {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      await fetch('/api/volume/recalculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    }

    if (enabled) start(); else stop();
    return () => stop();
  }, [enabled]);

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        id="auto-recalc"
        type="checkbox"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      />
      <label htmlFor="auto-recalc" className="text-sm">Auto-recalculate every 10 minutes</label>
    </div>
  );
}
