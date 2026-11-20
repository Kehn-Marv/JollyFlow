/** Calendar helpers pinned to Africa/Lagos. Dates are plain YYYY-MM-DD strings. */
export const LAGOS_TZ = 'Africa/Lagos';

export function todayLagos(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: LAGOS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const toUtc = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

export function addDays(date: string, days: number): string {
  return new Date(toUtc(date) + Math.round(days) * 86_400_000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

/** Midday Lagos time, so the calendar date is the same everywhere in Nigeria. */
export function lagosNoonIso(date: string): string {
  return new Date(`${date}T12:00:00+01:00`).toISOString();
}

export function lagosDateOf(iso: string): string {
  return todayLagos(new Date(iso));
}

export function fmtPlanDate(date: string): string {
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(toUtc(date)));
}

export function fmtMonth(month: string): string {
  return new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
}