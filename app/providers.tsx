'use client';

import { ReactNode, useState } from 'react';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, metaMaskWallet, coinbaseWallet, walletConnectWallet, rabbyWallet, trustWallet, rainbowWallet, phantomWallet, okxWallet, ledgerWallet, braveWallet, zerionWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { http } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'demo';

// Wide wallet support via WalletConnect + popular injected wallets
const popularWallets = [
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
  rabbyWallet,
  phantomWallet,
  okxWallet,
  ledgerWallet,
  braveWallet,
  zerionWallet,
];

const connectors = connectorsForWallets([
  {
    groupName: 'Popular',
    wallets: popularWallets.map((w) => w({ projectId, chains: [base] })),
  },
]);

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors,
});

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={[base]} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


