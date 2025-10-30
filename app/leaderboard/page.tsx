import 'server-only';

async function getTop(page: number, pageSize: number) {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/leaderboard/top?page=${page}&pageSize=${pageSize}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { rows: [] } as any;
  return res.json();
}

export default async function LeaderboardPage({ searchParams }: { searchParams?: { page?: string; pageSize?: string } }) {
  const page = Math.max(1, Number(searchParams?.page || '1'));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams?.pageSize || '25')));
  const { rows, total } = await getTop(page, pageSize);

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Top Onboarders</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Invites</th>
              <th className="py-2 pr-4">Total Volume (USD)</th>
              <th className="py-2 pr-4">Referral Link</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={r.inviterId} className="border-b border-slate-900">
                <td className="py-2 pr-4">{i + 1}</td>
                <td className="py-2 pr-4">{r.username || r.inviterId.slice(0, 6) + '…'}</td>
                <td className="py-2 pr-4 font-semibold">{r.invites}</td>
                <td className="py-2 pr-4">${r.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td className="py-2 pr-4 text-blue-400 underline">
                  {r.referralCode ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}/?ref=${r.referralCode}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <a className={`px-3 py-1 rounded border ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`} href={`?page=${page - 1}&pageSize=${pageSize}`}>Prev</a>
        <span className="text-sm">Page {page} · Total {total}</span>
        <a className={`px-3 py-1 rounded border ${rows.length < pageSize ? 'pointer-events-none opacity-50' : ''}`} href={`?page=${page + 1}&pageSize=${pageSize}`}>Next</a>
      </div>
    </main>
  );
}
