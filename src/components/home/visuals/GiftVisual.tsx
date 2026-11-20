import React from 'react';
import { Gift, PackageCheck } from 'lucide-react';
import { useDb } from '../../../contexts/DataContext';
import { giftRaised } from '../../../utils/finance';
import { formatNaira, percent } from '../../../utils/money';

export function GiftVisual({ fundId = 'gi_b_obudu', itemId = 'gi_b_cam' }: {fundId?: string;itemId?: string;}) {
  const db = useDb();
  const fund = db.giftItems.find((g) => g.id === fundId);
  const item = db.giftItems.find((g) => g.id === itemId);
  if (!fund) return null;
  const r = giftRaised(db, fund.id);
  const target = fund.targetAmount ?? 1;
  const pct = percent(r.raised, target);

  return (
    <div className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white/70 p-2 shadow-[0_24px_60px_-30px_rgba(16,17,15,0.35)] ring-1 ring-ink/5 backdrop-blur">
      <div className="rounded-[1.4rem] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-paper"><Gift className="h-4 w-4 text-ink" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-smoke">Cash fund</p>
            <p className="truncate text-[15px] font-medium text-ink">{fund.name}</p>
          </div>
        </div>
        <div className="mt-6 flex items-end justify-between gap-3">
          <p className="text-3xl font-medium tracking-[-0.02em] tabular-nums text-ink">{formatNaira(r.raised)}</p>
          <p className="pb-1 text-xs tabular-nums text-smoke">{pct}%</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper" role="img" aria-label={`Fund ${pct}% raised`}>
          <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-smoke">
          <span>of {formatNaira(target)} · {r.contributors} contributors</span>
          {r.pending > 0 && <span className="text-coral">{formatNaira(r.pending)} pending</span>}
        </div>
      </div>
      {item &&
      <div className="flex items-center gap-3 px-5 py-3.5">
          <PackageCheck className="h-4 w-4 shrink-0 text-ink" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-sm text-ink">{item.name}</p>
          <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-[11px] text-smoke">Reserved · {item.reservedBy?.split(' ')[0]}</span>
        </div>
      }
    </div>);

}