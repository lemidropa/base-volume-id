'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import LinkWalletButton from '@/components/LinkWalletButton';
import RecalcVolumeButton from '@/components/RecalcVolumeButton';
import AutoRecalcToggle from '@/components/AutoRecalcToggle';
import VolumeCardPreview from '@/components/VolumeCardPreview';
import ReferralCapture from '@/components/ReferralCapture';
import ShareToXButton from '@/components/ShareToXButton';
import ShareToFarcasterButton from '@/components/ShareToFarcasterButton';
import VolumeFilters from '@/components/VolumeFilters';
import ReferralLinkCopy from '@/components/ReferralLinkCopy';
import UserStatsPanel from '@/components/UserStatsPanel';

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-12">
      <section className="relative w-full max-w-6xl mb-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 rounded-2xl" />
        <div className="p-10">
          <div className="text-6xl font-extrabold tracking-tight">Base Volume ID</div>
          <div className="mt-2 text-slate-400">Welcome. Link your wallets, aggregate your on-chain volume, and flex your Base ID.</div>
          <div className="mt-6 opacity-10 text-[9rem] font-black leading-none select-none">BASE ID • VOLUME ID</div>
        </div>
      </section>
      <ReferralCapture />
      <ConnectButton />
      {isConnected && (
        <>
          <p className="mt-4">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <LinkWalletButton />
          <RecalcVolumeButton />
          <AutoRecalcToggle />
          <ReferralLinkCopy />
          <VolumeCardPreview />
          <VolumeFilters />
          <UserStatsPanel />
          <ShareToXButton />
          <ShareToFarcasterButton />
        </>
      )}
    </main>
  );
}