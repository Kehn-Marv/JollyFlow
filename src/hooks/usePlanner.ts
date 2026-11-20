import { useCallback, useEffect, useRef, useState } from 'react';
import type { DemoDatabase, EventRecord } from '../types/domain';
import { PlannerError, type GeneratedPlan, type PlanBudgetLine, type PlanTask } from '../types/planner';
import { planner, service } from '../services';
import { briefFromEvent, emptyBrief, mergeWithPrevious, plannerContext, toPlannerBrief, type BriefDraft } from '../utils/planner/brief';
import { defaultFeaturesFor, coverFor } from '../utils/wizard';
import { combineDateTime } from '../utils/dates';
import { lagosNoonIso } from '../utils/planner/lagosDates';

export type PlannerStep = 'brief' | 'generating' | 'plan' | 'done';

export interface ApplyOutcome {
  eventId: string;
  tasks: number;
  categories: number;
  createdEvent: boolean;
  already: boolean;
}

interface Saved {
  brief: BriefDraft;
  plan: GeneratedPlan | null;
  /** Plan id that has been fully applied. */
  appliedPlanId: string | null;
  /** Items already created for the current plan — lets a failed apply resume without duplicates. */
  doneKeys: string[];
  createdEventId: string | null;
}

const storeKey = (scope: string) => `jolliflow.planner.v1.${scope}`;

function load(scope: string): Saved | null {
  try {
    const raw = localStorage.getItem(storeKey(scope));
    return raw ? JSON.parse(raw) as Saved : null;
  } catch {
    return null;
  }
}

export function readPlannerDraft(eventId: string): {pending: boolean;applied: boolean;} {
  const s = load(eventId);
  return { pending: !!s?.plan && s.appliedPlanId !== s.plan.id, applied: !!s?.appliedPlanId };
}

export function usePlanner(event: EventRecord | null, db: DemoDatabase, fresh: boolean) {
  const scope = event?.id ?? 'new';
  const [saved, setSaved] = useState<Saved>(() => {
    const s = fresh ? null : load(scope);
    const base = event ? briefFromEvent(event, db) : emptyBrief();
    return s ? { ...s, brief: { ...base, ...s.brief } } : { brief: base, plan: null, appliedPlanId: null, doneKeys: [], createdEventId: null };
  });
  const [step, setStep] = useState<PlannerStep>(() => saved.plan && saved.appliedPlanId !== saved.plan.id ? 'plan' : 'brief');
  const [error, setError] = useState<PlannerError | null>(null);
  const [applying, setApplying] = useState(false);
  const [outcome, setOutcome] = useState<ApplyOutcome | null>(null);
  const run = useRef(0);
  const applyLock = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(storeKey(scope), JSON.stringify(saved));
    } catch {

      /* storage full or blocked — the session still works */}
  }, [saved, scope]);

  const patch = useCallback((next: Partial<Saved>) => setSaved((s) => ({ ...s, ...next })), []);
  const updateBrief = useCallback((next: Partial<BriefDraft>) => setSaved((s) => ({ ...s, brief: { ...s.brief, ...next } })), []);

  const generate = useCallback(async () => {
    const id = ++run.current;
    setError(null);
    setStep('generating');
    try {
      const brief = toPlannerBrief(saved.brief, event?.id ?? null);
      const fresh = await planner.generatePlan(brief, plannerContext(event, db));
      if (id !== run.current) return; // cancelled or superseded
      setSaved((s) => ({ ...s, plan: mergeWithPrevious(fresh, s.appliedPlanId === s.plan?.id ? null : s.plan), doneKeys: [], appliedPlanId: s.appliedPlanId }));
      setStep('plan');
    } catch (err) {
      if (id !== run.current) return;
      setError(err instanceof PlannerError ? err : new PlannerError('network'));
      setStep(saved.plan ? 'plan' : 'brief');
    }
  }, [db, event, saved.brief, saved.plan]);

  const cancel = useCallback(() => {
    run.current++;
    setStep(saved.plan ? 'plan' : 'brief');
  }, [saved.plan]);

  const editPlan = useCallback((fn: (p: GeneratedPlan) => GeneratedPlan) => setSaved((s) => s.plan ? { ...s, plan: fn(s.plan) } : s), []);
  const updateTask = useCallback(
    (key: string, next: Partial<PlanTask>, isEdit = true) => editPlan((p) => ({ ...p, tasks: p.tasks.map((t) => t.key === key ? { ...t, ...next, edited: t.edited || isEdit } : t) })),
    [editPlan]
  );
  const removeTask = useCallback((key: string) => editPlan((p) => ({ ...p, tasks: p.tasks.filter((t) => t.key !== key) })), [editPlan]);
  const updateLine = useCallback(
    (key: string, next: Partial<PlanBudgetLine>, isEdit = true) => editPlan((p) => ({ ...p, budget: p.budget.map((b) => b.key === key ? { ...b, ...next, edited: b.edited || isEdit } : b) })),
    [editPlan]
  );

  const startOver = useCallback(() => {
    run.current++;
    setError(null);
    setOutcome(null);
    setSaved({ brief: event ? briefFromEvent(event, db) : emptyBrief(), plan: null, appliedPlanId: null, doneKeys: [], createdEventId: null });
    setStep('brief');
  }, [db, event]);

  /** Creates only what the organiser selected. Safe to call twice; resumes after a partial failure. */
  const apply = useCallback(
    async (newEvent?: {title: string;date: string;}) => {
      const plan = saved.plan;
      if (!plan || applyLock.current) return;
      if (saved.appliedPlanId === plan.id) {
        setOutcome({ eventId: event?.id ?? saved.createdEventId ?? '', tasks: 0, categories: 0, createdEvent: false, already: true });
        setStep('done');
        return;
      }
      applyLock.current = true;
      setApplying(true);
      setError(null);
      const done = new Set(saved.doneKeys);
      const mark = (k: string) => {
        done.add(k);
        setSaved((s) => ({ ...s, doneKeys: [...done] }));
      };
      let tasks = 0;
      let categories = 0;
      let createdEvent = false;
      try {
        const tasksToAdd = plan.tasks.filter((t) => t.selected && t.title.trim());
        const linesToAdd = plan.budget.filter((b) => b.selected && !b.existing);
        let eventId = event?.id ?? saved.createdEventId;

        if (event) {
          const live = db.events.find((e) => e.id === event.id && e.managed);
          if (!live) throw new PlannerError('forbidden');
        } else if (!eventId) {
          if (!newEvent) throw new PlannerError('invalid', 'Add a name and date for the event.');
          const type = plan.brief.type;
          const created = await service.createEvent({
            title: newEvent.title.trim().slice(0, 80),
            type,
            description: '',
            startsAt: combineDateTime(newEvent.date, '16:00'),
            endsAt: combineDateTime(newEvent.date, '22:00'),
            venue: plan.brief.booked.includes('venue') ? 'Venue booked' : 'TBC',
            city: plan.brief.city,
            address: '',
            coverUrl: coverFor(type),
            visibility: 'private',
            rsvpEnabled: true,
            capacity: plan.brief.guests,
            plusOnesAllowed: true,
            budgetTotal: plan.workingBudget,
            categories: linesToAdd.map((b) => ({ name: b.name, planned: b.amount })),
            collaborators: [],
            features: defaultFeaturesFor(type),
            ticketTier: null,
            publish: false
          });
          eventId = created.id;
          createdEvent = true;
          categories = linesToAdd.length;
          linesToAdd.forEach((b) => done.add(`b:${b.key}`));
          setSaved((s) => ({ ...s, createdEventId: created.id, doneKeys: [...done] }));
        }

        for (const t of tasksToAdd) {
          if (done.has(`t:${t.key}`)) continue;
          await service.createTask({
            eventId: eventId!,
            title: t.title.trim().slice(0, 140),
            details: `${t.why}\n\nFrom your JolliFlow AI plan.`,
            priority: t.stage === 'week' ? 'high' : 'medium',
            assigneeId: t.assigneeId,
            dueDate: t.dueDate ? lagosNoonIso(t.dueDate) : null,
            category: t.category
          });
          mark(`t:${t.key}`);
          tasks++;
        }
        for (const b of linesToAdd) {
          if (done.has(`b:${b.key}`)) continue;
          await service.addBudgetCategory({ eventId: eventId!, name: b.name, planned: b.amount });
          mark(`b:${b.key}`);
          categories++;
        }

        setOutcome({ eventId: eventId!, tasks, categories, createdEvent, already: false });
        if (event) setSaved((s) => ({ ...s, appliedPlanId: plan.id, doneKeys: [] }));else
        {
          // The new event now owns the plan; clear the scratch draft for the next one.
          try {
            localStorage.setItem(storeKey(eventId!), JSON.stringify({ brief: saved.brief, plan, appliedPlanId: plan.id, doneKeys: [], createdEventId: null }));
          } catch {

            /* ignore */}
          setSaved({ brief: emptyBrief(), plan: null, appliedPlanId: null, doneKeys: [], createdEventId: null });
        }
        setStep('done');
      } catch (err) {
        setError(err instanceof PlannerError ? err : new PlannerError('network', 'Couldn’t add everything. Anything already added is kept — try again to finish.'));
      } finally {
        applyLock.current = false;
        setApplying(false);
      }
    },
    [db.events, event, saved]
  );

  return {
    brief: saved.brief,
    plan: saved.plan,
    step,
    error,
    applying,
    outcome,
    alreadyApplied: !!saved.plan && saved.appliedPlanId === saved.plan.id,
    setStep,
    setError,
    patch,
    updateBrief,
    generate,
    cancel,
    updateTask,
    removeTask,
    updateLine,
    startOver,
    apply
  };
}