import React from 'react';
import { ArrowRight, ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { useDemoEntry } from '../../hooks/useDemoEntry';
import { btn, cx } from '../../utils/styles';

const TASKS: Array<[string, string]> = [
['Agree the programme with both families', '14 wks'],
['Visit venues for 200 guests', '13 wks'],
['Book a caterer tasting', '11 wks']];

const BUDGET = [
{ name: 'Catering', share: 32, cls: 'bg-ink' },
{ name: 'Venue', share: 18, cls: 'bg-lime' },
{ name: 'Decor', share: 12, cls: 'bg-coral' },
{ name: 'Other', share: 28, cls: 'bg-sky' },
{ name: 'Buffer', share: 10, cls: 'bg-sand' }];


/** Homepage preview of the AI Planner: one sentence in, a starting plan out. */
export function IntelligenceSection() {
  const { enter, pending } = useDemoEntry();
  return (
    <section aria-labelledby="planner-title" className="bg-paper">
      <div className="container grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
        <div className="max-w-lg">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink/60"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI Planner</p>
          <h2 id="planner-title" className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-ink sm:text-5xl">Not sure where to start?</h2>
          <p className="mt-5 text-base leading-relaxed text-smoke sm:text-lg">Describe your event in one line. Get a checklist, a budget split and the vendors to consider — you keep what fits.</p>
          <button type="button" onClick={() => enter('/app/plan')} disabled={pending} className={cx(btn.base, btn.ink, btn.md, 'mt-8')}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Try the planner <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[1.75rem] bg-white/70 p-2 shadow-[0_24px_60px_-30px_rgba(16,17,15,0.35)] ring-1 ring-ink/5" aria-hidden="true">
          <div className="flex items-center gap-3 rounded-[1.4rem] bg-white px-4 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-smoke" />
            <p className="min-w-0 flex-1 truncate text-sm text-ink">Traditional wedding, Port Harcourt, 200 guests, ₦5m</p>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-paper"><ArrowUp className="h-3.5 w-3.5" /></span>
          </div>

          <div className="mt-2 rounded-[1.4rem] bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-smoke">Starting plan</p>
            <ul className="mt-2">
              {TASKS.map(([t, w]) =>
              <li key={t} className="flex items-center gap-3 py-2 text-[13px] text-ink">
                  <span className="h-[15px] w-[15px] shrink-0 rounded-full border border-ink/25" />
                  <span className="min-w-0 flex-1 truncate">{t}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-smoke">{w}</span>
                </li>
              )}
              <li className="py-1 pl-[27px] text-[11px] text-smoke">+ 8 more</li>
            </ul>
            <div className="mt-3 border-t border-line pt-4">
              <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                {BUDGET.map((x) => <span key={x.name} className={x.cls} style={{ width: `${x.share}%` }} />)}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-smoke">
                {BUDGET.map((x) => <span key={x.name} className="inline-flex items-center gap-1.5"><span className={cx('h-1.5 w-1.5 rounded-full', x.cls)} />{x.name}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}