import { Alchemy } from 'alchemy-sdk';
import { Utils } from 'alchemy-sdk';
import { BASE_DEX_ROUTERS } from './routers';
import { SupabaseClient } from '@supabase/supabase-js';

async function getUsdPriceForToken(alchemy: Alchemy, address: string) {
  try {
    const res = await alchemy.core.getTokenPrice(address);
    return res?.usdPrice || 0;
  } catch {
    return 0;
  }
}

export async function recomputeUserVolume(
  supabase: SupabaseClient,
  alchemy: Alchemy,
  userId: string
): Promise<number> {
  return recomputeUserVolumeFromBlock(supabase, alchemy, userId, '0x0');
}

export async function recomputeUserVolumeLastDays(
  supabase: SupabaseClient,
  alchemy: Alchemy,
  userId: string,
  days: number
): Promise<number> {
  const current = await alchemy.core.getBlockNumber();
  const approxPerDay = 43200; // ~2s blocks (OP Stack approx)
  const start = current - Math.max(1, Math.floor(days * approxPerDay));
  const fromBlock = `0x${start.toString(16)}`;
  return recomputeUserVolumeFromBlock(supabase, alchemy, userId, fromBlock, false);
}

async function recomputeUserVolumeFromBlock(
  supabase: SupabaseClient,
  alchemy: Alchemy,
  userId: string,
  fromBlock: `0x${string}` | '0x0',
  persist: boolean = true
): Promise<number> {
  const { data: wallets } = await supabase
    .from('wallets')
    .select('address')
    .eq('user_id', userId);

  const addresses = (wallets || []).map((w) => w.address.toLowerCase());
  if (addresses.length === 0) {
    if (persist) {
      await supabase
        .from('volume_aggregates')
        .upsert({ user_id: userId, total_usd: 0, updated_at: new Date().toISOString() });
    }
    return 0;
  }

  const maxCountPerPage = 1000;
  let totalUsd = 0;

  for (const addr of addresses) {
    let pageKey: string | undefined = undefined;
    do {
      const resp = await alchemy.core.getAssetTransfers({
        fromBlock,
        fromAddress: addr as `0x${string}`,
        category: ['erc20', 'external', 'internal'],
        withMetadata: false,
        maxCount: maxCountPerPage,
        pageKey,
      });

      for (const t of resp.transfers) {
        const to = (t.to || '').toLowerCase();
        if (!to || !BASE_DEX_ROUTERS.includes(to)) continue;

        if (t.category === 'external' || t.category === 'internal') {
          const ethAmount = Number(t.value || 0);
          const usd = ethAmount * (await getUsdPriceForToken(alchemy, Utils.NATIVE_TOKEN_ADDRESS));
          totalUsd += usd;
        }
        if (t.category === 'erc20') {
          const raw = Number(t.value || 0);
          if (!t.rawContract?.address) continue;
          const price = await getUsdPriceForToken(alchemy, t.rawContract.address);
          if (price <= 0) continue;
          totalUsd += raw * price;
        }
      }

      pageKey = resp.pageKey as string | undefined;
    } while (pageKey);
  }

  if (persist) {
    await supabase
      .from('volume_aggregates')
      .upsert({ user_id: userId, total_usd: totalUsd, updated_at: new Date().toISOString() });
  }

  return totalUsd;
}
