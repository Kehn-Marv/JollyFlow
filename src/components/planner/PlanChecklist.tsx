import React, { useState } from 'react';
import { ChevronDown, Info, X } from 'lucide-react';
import type { Collaborator } from '../../types/domain';
import type { PlanStage, PlanTask } from '../../types/planner';
import { todayLagos } from '../../utils/planner/lagosDates';
import { cx } from '../../utils/styles';

const STAGES: Array<{id: PlanStage;label: string;}> = [
{ id: 'early', label: 'Early planning' },
{ id: 'closer', label: 'Closer to the date' },
{ id: 'week', label: 'Event week' }];


const relative = (days: number) => days >= 14 ? `${Math.round(days / 7)} wks before` : days >= 2 ? `${days} days before` : 'Day before';
const chip = 'h-6 rounded-full border border-transparent bg-paper px-2 text-[11px] text-smoke hover:border-line focus:border-ink focus:outline-none';

interface Props {
  tasks: PlanTask[];
  collaborators: Collaborator[];
  onUpdate: (key: string, next: Partial<PlanTask>, isEdit?: boolean) => void;
  onRemove: (key: string) => void;
}

export function PlanChecklist({ tasks, collaborators, onUpdate, onRemove }: Props) {
  const [closed, setClosed] = useState<Set<PlanStage>>(new Set());
  const [why, setWhy] = useState<string | null>(null);
  const picked = tasks.filter((t) => t.selected).length;
  const today = todayLagos();

  return (
    <section aria-labelledby="pl-checklist" className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="pl-checklist" className="text-[15px] font-medium text-ink">Checklist</h2>
        <p className="text-xs tabular-nums text-smoke">{picked}/{tasks.length}</p>
      </div>
      {!tasks.length && <p className="mt-3 text-sm text-smoke">Nothing to add — your plan already covers it.</p>}

      {STAGES.map((stage) => {
        const group = tasks.filter((t) => t.stage === stage.id);
        if (!group.length) return null;
        const open = !closed.has(stage.id);
        return (
          <div key={stage.id} className="mt-5">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setClosed((s) => {const n = new Set(s);if (n.has(stage.id)) n.delete(stage.id);else n.add(stage.id);return n;})}
              className="flex w-full items-center gap-2 text-left text-[12px] font-medium text-smoke transition hover:text-ink">
              
              {stage.label}
              <span className="rounded-full bg-paper px-1.5 text-[11px] tabular-nums">{group.length}</span>
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
              <ChevronDown className={cx('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')} aria-hidden="true" />
            </button>
            {open &&
            <ul className="mt-1">
                {group.map((t) =>
              <li key={t.key} className={cx('group -mx-2 rounded-xl px-2 py-2 transition hover:bg-paper/60', !t.selected && 'opacity-50')}>
                    <div className="flex items-center gap-2.5">
                      <input type="checkbox" checked={t.selected} onChange={(e) => onUpdate(t.key, { selected: e.target.checked }, false)} aria-label={`Include ${t.title}`} className="h-4 w-4 shrink-0 accent-ink" />
                      <input
                    value={t.title}
                    maxLength={140}
                    onChange={(e) => onUpdate(t.key, { title: e.target.value })}
                    aria-label="Task title"
                    className="min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm text-ink hover:border-line focus:border-ink focus:bg-white focus:outline-none" />
                  
                      {t.isNew && <span className="shrink-0 rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-semibold text-ink">New</span>}
                      <button type="button" onClick={() => setWhy(why === t.key ? null : t.key)} aria-expanded={why === t.key} aria-label={`Why: ${t.title}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-smoke/70 transition hover:bg-white hover:text-ink">
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => onRemove(t.key)} aria-label={`Remove ${t.title}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-smoke/70 transition hover:bg-white hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100">
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="ml-[1.625rem] mt-1 flex flex-wrap items-center gap-1">
                      <span className="inline-flex h-6 items-center rounded-full bg-paper px-2 text-[11px] text-smoke">{t.category}</span>
                      {t.dueDate ?
                  <input type="date" min={today} value={t.dueDate} onChange={(e) => e.target.value && onUpdate(t.key, { dueDate: e.target.value })} aria-label="Due date" className={chip} /> :

                  <span className="inline-flex h-6 items-center rounded-full bg-paper px-2 text-[11px] text-smoke">{relative(t.offsetDays)}</span>
                  }
                      {collaborators.length > 0 &&
                  <select value={t.assigneeId ?? ''} onChange={(e) => onUpdate(t.key, { assigneeId: e.target.value || null })} aria-label="Assign to" className={chip}>
                          <option value="">Unassigned</option>
                          {collaborators.map((c) => <option key={c.id} value={c.id}>{c.name.split(' ')[0]}{c.isYou ? ' (you)' : ''}</option>)}
                        </select>
                  }
                      {t.duplicateOf && <span className="inline-flex h-6 items-center rounded-full bg-coral/10 px-2 text-[11px] font-medium text-coral">Already planned</span>}
                    </div>
                    {why === t.key &&
                <p className="ml-[1.625rem] mt-1.5 text-xs text-smoke">
                        {t.why}{t.duplicateOf && ` Matches “${t.duplicateOf}”.`}
                      </p>
                }
                  </li>
              )}
              </ul>
            }
          </div>);

      })}
    </section>);

}