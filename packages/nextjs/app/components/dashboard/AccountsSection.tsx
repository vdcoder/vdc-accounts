import pool from '@/lib/db';
import { unstable_noStore as noStore } from 'next/cache';
import { GiMatchTip } from 'react-icons/gi';
import { TbAdjustmentsDollar } from 'react-icons/tb';
import { FaListUl, FaThList } from 'react-icons/fa';

export type Account = {
  id: number;
  name: string;
  email: string;
  username: string;
  website: string | null;
  notes: string | null;
  status: string | null;
};

async function getAccounts(): Promise<Account[]> {
  // Disable caching so DB changes show up immediately
  noStore();
  const { rows } = await pool.query(
    `SELECT id, name, email, username, website, notes, status
     FROM accounts
     ORDER BY id DESC`
  );
  return rows;
}

export default async function AccountsSection() {
  let accounts: Account[] = [];
  let error: string | null = null;
  try {
    accounts = await getAccounts();
  } catch (e) {
    error = 'Failed to load accounts' + (e instanceof Error ? `: ${e.message}` : '');
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 text-red-600 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            <FaListUl className="inline-block" />
            <span>All Accounts</span>
        </h2>
        <span className="text-xs text-foreground/60 border px-2 py-1 rounded-md bg-background/50">
          {accounts.length} total
        </span>
      </div>
      <div className="relative rounded-xl border border-foreground/10 bg-background/60 backdrop-blur shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-foreground/5 text-foreground/70">
              <tr>
                <th className="text-left font-medium px-4 py-2">Name</th>
                <th className="text-left font-medium px-4 py-2">Username</th>
                <th className="text-left font-medium px-4 py-2">Email</th>
                <th className="text-left font-medium px-4 py-2">Website</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="text-left font-medium px-4 py-2">Balance</th>
                <th className="text-left font-medium px-4 py-2"></th>
                <th className="text-left font-medium px-4 py-2"></th>
                <th className="text-left font-medium px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-foreground/50">
                    No accounts yet.
                  </td>
                </tr>
              )}
              {accounts.map((acct) => (
                <tr
                  key={acct.id}
                  className="border-t border-foreground/5 hover:bg-primary/5 transition-colors"
                >
                  <td className="px-4 py-2 font-medium text-foreground/90">{acct.name}</td>
                  <td className="px-4 py-2 text-foreground/70">{acct.username}</td>
                  <td className="px-4 py-2 text-foreground/70">
                    <a
                      href={`mailto:${acct.email}`}
                      className="hover:underline decoration-dotted"
                    >
                      {acct.email}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-foreground/70">
                    {acct.website ? (
                      <a
                        href={acct.website.startsWith('http') ? acct.website : `https://${acct.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline decoration-dotted"
                      >
                        {acct.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-foreground/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                        acct.status === 'inactive'
                          ? 'bg-foreground/5 text-foreground/50 border-foreground/10'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      }`}
                    >
                      {acct.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-foreground/60 tabular-nums">-1</td>
                  <td className="px-4 py-2 text-foreground/60 tabular-nums text-4xl">
                    <a href="#"><GiMatchTip /></a>
                  </td>
                  <td className="px-4 py-2 text-foreground/60 tabular-nums text-4xl">
                    <a href="#"><TbAdjustmentsDollar /></a>
                  </td>
                  <td className="px-4 py-2 text-foreground/60 tabular-nums text-4xl">
                    <a href="#"><FaThList /></a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
