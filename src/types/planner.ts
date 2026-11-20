import type { EventType, ID, Kobo, VendorCategory } from './domain';

/** What the organiser tells the AI planner. Dates are Africa/Lagos calendar dates (YYYY-MM-DD). */
export interface PlannerBrief {
  eventId: ID | null;
  type: EventType;
  city: string;
  /** Exact date, when decided. */
  date: string | null;
  /** Approximate month (YYYY-MM) when the exact date isn't decided. */
  month: string | null;
  guests: number;
  /** null = budget not decided yet; the planner suggests one. */
  budget: Kobo | null;
  /** Vendor service keys the organiser has already arranged. */
  booked: string[];
  notes: string;
}

export type PlanStage = 'early' | 'closer' | 'week';

export interface PlanTask {
  key: string;
  title: string;
  why: string;
  category: string;
  stage: PlanStage;
  /** Days before the event this is best done. */
  offsetDays: number;
  dueDate: string | null;
  assigneeId: ID | null;
  selected: boolean;
  /** Title of a matching task already on the event, if any. */
  duplicateOf: string | null;
  /** Organiser changed it — kept as-is when regenerating. */
  edited?: boolean;
  /** Appeared after regenerating. */
  isNew?: boolean;
}

export interface PlanBudgetLine {
  key: string;
  name: string;
  amount: Kobo;
  why: string;
  selected: boolean;
  /** A category with this name already exists on the event. */
  existing: boolean;
  edited?: boolean;
  isNew?: boolean;
}

export interface PlanVendor {
  key: string;
  label: string;
  category: VendorCategory | null;
  lookFor: string;
  booked: boolean;
}

export interface PlanWatch {
  id: string;
  title: string;
  reason: string;
  to: string;
  action: string;
  tone: 'urgent' | 'note';
}

export interface GeneratedPlan {
  id: string;
  source: 'demo' | 'live';
  generatedAt: string;
  brief: PlannerBrief;
  workingBudget: Kobo;
  budgetSuggested: boolean;
  assumptions: string[];
  tight: string | null;
  tasks: PlanTask[];
  budget: PlanBudgetLine[];
  vendors: PlanVendor[];
  watch: PlanWatch[];
}

/** The minimum, non-sensitive event context the planner is allowed to see. */
export interface PlannerContext {
  existingTaskTitles: string[];
  existingCategoryNames: string[];
  bookedVendorCategories: VendorCategory[];
  venueConfirmed: boolean;
  openTasks: number;
  unassignedTasks: number;
  budgetSet: boolean;
}

export type PlannerErrorCode = 'timeout' | 'network' | 'invalid' | 'forbidden';

export class PlannerError extends Error {
  constructor(public code: PlannerErrorCode, message?: string) {
    super(message ?? PLANNER_ERROR_COPY[code]);
  }
}

export const PLANNER_ERROR_COPY: Record<PlannerErrorCode, string> = {
  timeout: 'That took too long. Your brief is saved — try again.',
  network: 'Couldn’t reach the planner. Your brief is saved — try again.',
  invalid: 'The planner returned something we couldn’t use. Try again.',
  forbidden: 'You no longer have access to this event.'
};