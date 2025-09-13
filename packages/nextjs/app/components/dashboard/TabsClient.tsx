'use client';
import { useState, ReactNode } from 'react';
import { MdQueryStats } from 'react-icons/md';
import { FaListUl } from 'react-icons/fa';

export type DashboardTab = {
  key: string;
  label: string;
  content: ReactNode;
};

export default function TabsClient({ tabs }: { tabs: DashboardTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Dashboard Sections"
        className="flex gap-1 rounded-lg p-1 bg-background/60 backdrop-blur border border-foreground/10 shadow-sm overflow-x-auto"
      >
        {tabs.map(t => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/30 shadow-inner'
                  : 'text-foreground/60 hover:text-foreground/80 hover:bg-foreground/5 border border-transparent'
              }`}
            >
              <span className="text-base">
                {t.key === 'cashflow' ? <MdQueryStats /> : t.key === 'accounts' ? <FaListUl /> : null}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        className="rounded-xl border border-foreground/10 bg-background/60 backdrop-blur shadow-sm p-4"
        style={{ animation: 'fadeIn 0.25s ease' }}
      >
        {tabs.find(t => t.key === active)?.content}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
