'use client';

import { useAccount, useSignMessage } from 'wagmi';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LinkWalletButton() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<string>('');

  const onLink = async () => {
    try {
      if (!isConnected || !address) {
        setStatus('Connect a wallet first.');
        return;
      }

      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        setStatus('Sign in with Supabase first.');
        return;
      }

      // 1) request nonce for this user
      const nonceRes = await fetch('/api/wallet/nonce', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { nonce } = await nonceRes.json();
      if (!nonce) throw new Error('Could not get nonce');

      // 2) SIWE-like message
      const domain = window.location.host;
      const uri = window.location.origin;
      const msg = `Sign in with Ethereum to Base Volume ID.\n\nDomain: ${domain}\nURI: ${uri}\nAddress: ${address}\nNonce: ${nonce}`;

      const signature = await signMessageAsync({ message: msg });

      // 3) Link on server
      const linkRes = await fetch('/api/wallet/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ address, message: msg, signature, nonce }),
      });

      if (!linkRes.ok) {
        const err = await linkRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to link');
      }

      setStatus('Wallet linked successfully.');
    } catch (e: any) {
      setStatus(e.message || 'Error linking wallet');
    }
  };

  return (
    <div className="mt-6">
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        onClick={onLink}
        disabled={!isConnected}
      >
        Link this wallet
      </button>
      {status && <p className="mt-2 text-sm text-gray-500">{status}</p>}
    </div>
  );
}
