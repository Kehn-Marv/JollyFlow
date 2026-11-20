import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { EventRecord } from '../../types/domain';
import type { GeneratedPlan } from '../../types/planner';
import { SidePanel } from '../ui/SidePanel';
import { Button } from '../ui/Button';
import { FormField, fieldA11y } from '../ui/FormField';
import { EVENT_TYPE_LABELS } from '../../utils/events';
import { formatNaira } from '../../utils/money';
import { addDays, todayLagos } from '../../utils/planner/lagosDates';
import { btn, cx, inputClass } from '../../utils/styles';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan: GeneratedPlan;
  event: EventRecord | null;
  applying: boolean;
  error: string | null;
  onApply: (newEvent?: {title: string;date: string;}) => void;
}

export function ApplySheet({ open, onOpenChange, plan, event, applying, error, onApply }: Props) {
  const tasks = plan.tasks.filter((t) => t.selected && t.title.trim());
  const lines = plan.budget.filter((b) => b.selected && !b.existing);
  const today = todayLagos();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [err, setErr] = useState<{title?: string;date?: string;}>({});

  useEffect(() => {
    if (!open || event) return;
    setTitle((t) => t || `${EVENT_TYPE_LABELS[plan.brief.type]}${plan.brief.city ? ` · ${plan.brief.city}` : ''}`);
    setDate((d) => d || plan.brief.date || (plan.brief.month ? `${plan.brief.month}-15` < today ? addDays(today, 30) : `${plan.brief.month}-15` : ''));
  }, [open, event, plan.brief, today]);

  function submit() {
    if (event) return onApply();
    const e: typeof err = {};
    if (title.trim().length < 3) e.title = 'Give it a name (3+ characters).';
    if (!date) e.date = 'Pick a date — you can change it later.';else
    if (date < today) e.date = 'That date has passed.';
    setErr(e);
    if (!Object.keys(e).length) onApply({ title, date });
  }

  return (
    <SidePanel
      open={open}
      onOpenChange={(o) => !applying && onOpenChange(o)}
      title={event ? 'Add to your event' : 'Create your event'}
      description={event ? event.title : 'Saved as a private draft. Nothing is published.'}
      footer={
      <div className="flex gap-2 p-4">
          <Button type="button" disabled={applying} onClick={() => onOpenChange(false)} className={cx(btn.base, btn.ghost, btn.md, 'flex-1')}>Back</Button>
          <Button type="button" disabled={applying || !tasks.length && !lines.length && !!event} aria-busy={applying} onClick={submit} className={cx(btn.base, btn.ink, btn.md, 'flex-[2]')}>
            {applying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {applying ? 'Adding…' : event ? 'Add to event' : 'Create event'}
          </Button>
        </div>
      }>
      
      <div className="space-y-6 p-6">
        {error && <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

        {!event &&
        <div className="space-y-4">
            <FormField label="Event name" htmlFor="ap-title" error={err.title}>
              <input {...fieldA11y('ap-title', err.title)} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Date" htmlFor="ap-date" error={err.date}>
              <input {...fieldA11y('ap-date', err.date)} type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </FormField>
          </div>
        }

        <div>
          <h3 className="flex items-baseline justify-between text-sm font-semibold text-ink">Tasks <span className="font-normal tabular-nums text-smoke">{tasks.length}</span></h3>
          <ul className="mt-2 space-y-1.5 text-sm text-smoke">
            {tasks.slice(0, 6).map((t) => <li key={t.key} className="truncate">{t.title}</li>)}
            {tasks.length > 6 && <li>+ {tasks.length - 6} more</li>}
            {!tasks.length && <li>None selected</li>}
          </ul>
        </div>

        <div>
          <h3 className="flex items-baseline justify-between text-sm font-semibold text-ink">Budget categories <span className="font-normal tabular-nums text-smoke">{lines.length}</span></h3>
          <ul className="mt-2 space-y-1.5 text-sm text-smoke">
            {lines.map((b) => <li key={b.key} className="flex justify-between gap-3"><span className="truncate">{b.name}</span><span className="tabular-nums">{formatNaira(b.amount)}</span></li>)}
            {!lines.length && <li>None selected</li>}
          </ul>
        </div>

        <p className="flex gap-2 text-xs text-smoke">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          Only these are added. Nothing is booked, paid, sent or published.
        </p>
      </div>
    </SidePanel>);

}