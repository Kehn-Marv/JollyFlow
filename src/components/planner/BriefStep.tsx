import React, { useRef, useState } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import type { EventType } from '../../types/domain';
import { FormField, fieldA11y } from '../ui/FormField';
import { Button } from '../ui/Button';
import { CITIES, EVENT_TYPE_LABELS } from '../../utils/events';
import { VENDOR_LIBRARY } from '../../data/plannerPlaybooks';
import { parseBrief } from '../../utils/planner/parseBrief';
import { validateBrief, type BriefDraft, type BriefField } from '../../utils/planner/brief';
import { fmtMonth, fmtPlanDate, todayLagos } from '../../utils/planner/lagosDates';
import { formatNairaCompact, koboToInput, parseNairaInput } from '../../utils/money';
import { btn, cx, inputClass } from '../../utils/styles';

const EXAMPLES = [
'Traditional wedding in Port Harcourt for 200 guests in March, ₦5m budget',
'My daughter’s 10th birthday in Lagos, 60 guests, ₦1.2m',
'Product launch in Abuja for 150 people next month'];

const BOOKABLE = ['venue', 'catering', 'decor', 'photography', 'entertainment', 'audiovisual', 'cake', 'rentals', 'attire'];

interface Props {
  brief: BriefDraft;
  forEvent: string | null;
  onChange: (next: Partial<BriefDraft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function BriefStep({ brief, forEvent, onChange, onSubmit, onCancel }: Props) {
  const [errors, setErrors] = useState<Partial<Record<BriefField, string>>>({});
  const [more, setMore] = useState(brief.booked.length > 0 || !!brief.notes);
  const touched = useRef(new Set<string>());
  const today = todayLagos();

  function set(field: keyof BriefDraft, value: BriefDraft[keyof BriefDraft]) {
    touched.current.add(field);
    setErrors((e) => ({ ...e, [field]: undefined }));
    onChange({ [field]: value } as Partial<BriefDraft>);
  }

  /** Fill fields from the sentence, without overwriting anything typed by hand. */
  function describe(text: string) {
    const p = parseBrief(text);
    const next: Partial<BriefDraft> = { text };
    const free = (f: string) => !touched.current.has(f);
    if (p.type && free('type')) next.type = p.type;
    if (p.city && free('city')) next.city = p.city;
    if (p.guests && free('guests')) next.guests = String(p.guests);
    if (p.budget && free('budget')) {
      next.budget = koboToInput(p.budget);
      next.budgetUnknown = false;
    }
    if (p.date && free('date')) {
      next.date = p.date;
      next.month = '';
    } else if (p.month && free('date')) next.month = p.month;
    onChange(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateBrief(brief);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`pl-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    onSubmit();
  }

  const detected = [
  brief.type && EVENT_TYPE_LABELS[brief.type],
  brief.city,
  brief.guests && Number(brief.guests) > 0 && `${Number(brief.guests).toLocaleString()} guests`,
  !brief.budgetUnknown && parseNairaInput(brief.budget) ? formatNairaCompact(parseNairaInput(brief.budget)!) : null,
  brief.date ? fmtPlanDate(brief.date) : brief.month ? fmtMonth(brief.month) : null].
  filter(Boolean) as string[];

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {!forEvent &&
      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <label htmlFor="pl-text" className="font-display text-[15px] font-semibold text-ink">Describe your event</label>
          <textarea
          id="pl-text"
          value={brief.text}
          maxLength={400}
          rows={3}
          onChange={(e) => describe(e.target.value)}
          placeholder="e.g. Traditional wedding in Port Harcourt for 200 guests in March, ₦5m budget"
          className="mt-3 w-full resize-none rounded-2xl border border-line bg-paper/60 px-4 py-3 text-base text-ink placeholder:text-smoke/70 focus:border-ink focus:bg-white focus:outline-none sm:text-[15px]" />
        
          {brief.text.trim() ?
        detected.length > 0 &&
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Picked up from your description">
                {detected.map((d) =>
          <li key={d} className="inline-flex items-center gap-1 rounded-full bg-lime/60 px-2.5 py-1 text-xs font-medium text-ink">
                    <Check className="h-3 w-3" aria-hidden="true" /> {d}
                  </li>
          )}
              </ul> :


        <div className="mt-3 flex flex-wrap gap-1.5">
              {EXAMPLES.map((x) =>
          <button key={x} type="button" onClick={() => describe(x)} className="rounded-full border border-line px-3 py-1.5 text-left text-xs text-smoke transition hover:border-ink/40 hover:text-ink">
                  {x}
                </button>
          )}
            </div>
        }
        </section>
      }

      <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-display text-[15px] font-semibold text-ink">{forEvent ? 'Check the details' : 'The essentials'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Occasion" htmlFor="pl-type" error={errors.type}>
            <select {...fieldA11y('pl-type', errors.type)} value={brief.type ?? ''} onChange={(e) => set('type', (e.target.value || null) as EventType | null)} className={inputClass}>
              <option value="">Choose…</option>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
            </select>
          </FormField>
          <FormField label="City" htmlFor="pl-city" error={errors.city}>
            <input {...fieldA11y('pl-city', errors.city)} list="pl-cities" value={brief.city} maxLength={40} onChange={(e) => set('city', e.target.value)} placeholder="Lagos" className={inputClass} />
            <datalist id="pl-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
          </FormField>
          <FormField label={brief.date || !brief.month ? 'Date' : 'Rough month'} htmlFor="pl-date" error={errors.date} hint={!brief.date ? 'Leave blank if not decided' : undefined}>
            {brief.date || !brief.month ?
            <input {...fieldA11y('pl-date', errors.date)} type="date" min={today} value={brief.date} onChange={(e) => set('date', e.target.value)} className={inputClass} /> :

            <div className="flex gap-2">
                <input id="pl-date" type="month" min={today.slice(0, 7)} value={brief.month} onChange={(e) => set('month', e.target.value)} className={inputClass} />
                <button type="button" onClick={() => onChange({ month: '' })} className="shrink-0 text-xs font-medium text-smoke underline underline-offset-4 hover:text-ink">Exact date</button>
              </div>
            }
          </FormField>
          <FormField label="Expected guests" htmlFor="pl-guests" error={errors.guests}>
            <input {...fieldA11y('pl-guests', errors.guests)} type="number" inputMode="numeric" min={1} max={100000} value={brief.guests} onChange={(e) => set('guests', e.target.value)} placeholder="200" className={inputClass} />
          </FormField>
          <FormField label="Total budget (₦)" htmlFor="pl-budget" error={errors.budget} className="sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                {...fieldA11y('pl-budget', errors.budget)}
                inputMode="decimal"
                value={brief.budgetUnknown ? '' : brief.budget}
                disabled={brief.budgetUnknown}
                onChange={(e) => set('budget', e.target.value)}
                placeholder={brief.budgetUnknown ? 'We’ll suggest one' : '5,000,000'}
                className={cx(inputClass, 'sm:max-w-xs')} />
              
              <label className="inline-flex items-center gap-2 text-sm text-smoke">
                <input type="checkbox" checked={brief.budgetUnknown} onChange={(e) => set('budgetUnknown', e.target.checked)} className="h-4 w-4 accent-ink" />
                Not decided
              </label>
            </div>
          </FormField>
        </div>

        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="mt-5 flex w-full items-center gap-2 border-t border-line pt-4 text-left text-sm font-medium text-ink">
          Add details <span className="font-normal text-smoke">— optional</span>
          <ChevronDown className={cx('ml-auto h-4 w-4 transition-transform', more && 'rotate-180')} aria-hidden="true" />
        </button>
        {more &&
        <div className="mt-4 space-y-4">
            <fieldset>
              <legend className="text-sm font-medium text-ink">Already arranged</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BOOKABLE.map((k) => {
                const on = brief.booked.includes(k);
                return (
                  <button key={k} type="button" aria-pressed={on} onClick={() => set('booked', on ? brief.booked.filter((b) => b !== k) : [...brief.booked, k])} className={cx('rounded-full border px-3 py-1.5 text-xs font-medium transition', on ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:border-ink/40')}>
                      {VENDOR_LIBRARY[k][0]}
                    </button>);

              })}
              </div>
            </fieldset>
            <FormField label="Anything else" htmlFor="pl-notes" hint={`${brief.notes.length}/300`}>
              <textarea id="pl-notes" value={brief.notes} maxLength={300} rows={2} onChange={(e) => set('notes', e.target.value)} placeholder="Priorities, must-haves, things to avoid" className={cx(inputClass, 'h-auto py-2.5')} />
            </FormField>
          </div>
        }
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onCancel} className={cx(btn.base, btn.ghost, btn.md)}>Cancel</Button>
        <Button type="submit" className={cx(btn.base, btn.ink, btn.md)}>
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Build my plan
        </Button>
      </div>
    </form>);

}