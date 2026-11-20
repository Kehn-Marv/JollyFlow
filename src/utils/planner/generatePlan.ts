import type { GeneratedPlan, PlanBudgetLine, PlanStage, PlanTask, PlannerBrief, PlannerContext, PlanVendor, PlanWatch } from '../../types/planner';
import { CITY_TIER, ESSENTIAL, PLAYBOOKS, TASK_LIBRARY, VENDOR_LIBRARY } from '../../data/plannerPlaybooks';
import { EVENT_TYPE_LABELS } from '../events';
import { formatNairaCompact } from '../money';
import { addDays, daysBetween, todayLagos } from './lagosDates';

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'with', 'your', 'every', 'book', 'confirm', 'plan', 'set', 'up', 'on', 'in', 'all']);
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

/** Fuzzy title match used to avoid suggesting things the organiser already has. */
export function findDuplicate(title: string, existing: string[]): string | null {
  const a = new Set(words(title));
  if (!a.size) return null;
  for (const e of existing) {
    const b = new Set(words(e));
    if (!b.size) continue;
    const shared = [...a].filter((w) => b.has(w)).length;
    if (shared / Math.min(a.size, b.size) >= 0.6) return e;
  }
  return null;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
export const sameCategory = (a: string, b: string) => {
  const x = norm(a);
  const y = norm(b);
  return x === y || x.length > 3 && y.length > 3 && (x.startsWith(y) || y.startsWith(x));
};

const stageFor = (days: number): PlanStage => days >= 45 ? 'early' : days >= 10 ? 'closer' : 'week';
const ROUND = 100_000; // ₦1,000 in kobo

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0;
  return (h >>> 0).toString(36);
}

/** Deterministic demo planner: same brief + same event state → same plan. */
export function generatePlan(brief: PlannerBrief, ctx: PlannerContext, now = new Date()): GeneratedPlan {
  const pb = PLAYBOOKS[brief.type] ?? PLAYBOOKS.custom;
  const label = EVENT_TYPE_LABELS[brief.type]?.toLowerCase() ?? 'event';
  const assumptions: string[] = [];
  const today = todayLagos(now);

  const known = CITY_TIER[brief.city.trim().toLowerCase()];
  const tier = known ?? 1;
  if (!known) assumptions.push(`We don’t have cost levels for ${brief.city || 'this city'} yet — using national averages.`);

  const guests = Math.max(1, Math.round(brief.guests));
  const low = pb.perGuest[0] * tier * 100;
  const high = pb.perGuest[1] * tier * 100;
  const budgetSuggested = brief.budget === null;
  const workingBudget = brief.budget ?? Math.max(ROUND * 50, Math.round(guests * (low + high) / 2 / (ROUND * 50)) * ROUND * 50);
  if (budgetSuggested) assumptions.push(`No budget yet — we suggested ${formatNairaCompact(workingBudget)} to start. Change it any time.`);

  const perGuest = workingBudget / guests;
  const tight = !budgetSuggested && perGuest < low * 0.7 ? `${formatNairaCompact(perGuest)} per guest is tight — a ${label} usually runs ${formatNairaCompact(low)}–${formatNairaCompact(high)}.` : null;

  // Timing
  const anchor = brief.date ?? (brief.month ? `${brief.month}-15` : null);
  const daysLeft = anchor ? daysBetween(today, anchor) : null;
  if (!brief.date) assumptions.push(brief.month ? 'No exact date yet — due dates assume mid-month.' : 'No date yet — timings are shown as time before the event.');
  if (daysLeft !== null && daysLeft <= 14) assumptions.push(daysLeft <= 0 ? 'The event is today — only last-minute tasks are kept.' : `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} to go — the plan focuses on what still matters.`);
  if (daysLeft !== null && daysLeft > 365) assumptions.push('Over a year away — lock in venue and budget first; the rest can wait.');
  if (guests >= 2000) assumptions.push('Very large crowd — production and security need specialist quotes.');

  const booked = new Set(brief.booked);
  let bump = 0;
  const tasks: PlanTask[] = pb.tasks.
  filter((k) => TASK_LIBRARY[k]).
  filter((k) => {
    const svc = TASK_LIBRARY[k][4];
    if (svc && booked.has(svc)) return false;
    if (k === 'venue' && brief.eventId && ctx.venueConfirmed) return false;
    if (daysLeft !== null && daysLeft <= 14 && TASK_LIBRARY[k][3] > 30 && !ESSENTIAL.has(k)) return false;
    return true;
  }).
  slice(0, 14).
  map((k) => {
    const [title0, why, category, offset] = TASK_LIBRARY[k];
    const title = k === 'venue' ? `Shortlist and visit venues for ${guests} guests` : title0;
    let dueDate: string | null = null;
    if (anchor) {
      dueDate = addDays(anchor, -offset);
      if (dueDate < today) dueDate = addDays(today, Math.min(bump++ % 4, Math.max(0, daysLeft ?? 0)));
    }
    const duplicateOf = findDuplicate(title, ctx.existingTaskTitles);
    return { key: k, title, why, category, stage: stageFor(offset), offsetDays: offset, dueDate, assigneeId: null, selected: !duplicateOf, duplicateOf };
  });

  // Budget: rounded to ₦1,000; contingency (last line) absorbs rounding so lines always sum to the budget.
  const flex = brief.notes.toLowerCase().includes('strict') ? 2 : 0;
  const lines = pb.budget.map(([name, pct, why], i) => ({ name, pct: i === pb.budget.length - 1 ? pct + flex : pct, why }));
  const pctTotal = lines.reduce((s, l) => s + l.pct, 0);
  const budget: PlanBudgetLine[] = lines.map((l, i) => {
    const amount = Math.round(workingBudget * l.pct / pctTotal / ROUND) * ROUND;
    const existing = ctx.existingCategoryNames.some((n) => sameCategory(n, l.name));
    return { key: `b${i}`, name: l.name, amount, why: `${l.why}. About ${Math.round(l.pct / pctTotal * 100)}% for a ${label}${known ? ` in ${brief.city}` : ''}.`, selected: !existing, existing };
  });
  const drift = workingBudget - budget.reduce((s, l) => s + l.amount, 0);
  budget[budget.length - 1].amount = Math.max(0, budget[budget.length - 1].amount + drift);

  const bookedCats = new Set(ctx.bookedVendorCategories);
  const vendors: PlanVendor[] = pb.vendors.
  filter((k) => VENDOR_LIBRARY[k]).
  map((k) => {
    const [vLabel, category, lookFor] = VENDOR_LIBRARY[k];
    return { key: k, label: vLabel, category, lookFor, booked: booked.has(k) || (category ? bookedCats.has(category) : false) };
  });

  const base = brief.eventId ? `/app/events/${brief.eventId}` : null;
  const watch: PlanWatch[] = [];
  if (tight) watch.push({ id: 'tight', tone: 'urgent', title: 'Budget is tight for this headcount', reason: 'Trim the guest list, drop a service or raise the budget.', to: '#budget', action: 'Adjust amounts' });
  if (base && !ctx.venueConfirmed) watch.push({ id: 'venue', tone: daysLeft !== null && daysLeft < 45 ? 'urgent' : 'note', title: 'Venue isn’t confirmed', reason: 'Most other bookings depend on it.', to: `${base}/vendors`, action: 'Open vendors' });
  if (base && !ctx.budgetSet) watch.push({ id: 'budget', tone: 'note', title: 'No event budget set', reason: 'Adding this plan’s budget makes tracking easier.', to: `${base}/budget`, action: 'Open budget' });
  if (base && daysLeft !== null && daysLeft <= 21 && ctx.openTasks > 3) watch.push({ id: 'soon', tone: 'urgent', title: `${ctx.openTasks} tasks open with ${Math.max(0, daysLeft)} days to go`, reason: 'Clear or delegate the oldest first.', to: base, action: 'Open tasks' });
  if (base && ctx.unassignedTasks > 0) watch.push({ id: 'owners', tone: 'note', title: `${ctx.unassignedTasks} task${ctx.unassignedTasks === 1 ? ' has' : 's have'} no owner`, reason: 'Unowned tasks tend to slip.', to: base, action: 'Assign' });
  if (!base && !vendors.some((v) => v.key === 'venue' && v.booked) && daysLeft !== null && daysLeft < 45) watch.push({ id: 'venue-new', tone: 'urgent', title: 'Book the venue first', reason: 'Under 45 days out, good venues go fast.', to: '/app/vendors', action: 'Browse venues' });

  return {
    id: `plan_${hash(JSON.stringify(brief) + ctx.existingTaskTitles.length + ctx.existingCategoryNames.join('|'))}`,
    source: 'demo',
    generatedAt: now.toISOString(),
    brief,
    workingBudget,
    budgetSuggested,
    assumptions,
    tight,
    tasks,
    budget,
    vendors,
    watch: watch.slice(0, 4)
  };
}

/** Schema check for anything a planner returns (demo or a future live model). Throws on bad output. */
export function validatePlan(p: unknown): GeneratedPlan {
  const plan = p as GeneratedPlan;
  const ok =
  !!plan &&
  typeof plan.id === 'string' &&
  Number.isFinite(plan.workingBudget) &&
  plan.workingBudget >= 0 &&
  Array.isArray(plan.tasks) &&
  Array.isArray(plan.budget) &&
  Array.isArray(plan.vendors) &&
  Array.isArray(plan.watch) &&
  plan.tasks.every((t) => typeof t.title === 'string' && t.title.trim().length > 0 && ['early', 'closer', 'week'].includes(t.stage)) &&
  plan.budget.every((b) => typeof b.name === 'string' && b.name.trim().length > 0 && Number.isFinite(b.amount) && b.amount >= 0);
  if (!ok) throw new Error('invalid');
  return {
    ...plan,
    tasks: plan.tasks.slice(0, 20).map((t) => ({ ...t, title: t.title.trim().slice(0, 140), why: String(t.why ?? '').slice(0, 200) })),
    budget: plan.budget.slice(0, 12).map((b) => ({ ...b, name: b.name.trim().slice(0, 60), amount: Math.round(b.amount) }))
  };
}