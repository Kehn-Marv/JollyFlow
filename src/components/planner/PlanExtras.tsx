import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import type { PlanVendor, PlanWatch } from '../../types/planner';
import { useDb } from '../../contexts/DataContext';
import { cx } from '../../utils/styles';

export function PlanVendors({ vendors, city }: {vendors: PlanVendor[];city: string;}) {
  const db = useDb();
  if (!vendors.length) return null;
  const listed = db.vendors.filter((v) => v.isMarketplace);
  const here = (c: string) => c.toLowerCase() === city.toLowerCase();

  return (
    <section aria-labelledby="pl-vendors" className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <h2 id="pl-vendors" className="font-display text-[15px] font-semibold text-ink">Vendors to consider</h2>
      <ul className="mt-3 divide-y divide-line">
        {vendors.map((v) => {
          const matches = v.category ? listed.filter((x) => x.category === v.category) : [];
          const local = matches.filter((x) => here(x.city) || x.serviceAreas.some(here)).length;
          return (
            <li key={v.key} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{v.label}</p>
                {!v.booked && <p className="truncate text-xs text-smoke">{v.lookFor}</p>}
              </div>
              {v.booked ?
              <span className="inline-flex items-center gap-1 text-xs text-smoke"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Arranged</span> :
              matches.length ?
              <Link to={`/app/vendors?category=${v.category}${local ? `&city=${encodeURIComponent(city)}` : ''}`} className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-sand">
                  {local ? `${local} in ${city}` : `${matches.length} listed`} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </Link> :
              null}
            </li>);

        })}
      </ul>
    </section>);

}

export function PlanWatchouts({ items }: {items: PlanWatch[];}) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="pl-watch" className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <h2 id="pl-watch" className="font-display text-[15px] font-semibold text-ink">Don’t overlook</h2>
      <ul className="mt-3 space-y-2">
        {items.map((w) => {
          const cls = 'mt-1 inline-block text-xs font-medium text-ink underline-offset-4 hover:underline';
          return (
            <li key={w.id} className="flex gap-3 rounded-2xl bg-paper px-3.5 py-3">
              <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', w.tone === 'urgent' ? 'bg-coral' : 'bg-ink/40')} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{w.title}</p>
                <p className="text-xs text-smoke">{w.reason}</p>
                {w.to.startsWith('#') ? <a href={w.to} className={cls}>{w.action} →</a> : <Link to={w.to} className={cls}>{w.action} →</Link>}
              </div>
            </li>);

        })}
      </ul>
    </section>);

}