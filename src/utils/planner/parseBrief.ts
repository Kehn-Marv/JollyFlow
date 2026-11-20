import type { EventType } from '../../types/domain';
import { CITIES } from '../events';
import { todayLagos } from './lagosDates';

export interface ParsedBrief {
  type?: EventType;
  city?: string;
  guests?: number;
  budget?: number;
  date?: string;
  month?: string;
}

const TYPE_WORDS: Array<[RegExp, EventType]> = [
[/\b(trad(itional)?( wedding)?|introduction|engagement|igba nkwu|idana)\b/, 'traditional_wedding'],
[/\b(white wedding|wedding|reception)\b/, 'wedding'],
[/\b(naming|christening|dedication)\b/, 'naming'],
[/\b(graduation|convocation|call to bar)\b/, 'graduation'],
[/\banniversary\b/, 'anniversary'],
[/\b(birthday|turns \d+|\d+(st|nd|rd|th) birthday)\b/, 'birthday'],
[/\b(concert|festival|gig|show|tour)\b/, 'concert'],
[/\b(conference|summit|launch|corporate|retreat|offsite|town ?hall|seminar|workshop|agm)\b/, 'corporate'],
[/\b(community|reunion|homecoming|harvest|end of year)\b/, 'community'],
[/\b(party|hangout|get-?together|owambe|dinner)\b/, 'party']];


const CITY_ALIASES: Record<string, string> = { ph: 'Port Harcourt', 'port-harcourt': 'Port Harcourt', abj: 'Abuja', benin: 'Benin City', lag: 'Lagos', lasgidi: 'Lagos', eko: 'Lagos' };
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

/** Pulls structured details out of a one-line description. Never throws; returns only what it's sure of. */
export function parseBrief(text: string, now = new Date()): ParsedBrief {
  const raw = text.slice(0, 400);
  const t = raw.toLowerCase();
  const out: ParsedBrief = {};
  if (!t.trim()) return out;

  for (const [re, type] of TYPE_WORDS) {
    if (re.test(t)) {
      out.type = type;
      break;
    }
  }

  const city = CITIES.find((c) => new RegExp(`\\b${c.toLowerCase()}\\b`).test(t));
  if (city) out.city = city;else
  {
    const alias = Object.keys(CITY_ALIASES).find((a) => new RegExp(`\\b${a}\\b`).test(t));
    if (alias) out.city = CITY_ALIASES[alias];else
    {
      const m = raw.match(/\bin ([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?)/);
      if (m && !new RegExp(`^${MONTH_RE}$`, 'i').test(m[1])) out.city = m[1];
    }
  }

  const g = t.match(/(\d[\d,]*)\s*(?:\+\s*)?(?:guests?|people|persons|pax|attendees|heads)\b/) ?? t.match(/\bfor (?:about |around |roughly )?(\d[\d,]*)\b(?!\s*(?:k|m|million|naira|thousand))/);
  if (g) {
    const n = Number(g[1].replace(/,/g, ''));
    if (n > 0 && n <= 100_000) out.guests = n;
  }

  const b = t.match(/(?:₦|ngn|n)\s?(\d+(?:[.,]\d+)*)\s?(k|m|mil|million|b|billion|thousand)?\b/) ?? t.match(/\b(\d+(?:\.\d+)?)\s?(k|m|mil|million|thousand)\b(?!\s*(?:guests|people))/);
  if (b) {
    const base = Number(b[1].replace(/,/g, ''));
    const unit = b[2] ?? '';
    const mult = /^(m|mil|million)$/.test(unit) ? 1_000_000 : /^(b|billion)$/.test(unit) ? 1_000_000_000 : /^(k|thousand)$/.test(unit) ? 1_000 : 1;
    const naira = base * mult;
    if (Number.isFinite(naira) && naira >= 10_000 && naira <= 10_000_000_000) out.budget = Math.round(naira * 100);
  }

  const today = todayLagos(now);
  const year = Number(today.slice(0, 4));
  const dm = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?: of)? ${MONTH_RE}\\b`)) ?? t.match(new RegExp(`\\b${MONTH_RE} (\\d{1,2})(?:st|nd|rd|th)?\\b`));
  const monthOnly = t.match(new RegExp(`\\b${MONTH_RE}\\b`));
  const monthIdx = (word: string) => MONTHS.indexOf(word.slice(0, 3));
  const nextYearFor = (mi: number, day = 28) => {
    const candidate = `${year}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return candidate < today ? year + 1 : year;
  };
  if (dm) {
    const day = Number(/^\d/.test(dm[1]) ? dm[1] : dm[2]);
    const mi = monthIdx(/^\d/.test(dm[1]) ? dm[2] : dm[1]);
    if (mi >= 0 && day >= 1 && day <= 31) {
      const y = nextYearFor(mi, day);
      const iso = `${y}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (!Number.isNaN(Date.parse(iso))) out.date = iso;
    }
  } else if (monthOnly) {
    // "may" is also an ordinary word — only treat it as a month with clear context.
    const word = monthOnly[1];
    const clear = word !== 'may' || /\b(in|by|around|early|late|mid|this|next) may\b|\bmay \d{4}\b/.test(t);
    const mi = monthIdx(word);
    if (clear && mi >= 0) out.month = `${nextYearFor(mi)}-${String(mi + 1).padStart(2, '0')}`;
  }

  return out;
}