import pool from '@/lib/db';
import { unstable_noStore as noStore } from 'next/cache';
import { MdQueryStats } from 'react-icons/md';

function formatCurrency(v: number) {
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type AdjItem = {
  label: string;
  freq: string;
  started_on: string | null;
  ended_on: string | null;
  value: number; // original amount per occurrence
  monthlyAvg: number; // contribution to monthly average
  account_name?: string;
};

export default async function MonthlyIncomeSection() {
  // Always fetch fresh data
  noStore();

  let error: string | null = null;
  let incomeMonthly = 0;
  let chargesMonthly = 0;
  const items: AdjItem[] = [];

  try {
    const { rows } = await pool.query(
      `SELECT 
         ara.value::text,
         ara.frecuency,
         ara.started_on::text,
         ara.ended_on::text,
         ara.status,
         COALESCE(ara.label, '') as label,
         a.name as account_name
       FROM account_recurrent_adjustments ara
       JOIN accounts a ON a.id = ara.account_id
       WHERE ara.status IS NULL OR ara.status = 'ACTIVE'`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const r of rows as Array<Record<string, any>>) {
      const value = parseFloat(r.value);
      if (Number.isNaN(value)) continue;

      const freq = String(r.frecuency || '').toUpperCase();

      // Only include adjustments active today (optional but sensible)
      const startedOn = r.started_on ? new Date(r.started_on) : null;
      const endedOn = r.ended_on ? new Date(r.ended_on) : null;
      if (startedOn && startedOn > today) continue;
      if (endedOn && endedOn < today) continue;

      let annualFactor = 12; // default as monthly
      if (freq === 'WEEKLY') annualFactor = 52;
      else if (freq === 'BIWEEKLY' || freq === 'FORTNIGHTLY') annualFactor = 26;
      else if (freq === 'MONTHLY') annualFactor = 12;
      else if (freq === 'YEARLY' || freq === 'ANNUAL' || freq === 'ANNUALLY') annualFactor = 1;
      else if (freq === 'DAILY') annualFactor = 365; // safety if present

      const monthlyAvg = (value * annualFactor) / 12;
      items.push({
        label: r.label || '',
        freq,
        started_on: r.started_on || null,
        ended_on: r.ended_on || null,
        value,
        monthlyAvg,
        account_name: r.account_name,
      });
      if (monthlyAvg >= 0) incomeMonthly += monthlyAvg; else chargesMonthly += -monthlyAvg;
    }
  } catch (e) {
    error = 'Failed to compute monthly income statement' + (e instanceof Error ? `: ${e.message}` : '');
  }

  const netMonthly = incomeMonthly - chargesMonthly;
  const dailyNet = netMonthly / 30;
  // Sort: positives first (largest to smallest), then negatives (most negative first)
  const sortedItems = items.slice().sort((a, b) => {
    const aPos = a.monthlyAvg >= 0;
    const bPos = b.monthlyAvg >= 0;
    if (aPos && !bPos) return -1;
    if (!aPos && bPos) return 1;
    if (aPos && bPos) return b.monthlyAvg - a.monthlyAvg; // descending for income
    // both negative: ascending (e.g., -1000 before -50)
    return a.monthlyAvg - b.monthlyAvg;
  });

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 text-red-600 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <MdQueryStats className="inline-block" />
          <span>Monthly Income Statement</span>
        </h2>
        <span className="text-xs text-foreground/60 border px-2 py-1 rounded-md bg-background/50">
          Averages from Weekly/BIWeekly/Monthly/Yearly
        </span>
      </div>

      <div className="relative rounded-xl border border-foreground/10 bg-background/60 backdrop-blur shadow-sm overflow-hidden">
        <div className="p-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-1">Avg Monthly Income</div>
            <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(incomeMonthly)}</div>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-1">Avg Monthly Charges</div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(chargesMonthly)}</div>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-1">Avg Monthly Net</div>
            <div className="text-2xl font-semibold">{formatCurrency(netMonthly)}</div>
          </div>
          <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-1">Avg Daily Net (÷30)</div>
            <div className="text-2xl font-semibold">{formatCurrency(dailyNet)}</div>
          </div>
        </div>
      </div>

      {/* Per-adjustment contributions: 3 per row on small+ screens */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sortedItems.map((it, idx) => {
          const isIncome = it.monthlyAvg >= 0;
          const tint = isIncome ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10';
          const border = isIncome ? 'border-emerald-200/60 dark:border-emerald-400/20' : 'border-red-200/60 dark:border-red-400/20';
          return (
            <div key={idx} className={`rounded-lg border ${border} ${tint} p-3 flex flex-col gap-1`}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm truncate" title={it.label}>
                  {it.label} {it.account_name ? <span className="opacity-60">({it.account_name})</span> : null}
                </div>
                <div className={`text-xs font-semibold ${isIncome ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                  {formatCurrency(Math.abs(it.monthlyAvg))}/mo
                </div>
              </div>
              <div className="text-[11px] text-foreground/70 flex flex-wrap gap-x-3 gap-y-0.5">
                <span><span className="opacity-60">Freq:</span> {it.freq || 'N/A'}</span>
                <span><span className="opacity-60">Amount:</span> {formatCurrency(it.value)}</span>
                <span><span className="opacity-60">Start:</span> {it.started_on ? new Date(it.started_on).toLocaleDateString() : '-'}</span>
                <span><span className="opacity-60">End:</span> {it.ended_on ? new Date(it.ended_on).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-foreground/60">
        Notes: Weekly × 52, Biweekly/Fortnightly × 26, Monthly × 12, Yearly × 1; then divided by 12 to get monthly averages. Daily (if any) is approximated as × 365.
      </div>
    </div>
  );
}
