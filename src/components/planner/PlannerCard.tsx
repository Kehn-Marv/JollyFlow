import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { EventRecord } from '../../types/domain';
import { readPlannerDraft } from '../../hooks/usePlanner';
import { isPast } from '../../utils/dates';
import { btn, cx } from '../../utils/styles';

/** Plan-tab entry to the AI Planner. One line, one action; copy follows the event's planner state. */
export function PlannerCard({ event }: {event: EventRecord;}) {
  if (event.status === 'cancelled' || event.status === 'archived' || isPast(event.endsAt)) return null;
  const { pending, applied } = readPlannerDraft(event.id);
  const base = `/app/plan/${event.id}`;
  const s = pending ?
  { title: 'Suggestions waiting', body: 'Your AI plan hasn’t been added yet.', cta: 'Review suggestions', to: base } :
  applied ?
  { title: 'Plan added', body: 'Changed the date, guests or budget? Fill the gaps.', cta: 'Improve my plan', to: base } :
  { title: 'Get a starting plan', body: 'Checklist, budget split and vendors — drafted from your event details.', cta: 'Plan with AI', to: `${base}?mode=new` };

  return (
    <section aria-labelledby="planner-card" className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime"><Sparkles className="h-4 w-4 text-ink" aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 id="planner-card" className="text-sm font-semibold text-ink">{s.title}</h2>
          <p className="text-sm text-smoke">{s.body}</p>
        </div>
      </div>
      <Link to={s.to} className={cx(btn.base, pending ? btn.ink : btn.outline, btn.sm, 'shrink-0 self-start sm:self-auto')}>
        {s.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>);

}