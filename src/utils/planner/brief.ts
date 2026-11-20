import type { DemoDatabase, EventRecord, EventType } from '../../types/domain';
import type { GeneratedPlan, PlannerBrief, PlannerContext } from '../../types/planner';
import { parseNairaInput } from '../money';
import { daysBetween, lagosDateOf, todayLagos } from './lagosDates';

/** Editable form state for the brief (strings, so inputs can be mid-edit). */
export interface BriefDraft {
  text: string;
  type: EventType | null;
  city: string;
  date: string;
  month: string;
  guests: string;
  budget: string;
  budgetUnknown: boolean;
  booked: string[];
  notes: string;
}

export type BriefField = 'type' | 'city' | 'date' | 'guests' | 'budget';

export function emptyBrief(): BriefDraft {
  return { text: '', type: null, city: '', date: '', month: '', guests: '', budget: '', budgetUnknown: false, booked: [], notes: '' };
}

export function briefFromEvent(event: EventRecord, db: DemoDatabase): BriefDraft {
  const guests = db.guests.filter((g) => g.eventId === event.id).length;
  const venueish = event.venue.trim() && !/^tbc|^tba|^to be/i.test(event.venue.trim());
  const bookedCats = new Set(
    db.bookings.
    filter((b) => b.eventId === event.id && b.status === 'confirmed').
    map((b) => db.vendors.find((v) => v.id === b.vendorId)?.category).
    filter(Boolean) as string[]
  );
  const booked = ['venue', 'catering', 'decor', 'photography', 'entertainment', 'audiovisual', 'cake', 'beauty', 'rentals'].filter((k) => bookedCats.has(k) || k === 'venue' && venueish);
  return {
    ...emptyBrief(),
    type: event.type,
    city: event.city,
    date: lagosDateOf(event.startsAt),
    guests: String(event.capacity ?? (guests || 100)),
    budget: event.budgetTotal ? String(Math.round(event.budgetTotal / 100)) : '',
    budgetUnknown: !event.budgetTotal,
    booked
  };
}

export function validateBrief(d: BriefDraft, now = new Date()): Partial<Record<BriefField, string>> {
  const e: Partial<Record<BriefField, string>> = {};
  if (!d.type) e.type = 'Pick the kind of event.';
  if (!d.city.trim()) e.city = 'Add a city — any Nigerian city works.';else
  if (d.city.trim().length > 40) e.city = 'Keep the city short.';
  if (d.date && daysBetween(todayLagos(now), d.date) < 0) e.date = 'That date has passed.';
  const g = Number(d.guests);
  if (!d.guests.trim() || !Number.isInteger(g) || g < 1 || g > 100_000) e.guests = 'Enter a number between 1 and 100,000.';
  if (!d.budgetUnknown) {
    const k = parseNairaInput(d.budget);
    if (!d.budget.trim()) e.budget = 'Add a budget, or tick “Not decided”.';else
    if (k === null || k <= 0) e.budget = 'Enter an amount like 5000000.';
  }
  return e;
}

export function toPlannerBrief(d: BriefDraft, eventId: string | null): PlannerBrief {
  return {
    eventId,
    type: d.type ?? 'custom',
    city: d.city.trim(),
    date: d.date || null,
    month: d.date ? null : d.month || null,
    guests: Math.round(Number(d.guests)),
    budget: d.budgetUnknown ? null : parseNairaInput(d.budget),
    booked: d.booked,
    notes: d.notes.trim().slice(0, 300)
  };
}

/** Minimal, non-sensitive context. No guest names/contacts, no transactions. */
export function plannerContext(event: EventRecord | null, db: DemoDatabase): PlannerContext {
  if (!event) return { existingTaskTitles: [], existingCategoryNames: [], bookedVendorCategories: [], venueConfirmed: false, openTasks: 0, unassignedTasks: 0, budgetSet: false };
  const tasks = db.tasks.filter((t) => t.eventId === event.id);
  const open = tasks.filter((t) => t.status !== 'done');
  return {
    existingTaskTitles: tasks.map((t) => t.title),
    existingCategoryNames: db.budgetCategories.filter((c) => c.eventId === event.id).map((c) => c.name),
    bookedVendorCategories: db.bookings.
    filter((b) => b.eventId === event.id && b.status === 'confirmed').
    map((b) => db.vendors.find((v) => v.id === b.vendorId)?.category).
    filter((c): c is NonNullable<typeof c> => !!c),
    venueConfirmed: !!event.venue.trim() && !/^tbc|^tba|^to be/i.test(event.venue.trim()),
    openTasks: open.length,
    unassignedTasks: open.filter((t) => !t.assigneeId).length,
    budgetSet: event.budgetTotal > 0
  };
}

/** Keep the organiser's edits when regenerating; flag genuinely new suggestions. */
export function mergeWithPrevious(next: GeneratedPlan, prev: GeneratedPlan | null): GeneratedPlan {
  if (!prev) return next;
  const pt = new Map(prev.tasks.map((t) => [t.key, t]));
  const pb = new Map(prev.budget.map((b) => [b.name, b]));
  return {
    ...next,
    tasks: next.tasks.map((t) => {
      const o = pt.get(t.key);
      if (!o) return { ...t, isNew: true };
      return o.edited ? { ...t, title: o.title, dueDate: o.dueDate ?? t.dueDate, assigneeId: o.assigneeId, selected: o.selected && !t.duplicateOf, edited: true } : { ...t, assigneeId: o.assigneeId };
    }),
    budget: next.budget.map((b) => {
      const o = pb.get(b.name);
      if (!o) return { ...b, isNew: true };
      return o.edited ? { ...b, amount: o.amount, selected: o.selected && !b.existing, edited: true } : b;
    })
  };
}