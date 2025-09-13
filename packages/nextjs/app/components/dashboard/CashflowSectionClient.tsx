'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { MdQueryStats } from 'react-icons/md';
import type { RecurrentAdjustment } from './CashflowSection';

type Props = {
  adjustments: RecurrentAdjustment[];
  error?: string;
};

export default function CashflowClient({ adjustments, error }: Props) {
  const [anchorMonth, setAnchorMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const startingBalance = 10000; // TODO: fetch per account or aggregate if needed

  // Expand DB recurrent adjustments into a normalized structure similar to previous mock data.
  // Supported frecuency values assumed: 'MONTHLY', 'WEEKLY', 'DAILY'. Case-insensitive.
  const normalized = useMemo(() => {
    return adjustments.map(a => ({
      id: a.id,
      label: a.label || `#${a.id}`,
      value: parseFloat(a.value),
      frequency: (a.frecuency || '').toUpperCase(),
      startedOn: new Date(a.started_on),
      status: a.status || 'ACTIVE'
    }));
  }, [adjustments]);

  const { dates, dayKeys } = useMemo(() => buildDateRange(anchorMonth), [anchorMonth]);

  // Build per-adjustment day map; positive values considered income, negative outflow.
  const adjustmentDayMaps = useMemo(() => {
    return normalized.map(adj => {
      const map: Record<string, number> = {};
      dates.forEach(d => {
        if (d < adj.startedOn) return;
        switch (adj.frequency) {
          case 'DAILY':
            map[toKey(d)] = (map[toKey(d)] || 0) + adj.value;
            break;
          case 'WEEKLY':
            // occurs on same weekday as startedOn
            if (d.getDay() === adj.startedOn.getDay()) {
              map[toKey(d)] = (map[toKey(d)] || 0) + adj.value;
            }
            break;
          case 'MONTHLY':
            if (d.getDate() === adj.startedOn.getDate()) {
              map[toKey(d)] = (map[toKey(d)] || 0) + adj.value;
            }
            break;
          default:
            // fallback treat as monthly
            if (d.getDate() === adj.startedOn.getDate()) {
              map[toKey(d)] = (map[toKey(d)] || 0) + adj.value;
            }
        }
      });
      return map;
    });
  }, [normalized, dates]);

  const incomeByDay = useMemo(() => {
    const map: Record<string, number> = {};
    adjustmentDayMaps.forEach((row, idx) => {
      const val = normalized[idx].value;
      if (val <= 0) return;
      Object.entries(row).forEach(([k, v]) => {
        if (v > 0) map[k] = (map[k] || 0) + v;
      });
    });
    return map;
  }, [adjustmentDayMaps, normalized]);

  const outflowByDay = useMemo(() => {
    const map: Record<string, number> = {};
    adjustmentDayMaps.forEach((row, idx) => {
      const val = normalized[idx].value;
      if (val >= 0) return;
      Object.entries(row).forEach(([k, v]) => {
        if (v < 0) map[k] = (map[k] || 0) + v; // negative accumulation
      });
    });
    return map;
  }, [adjustmentDayMaps, normalized]);

  const dailyNet = useMemo(() => {
    const net: Record<string, number> = {};
    dayKeys.forEach(k => {
      const inc = incomeByDay[k] || 0;
      const out = outflowByDay[k] || 0; // negative
      net[k] = inc + out; // out is negative
    });
    return net;
  }, [dayKeys, incomeByDay, outflowByDay]);

  const startingBalanceByDay = useMemo(() => {
    let running = startingBalance;
    const map: Record<string, number> = {};
    dayKeys.forEach(k => {
      map[k] = running;
      running += dailyNet[k] || 0;
    });
    return map;
  }, [dayKeys, dailyNet]);

  const endingBalanceByDay = useMemo(() => {
    const map: Record<string, number> = {};
    dayKeys.forEach(k => {
      map[k] = (startingBalanceByDay[k] || 0) + (dailyNet[k] || 0);
    });
    return map;
  }, [dayKeys, startingBalanceByDay, dailyNet]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const key = toKey(anchorMonth);
    const container = scrollRef.current;
    if (!container) return;
    const th = container.querySelector(`th[data-day-key="${key}"]`) as HTMLElement | null;
    if (th) {
      const offset = th.offsetLeft - 140;
      container.scrollTo({ left: Math.max(offset, 0), behavior: 'smooth' });
    }
  }, [anchorMonth, dates]);

  function shiftMonth(delta: number) {
    setAnchorMonth(m => {
      const d = new Date(m);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  return (
    <div className="flex flex-col gap-3">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 text-red-600 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
              <MdQueryStats className="inline-block" />
              <span>Cashflow</span>
            </h2>
            <Header anchorMonth={anchorMonth} onShift={shiftMonth} />
        </div>

      <div ref={scrollRef} className="relative rounded-xl border border-foreground/10 bg-background/60 backdrop-blur shadow-sm overflow-x-auto">
        <table
          className="cashflow-grid"
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: 900
          }}
        >
          <thead>
            <tr>
              <Th sticky left width={170}></Th>
              {dates.map(d => (
                <Th key={toKey(d)} data-day-key={toKey(d)}>
                  {d.getDate()}/{d.getMonth() + 1}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Starting Balance" data={dayKeys.map(k => formatCurrency(startingBalanceByDay[k]))} />
            <Row label="Total Income" data={dayKeys.map(k => incomeByDay[k] ? formatCurrency(incomeByDay[k]) : '')} highlight="income" />
            <SectionRow label="Adjustments" colSpan={dates.length + 1} />
            {normalized.map((adj, idx) => (
              <Row
                key={adj.id}
                label={adj.label}
                data={dayKeys.map(k => {
                  const v = adjustmentDayMaps[idx][k];
                  return v ? formatCurrency(v) : '';
                })}
              />
            ))}
            <Row label="Total Outflow" data={dayKeys.map(k => outflowByDay[k] ? formatCurrency(outflowByDay[k]) : '')} highlight="charges" />
            <Row label="Daily Net" data={dayKeys.map(k => dailyNet[k] ? formatCurrency(dailyNet[k]) : formatCurrency(0))} highlight="net" bold />
            <Row label="Ending Balance" data={dayKeys.map(k => formatCurrency(endingBalanceByDay[k]))} bold />
          </tbody>
        </table>
      </div>
      <Legend />
      <StyleTag />
    </div>
  );
}

function offsetDate(yearDelta: number, monthDelta: number, day: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthDelta);
  d.setFullYear(d.getFullYear() + yearDelta);
  d.setDate(day);
  d.setHours(0,0,0,0);
  return d;
}

function buildDateRange(anchor: Date) {
  const start = new Date(anchor);
  start.setMonth(start.getMonth() - 1);
  start.setDate(1);
  const end = new Date(anchor);
  end.setMonth(end.getMonth() + 2);
  end.setDate(0);
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return { dates, dayKeys: dates.map(toKey) };
}

function toKey(d: Date) {
  return d.toISOString().slice(0,10);
}

function formatCurrency(v: number) {
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function Th({
  children,
  sticky,
  left,
  width,
  className = '',
  ...rest
}: {
  children?: React.ReactNode;
  sticky?: boolean;
  left?: boolean;
  width?: number;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <th
      {...rest}
      className={`text-left font-medium bg-foreground/5 backdrop-blur text-foreground/70 border-b border-foreground/10 text-[11px] px-2 py-1 whitespace-nowrap ${sticky ? 'sticky top-0 z-20' : ''} ${sticky && left ? 'left-0' : ''} ${className}`}
      style={{ minWidth: 70, width }}
    >
      {children}
    </th>
  );
}

function Row({ label, data, highlight, bold }: { label: string; data: string[]; highlight?: string; bold?: boolean }) {
  return (
    <tr className="hover:bg-primary/5 transition-colors">
      <td className={`sticky left-0 bg-background/80 backdrop-blur border-r border-foreground/5 px-2 py-1 text-[14px] ${bold ? 'font-semibold' : 'font-medium'} whitespace-nowrap z-10`}>{label}</td>
      {data.map((v, i) => (
        <td
          key={i}
          className="text-right px-2 py-1 text-[11px] border-b border-foreground/5 tabular-nums"
          style={{
            background: colorFor(highlight, v),
            color: colorTextFor(highlight, v),
            minWidth: 70
          }}
        >
          {v}
        </td>
      ))}
    </tr>
  );
}

function SectionRow({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr>
      <td className="sticky left-0 bg-foreground/5 backdrop-blur text-[14px] uppercase tracking-wide font-semibold px-3 py-2 border-y-2 border-foreground/10 z-20">
        {label}
      </td>
      {Array.from({ length: colSpan - 1 }).map((_, i) => (
        <td
          key={i}
          className="bg-foreground/5 border-y-2 border-foreground/10"
          style={{ padding: 0 }}
        />
      ))}
    </tr>
  );
}

function colorFor(type?: string, value?: string) {
  if (!type || !value) return 'transparent';
  if (type === 'income') return '#e8f9f0';
  if (type === 'charges') return '#fff1f1';
  if (type === 'net') return '#f5f7ff';
  return 'transparent';
}

function colorTextFor(type?: string, value?: string) {
  if (!type || !value) return '#222';
  if (type === 'income') return '#0d6638';
  if (type === 'charges') return '#992a2a';
  if (type === 'net') return '#1b2d6b';
  return '#222';
}

function Header({ anchorMonth, onShift }: { anchorMonth: Date; onShift: (d: number) => void }) {
  const monthName = anchorMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <button onClick={() => onShift(-1)} style={btnStyle} aria-label="Previous Month">←</button>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{monthName} (Prev / Current / Next)</div>
      <button onClick={() => onShift(1)} style={btnStyle} aria-label="Next Month">→</button>
    </div>
  );
}

function Legend() {
  return (
    <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11 }}>
      <LegendItem color="#e8f9f0" label="Income" />
      <LegendItem color="#fff1f1" label="Charges" />
      <LegendItem color="#f5f7ff" label="Net" />
      <div style={{ opacity: 0.6 }}>Scroll horizontally to view all days</div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 14, height: 14, background: color, border: '1px solid #ccc' }} />
      <span>{label}</span>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '4px 10px',
  background: '#fff',
  cursor: 'pointer',
  borderRadius: 4,
  fontSize: 16
};

function StyleTag() {
  return (
    <style>{`
      :root { --row-h: 38px; --grid-border: rgba(0,0,0,0.28); }
      .cashflow-grid { border: 1px solid var(--grid-border); }
      .cashflow-grid th, .cashflow-grid td { border-color: var(--grid-border) !important; }
      .cashflow-grid thead th, .cashflow-grid tbody td { border-bottom: 1px solid var(--grid-border); }
      .cashflow-grid thead th:not(:last-child), .cashflow-grid tbody td:not(:last-child) { border-right: 1px solid var(--grid-border); }
      .cashflow-grid tbody tr td.border-y-2 { border-top: 2px solid var(--grid-border) !important; border-bottom: 2px solid var(--grid-border) !important; }
      thead tr th, tbody tr td { height: var(--row-h); vertical-align: middle; }
      @media (max-width: 640px) { table { min-width: 600px; } th, td { min-width: 60px !important; padding: 4px 4px !important; } }
      tr:hover td { background-clip: padding-box; }
    `}</style>
  );
}
