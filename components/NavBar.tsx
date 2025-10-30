'use client';

import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/60 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link className="font-semibold" href="/">Base Volume ID</Link>
        <div className="flex-1" />
        <Link className="text-sm text-slate-300 hover:text-white" href="/leaderboard">Onboarders</Link>
        <Link className="text-sm text-slate-300 hover:text-white" href="/leaderboard/volume">Top Volume</Link>
        <Link className="text-sm text-slate-300 hover:text-white" href="/settings">Settings</Link>
      </nav>
    </header>
  );
}
