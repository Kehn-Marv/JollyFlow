import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { ApplyOutcome } from '../../hooks/usePlanner';
import { btn, cx } from '../../utils/styles';

export function PlanDone({ outcome }: {outcome: ApplyOutcome;}) {
  const parts = [
  outcome.tasks > 0 && `${outcome.tasks} task${outcome.tasks === 1 ? '' : 's'}`,
  outcome.categories > 0 && `${outcome.categories} budget categor${outcome.categories === 1 ? 'y' : 'ies'}`].
  filter(Boolean);
  const title = outcome.already ? 'Already added' : outcome.createdEvent ? 'Your event is ready' : 'Your plan is in';
  const body = outcome.already ? 'This plan was added earlier — nothing was duplicated.' : parts.length ? `Added ${parts.join(' and ')}.` : 'Nothing new to add.';

  return (
    <section role="status" className="mx-auto max-w-md rounded-3xl border border-line bg-white p-6 text-center sm:p-8">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lime"><Check className="h-6 w-6 text-ink" aria-hidden="true" /></span>
      <h2 className="mt-4 font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 text-sm text-smoke">{body}{outcome.createdEvent && ' Saved as a private draft.'}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link to={`/app/events/${outcome.eventId}`} className={cx(btn.base, btn.ink, btn.md)}>Open the plan</Link>
        <Link to={`/app/events/${outcome.eventId}/budget`} className={cx(btn.base, btn.outline, btn.md)}>See budget</Link>
      </div>
    </section>);

}