import React, { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import type { PlanBudgetLine } from '../../types/planner';
import { formatNaira, parseNairaInput } from '../../utils/money';
import { cx } from '../../utils/styles';

const COLORS = ['bg-ink', 'bg-lime', 'bg-coral', 'bg-sky', 'bg-forest', 'bg-bloom', 'bg-sand'];

interface Props {
  lines: PlanBudgetLine[];
  workingBudget: number;
  budgetSuggested: boolean;
  tight: string | null;
  onUpdate: (key: string, next: Partial<PlanBudgetLine>, isEdit?: boolean) => void;
}

export function PlanBudget({ lines, workingBudget, budgetSuggested, tight, onUpdate }: Props) {
  const [why, setWhy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const all = lines.reduce((s, l) => s + l.amount, 0) || 1;
  const total = lines.filter((l) => l.selected).reduce((s, l) => s + l.amount, 0);
  const diff = lines.reduce((s, l) => s + l.amount, 0) - workingBudget;

  return (
    <section id="budget" aria-labelledby="pl-budget" className="scroll-mt-24 rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="pl-budget" className="text-[15px] font-medium text-ink">Budget</h2>
        <p className="text-xs tabular-nums text-smoke">{formatNaira(workingBudget)}{budgetSuggested && ' · suggested'}</p>
      </div>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-paper" aria-hidden="true">
        {lines.map((l, i) => <span key={l.key} className={cx(COLORS[i % COLORS.length], 'transition-all', !l.selected && 'opacity-20')} style={{ width: `${l.amount / all * 100}%` }} />)}
      </div>

      {tight &&
      <p role="note" className="mt-4 flex gap-2 rounded-2xl bg-coral/10 px-3.5 py-2.5 text-xs text-ink">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" aria-hidden="true" /> {tight}
        </p>
      }

      <ul className="mt-3">
        {lines.map((l, i) => {
          const draft = drafts[l.key] ?? Math.round(l.amount / 100).toLocaleString('en-NG');
          const bad = parseNairaInput(draft) === null;
          return (
            <li key={l.key} className={cx('-mx-2 rounded-xl px-2 py-1.5 transition hover:bg-paper/60', !l.selected && 'opacity-50')}>
              <div className="flex items-center gap-2.5">
                <input type="checkbox" checked={l.selected} disabled={l.existing} onChange={(e) => onUpdate(l.key, { selected: e.target.checked }, false)} aria-label={`Include ${l.name}`} className="h-4 w-4 shrink-0 accent-ink disabled:opacity-40" />
                <span className={cx('h-2 w-2 shrink-0 rounded-full', COLORS[i % COLORS.length])} aria-hidden="true" />
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span className="truncate text-sm text-ink">{l.name}</span>
                  {l.isNew && <span className="rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-semibold">New</span>}
                  {l.existing ?
                  <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[11px] text-smoke">In budget</span> :

                  <button type="button" onClick={() => setWhy(why === l.key ? null : l.key)} aria-expanded={why === l.key} aria-label={`Why this amount for ${l.name}`} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-smoke/70 transition hover:bg-white hover:text-ink">
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  }
                </div>
                <div className="relative w-[7.5rem] shrink-0 sm:w-32">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-smoke" aria-hidden="true">₦</span>
                  <input
                    inputMode="decimal"
                    value={draft}
                    disabled={l.existing}
                    aria-label={`${l.name} amount`}
                    aria-invalid={bad || undefined}
                    onChange={(e) => {
                      setDrafts((d) => ({ ...d, [l.key]: e.target.value }));
                      const k = parseNairaInput(e.target.value);
                      if (k !== null) onUpdate(l.key, { amount: k });
                    }}
                    onBlur={() => setDrafts((d) => {const n = { ...d };delete n[l.key];return n;})}
                    className={cx('h-8 w-full rounded-lg border bg-transparent pl-6 pr-2 text-right text-sm tabular-nums text-ink hover:border-line focus:border-ink focus:bg-white focus:outline-none disabled:hover:border-transparent', bad ? 'border-danger' : 'border-transparent')} />
                  
                </div>
              </div>
              {why === l.key && <p className="ml-[2.75rem] mt-1 pb-1 text-xs text-smoke">{l.why}</p>}
            </li>);

        })}
      </ul>

      <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3 text-sm">
        <span className="text-smoke">Selected</span>
        <span className="font-semibold tabular-nums text-ink">{formatNaira(total)}</span>
      </div>
      {diff > 0 && <p className="mt-1 text-right text-xs font-medium text-danger">{formatNaira(diff)} over budget</p>}
      {diff < 0 && <p className="mt-1 text-right text-xs text-smoke">{formatNaira(-diff)} unallocated</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-smoke">Planning estimates, not vendor quotes. Prices vary by city, date and spec.</p>
    </section>);

}