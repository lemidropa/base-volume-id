import { SupabaseClient } from '@supabase/supabase-js';

export type Tier = 'bronze' | 'silver' | 'gold';

export function tierForInvites(count: number): Tier | null {
  if (count >= 100) return 'gold';
  if (count >= 50) return 'silver';
  if (count >= 10) return 'bronze';
  return null;
}

export async function ensureAwardRecorded(
  supabase: SupabaseClient,
  inviterId: string,
  tier: Tier
) {
  const { data } = await supabase
    .from('onboarder_awards')
    .select('tier')
    .eq('inviter_id', inviterId)
    .eq('tier', tier)
    .maybeSingle();

  if (data) return; // already recorded

  await supabase.from('onboarder_awards').insert({ inviter_id: inviterId, tier });
}
