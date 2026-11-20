import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarX2, Pencil, RefreshCw, RotateCcw, Sparkles, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import type { EventRecord } from '../../types/domain';
import { useDb } from '../../contexts/DataContext';
import { usePlanner } from '../../hooks/usePlanner';
import { BriefStep } from '../../components/planner/BriefStep';
import { GeneratingStep } from '../../components/planner/GeneratingStep';
import { PlanChecklist } from '../../components/planner/PlanChecklist';
import { PlanBudget } from '../../components/planner/PlanBudget';
import { PlanVendors, PlanWatchouts } from '../../components/planner/PlanExtras';
import { ApplySheet } from '../../components/planner/ApplySheet';
import { PlanDone } from '../../components/planner/PlanDone';
import { EmptyState } from '../../components/ui/EmptyState';
import { DemoTag } from '../../components/ui/DemoTag';
import { Button } from '../../components/ui/Button';
import { EVENT_TYPE_LABELS } from '../../utils/events';
import { formatNairaCompact } from '../../utils/money';
import { isPast } from '../../utils/dates';
import { fmtMonth, fmtPlanDate } from '../../utils/planner/lagosDates';
import { btn, cx } from '../../utils/styles';

/** AI Planner — turns an event brief into an editable starting plan. Works for a new or an existing event. */
export function Planner() {
  const { eventId } = useParams();
  const db = useDb();
  const event = eventId ? db.events.find((e) => e.id === eventId && e.managed) ?? null : null;

  if (eventId && !event) {
    return <EmptyState icon={CalendarX2} title="Event not found" message="It may have been deleted, or you no longer have access." action={<Link to="/app/plan" className={cx(btn.base, btn.ink, btn.md)}>Plan a new event</Link>} />;
  }
  if (event && (event.status === 'cancelled' || event.status === 'archived' || isPast(event.endsAt))) {
    return (
      <EmptyState
        icon={CalendarX2}
        title={event.status === 'cancelled' ? 'This event is cancelled' : event.status === 'archived' ? 'This event is archived' : 'This event has ended'}
        message="The planner works on upcoming events. Nothing here was changed."
        action={<Link to={`/app/events/${event.id}`} className={cx(btn.base, btn.ink, btn.md)}>Back to event</Link>} />);


  }
  return <PlannerFlow key={event?.id ?? 'new'} event={event} />;
}

function PlannerFlow({ event }: {event: EventRecord | null;}) {
  const db = useDb();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const s = usePlanner(event, db, params.get('mode') === 'new');
  const [applyOpen, setApplyOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const collaborators = event ? db.collaborators.filter((c) => c.eventId === event.id) : [];
  const back = event ? `/app/events/${event.id}` : '/app';
  const others = db.events.filter((e) => e.managed && e.status !== 'cancelled' && e.status !== 'archived' && !isPast(e.endsAt));

  useEffect(() => {
    if (params.get('mode')) {
      const p = new URLSearchParams(params);
      p.delete('mode');
      setParams(p, { replace: true });
    }
    // Run once: the mode flag only decides whether to start fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    top.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    if (s.step !== 'plan') setApplyOpen(false);
  }, [s.step]);

  const picked = s.plan ? s.plan.tasks.filter((t) => t.selected).length : 0;
  const lines = s.plan ? s.plan.budget.filter((b) => b.selected && !b.existing).length : 0;
  const b = s.plan?.brief;

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <div ref={top} tabIndex={-1} className="outline-none">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <Link to={back} aria-label={event ? 'Back to event' : 'Back to My Events'} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-ink/30">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1 text-[12px] text-smoke"><Sparkles className="h-3 w-3" aria-hidden="true" /> AI Planner</p>
              <h1 className="truncate text-[22px] font-medium leading-tight tracking-[-0.015em] text-ink sm:text-[26px]">{event ? event.title : 'Plan with JolliFlow'}</h1>
            </div>
          </div>
          {s.step === 'brief' && !event && others.length > 0 &&
          <label className="flex items-center gap-2 text-sm text-smoke">
              <span className="whitespace-nowrap">Or plan</span>
              <select defaultValue="" onChange={(e) => e.target.value && navigate(`/app/plan/${e.target.value}`)} className="h-9 max-w-[14rem] rounded-full border border-line bg-white px-3 text-sm text-ink">
                <option value="">an existing event…</option>
                {others.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </label>
          }
        </header>
      </div>

      {s.error && !applyOpen && s.step !== 'generating' &&
      <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="flex-1">{s.error.message}</span>
          {s.error.code !== 'forbidden' &&
        <button type="button" onClick={s.generate} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Try again</button>
        }
        </div>
      }

      <div className="mt-6">
        {s.step === 'brief' &&
        <div className="mx-auto max-w-2xl">
            <BriefStep brief={s.brief} forEvent={event?.id ?? null} onChange={s.updateBrief} onSubmit={s.generate} onCancel={() => s.plan && !s.alreadyApplied ? s.setStep('plan') : navigate(back)} />
          </div>
        }
        {s.step === 'generating' && <GeneratingStep onCancel={s.cancel} />}
        {s.step === 'done' && s.outcome && <PlanDone outcome={s.outcome} />}

        {s.step === 'plan' && s.plan && b &&
        <>
            <section aria-label="Your brief" className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-3 lg:flex-row lg:items-center">
              <p className="min-w-0 flex-1 text-sm text-ink">
                {[EVENT_TYPE_LABELS[b.type], b.city, `${b.guests.toLocaleString()} guests`, `${formatNairaCompact(s.plan.workingBudget)}${s.plan.budgetSuggested ? ' (suggested)' : ''}`, b.date ? fmtPlanDate(b.date) : b.month ? fmtMonth(b.month) : 'Date TBC'].map((x, i) =>
              <React.Fragment key={x}>{i > 0 && <span className="mx-1.5 text-smoke/50" aria-hidden="true">·</span>}<span className={i === 0 ? 'font-medium' : 'text-smoke'}>{x}</span></React.Fragment>
              )}
                {s.plan.assumptions.length > 0 &&
              <span title={s.plan.assumptions.join('\n')} className="ml-2 inline-flex cursor-help items-center rounded-full bg-paper px-2 py-0.5 align-middle text-[11px] text-smoke">
                    {s.plan.assumptions.length} assumption{s.plan.assumptions.length === 1 ? '' : 's'}
                  </span>
              }
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <DemoTag className="mr-1">Demo</DemoTag>
                <button type="button" onClick={() => s.setStep('brief')} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink transition hover:bg-paper"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit</button>
                <button type="button" onClick={s.generate} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink transition hover:bg-paper"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Regenerate</button>
                <button type="button" onClick={() => toast('Thanks — we’ll use this to improve suggestions.')} aria-label="Not helpful" title="Not helpful" className="grid h-8 w-8 place-items-center rounded-full text-smoke transition hover:bg-paper hover:text-ink"><ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
              </div>
            </section>
            {s.plan.assumptions.length > 0 &&
          <p className="mt-2 px-1 text-xs text-smoke lg:hidden">{s.plan.assumptions[0]}</p>
          }

            <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <PlanChecklist tasks={s.plan.tasks} collaborators={collaborators} onUpdate={s.updateTask} onRemove={s.removeTask} />
              <div className="space-y-4">
                <PlanBudget lines={s.plan.budget} workingBudget={s.plan.workingBudget} budgetSuggested={s.plan.budgetSuggested} tight={s.plan.tight} onUpdate={s.updateLine} />
                <PlanWatchouts items={s.plan.watch} />
                <PlanVendors vendors={s.plan.vendors} city={b.city} />
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-smoke">
              Want a clean slate?{' '}
              <button type="button" onClick={s.startOver} className="font-medium text-ink underline underline-offset-4">Start a new plan</button>
            </p>

            <div className="sticky bottom-4 z-20 mt-6">
              <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full border border-line bg-white/95 py-2 pl-5 pr-2 shadow-lg shadow-ink/5 backdrop-blur">
                <p className="truncate text-sm text-smoke">
                  <span className="font-semibold tabular-nums text-ink">{picked}</span> tasks · <span className="font-semibold tabular-nums text-ink">{lines}</span> budget
                </p>
                <div className="flex shrink-0 gap-1.5">
                  <Button type="button" onClick={() => {toast.success('Plan saved. Pick it up any time.');navigate(back);}} className={cx(btn.base, btn.ghost, btn.sm, 'hidden sm:inline-flex')}>Save for later</Button>
                  <Button type="button" disabled={!picked && !lines && !!event || s.applying} onClick={() => {s.setError(null);setApplyOpen(true);}} className={cx(btn.base, btn.ink, btn.sm)}>
                    {event ? 'Add to event' : 'Create event'}
                  </Button>
                </div>
              </div>
            </div>

            <ApplySheet open={applyOpen} onOpenChange={setApplyOpen} plan={s.plan} event={event} applying={s.applying} error={applyOpen ? s.error?.message ?? null : null} onApply={s.apply} />
          </>
        }
      </div>
    </div>);

}