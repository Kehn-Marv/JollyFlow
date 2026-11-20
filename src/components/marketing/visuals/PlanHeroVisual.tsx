import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDb } from '../../../contexts/DataContext';
import { dueLabel, isPast } from '../../../utils/dates';
import { ProductFrame } from '../ProductFrame';
import { cx } from '../../../utils/styles';

const DAY = 86_400_000;

/** A quiet week strip over the live task list of the demo wedding. */
export function PlanHeroVisual({ eventId = 'e_wedding' }: {eventId?: string;}) {
  const db = useDb();
  const reduce = useReducedMotion();
  const event = db.events.find((e) => e.id === eventId);
  const tasks = db.tasks.filter((t) => t.eventId === eventId);
  const open = tasks.
  filter((t) => t.status !== 'done').
  sort((a, b) => (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9')).
  slice(0, 4);
  const done = tasks.length - tasks.filter((t) => t.status !== 'done').length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const people = db.collaborators.filter((c) => c.eventId === eventId);
  const initials = (id: string | null) => people.find((p) => p.id === id)?.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * DAY));
  const dueOn = (d: Date) => tasks.some((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate).toDateString() === d.toDateString());
  const overdueCount = tasks.filter((t) => t.status !== 'done' && t.dueDate && isPast(t.dueDate)).length;

  if (!event) return null;

  return (
    <ProductFrame>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.14em] text-smoke">This week</p>
            <p className="mt-1 truncate text-[17px] font-medium tracking-[-0.01em] text-ink">{event.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-xs tabular-nums text-smoke">{done}/{tasks.length}</span>
            <span className="h-1 w-14 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
              <span className="block h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
            </span>
          </div>
        </div>

        <ol className="mt-5 grid grid-cols-7 border-y border-line py-3" aria-label="This week">
          {week.map((d, i) => {
            const isToday = i === 0;
            return (
              <li key={d.toISOString()} className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase text-smoke">{d.toLocaleDateString('en-NG', { weekday: 'narrow' })}</span>
                <span className={cx('grid h-7 w-7 place-items-center rounded-full text-[13px] tabular-nums', isToday ? 'bg-ink font-medium text-white' : 'text-ink')}>{d.getDate()}</span>
                <span className={cx('h-1 w-1 rounded-full', dueOn(d) ? 'bg-coral' : 'bg-transparent')} aria-hidden="true" />
              </li>);

          })}
        </ol>

        <ul className="mt-2">
          {open.map((t, i) => {
            const overdue = t.dueDate ? isPast(t.dueDate) : false;
            return (
              <motion.li
                key={t.id}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.35, ease: 'easeOut' }}
                className="flex items-center gap-3 py-2.5">
                
                <span className="h-[15px] w-[15px] shrink-0 rounded-full border border-ink/25" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{t.title}</span>
                {initials(t.assigneeId) &&
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sand text-[9px] font-medium text-ink" aria-hidden="true">
                    {initials(t.assigneeId)}
                  </span>
                }
                {t.dueDate && <span className={cx('w-16 shrink-0 text-right text-[11px] tabular-nums', overdue ? 'text-coral' : 'text-smoke')}>{overdue ? 'Overdue' : dueLabel(t.dueDate)}</span>}
              </motion.li>);

          })}
        </ul>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px] text-smoke">
          <span className="flex items-center gap-2">
            <span className="flex -space-x-1.5" aria-hidden="true">
              {people.slice(0, 4).map((p) =>
              <span key={p.id} className="grid h-5 w-5 place-items-center rounded-full border border-white bg-sand text-[8px] font-medium text-ink">{p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
              )}
            </span>
            {people.length} on this plan
          </span>
          {overdueCount > 0 && <span className="text-coral">{overdueCount} overdue</span>}
        </div>
      </div>
      <p className="sr-only">Live sample data from the demo wedding plan.</p>
    </ProductFrame>);

}