import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Plus, QrCode, ScanLine, Ticket as TicketIcon } from 'lucide-react';
import type { EventRecord, Ticket, TicketTier } from '../../types/domain';
import { useDb } from '../../contexts/DataContext';
import { eventTicketStats, tierStats } from '../../utils/tickets';
import { fmtDateTime, fmtShortDate } from '../../utils/dates';
import { formatNaira } from '../../utils/money';
import { TierDialog } from './TierDialog';
import { TicketQr } from '../tickets/TicketQr';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/Dialog';
import { EmptyState } from '../ui/EmptyState';
import { StatusPill, type PillTone } from '../ui/StatusPill';
import { DemoTag } from '../ui/DemoTag';
import { Button } from '../ui/Button';
import { btn, cx } from '../../utils/styles';

const TICKET: Record<Ticket['status'], {label: string;tone: PillTone;}> = {
  valid: { label: 'Valid', tone: 'success' },
  checked_in: { label: 'Checked in', tone: 'dark' },
  cancelled: { label: 'Cancelled', tone: 'danger' }
};

const ORDER: Record<string, {label: string;tone: PillTone;}> = {
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' }
};

export function TicketsTab({ event }: {event: EventRecord;}) {
  const db = useDb();
  const tiers = db.ticketTiers.filter((t) => t.eventId === event.id);
  const orders = db.ticketOrders.filter((o) => o.eventId === event.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const tickets = db.tickets.filter((t) => t.eventId === event.id);
  const stats = eventTicketStats(db, event.id);
  const [dialog, setDialog] = useState<{open: boolean;tier: TicketTier | null;}>({ open: false, tier: null });
  const [qr, setQr] = useState<Ticket | null>(null);
  const tierName = (id: string) => tiers.find((t) => t.id === id)?.name ?? 'Ticket';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="flex items-center gap-2 text-[17px] font-medium text-ink">Tickets <DemoTag>Simulated</DemoTag></h2>
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex items-baseline gap-1.5"><dt className="text-smoke">Sold</dt><dd className="font-medium tabular-nums text-ink">{stats.sold}<span className="font-normal text-smoke">/{stats.capacity}</span></dd></div>
            <div className="flex items-baseline gap-1.5"><dt className="text-smoke">Checked in</dt><dd className="font-medium tabular-nums text-ink">{stats.checkedIn}</dd></div>
            <div className="flex items-baseline gap-1.5"><dt className="text-smoke">Revenue</dt><dd className="font-medium tabular-nums text-ink">{formatNaira(stats.revenue)}</dd></div>
          </dl>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {event.status === 'published' &&
          <Link to={`/events/${event.slug}`} target="_blank" rel="noreferrer" aria-label="Open ticket page" title="Ticket page" className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-ink/30">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
          <Link to={`/check-in/${event.id}`} className={cx(btn.base, btn.outline, btn.sm)}><ScanLine className="h-4 w-4" aria-hidden="true" /> Check-in</Link>
          <Button type="button" onClick={() => setDialog({ open: true, tier: null })} className={cx(btn.base, btn.ink, btn.sm)}><Plus className="h-4 w-4" aria-hidden="true" /> Tier</Button>
        </div>
      </div>

      {tiers.length ?
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((t) => {
          const s = tierStats(db, t.id);
          const pct = t.quantity ? Math.min(100, s.sold / t.quantity * 100) : 0;
          const pill = t.status !== 'on_sale' ?
          { tone: (t.status === 'cancelled' ? 'danger' : 'warning') as PillTone, label: t.status === 'cancelled' ? 'Cancelled' : 'Paused' } :
          s.soldOut ? { tone: 'warning' as PillTone, label: 'Sold out' } : null;
          return (
            <li key={t.id} className="group bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-smoke">{t.name}</p>
                  <div className="flex items-center gap-1">
                    {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
                    <button type="button" onClick={() => setDialog({ open: true, tier: t })} aria-label={`Edit ${t.name}`} className="grid h-7 w-7 place-items-center rounded-full text-smoke transition hover:bg-paper hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"><Pencil className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  </div>
                </div>
                <p className="mt-1 text-xl font-medium tracking-[-0.01em] tabular-nums text-ink">{t.price ? formatNaira(t.price) : 'Free'}</p>
                {t.description && <p className="mt-0.5 truncate text-xs text-smoke" title={t.description}>{t.description}</p>}
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-paper" role="img" aria-label={`${s.sold} of ${t.quantity} sold`}>
                  <span className={cx('block h-full rounded-full', s.soldOut ? 'bg-coral' : 'bg-ink')} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-[11px] tabular-nums text-smoke">{s.sold} sold · {s.remaining} left · {s.checkedIn} in</p>
              </li>);

        })}
        </ul> :

      <EmptyState icon={TicketIcon} title="No ticket tiers yet" message="Create a tier with a price and quantity to start selling (simulated)." action={<Button type="button" onClick={() => setDialog({ open: true, tier: null })} className={cx(btn.base, btn.ink, btn.md)}>Create tier</Button>} />
      }

      <div className="grid gap-5 xl:grid-cols-2">
        <section aria-labelledby="tk-orders" className="flex flex-col rounded-2xl border border-line bg-white">
          <div className="flex items-baseline justify-between px-5 pb-2 pt-4">
            <h3 id="tk-orders" className="text-[15px] font-medium text-ink">Orders</h3>
            <span className="text-xs tabular-nums text-smoke">{orders.length}</span>
          </div>
          {orders.length ?
          <ul className="scroll-thin max-h-[22rem] overflow-y-auto px-2 pb-2">
              {orders.map((o) => {
              const st = ORDER[o.status] ?? { label: 'Processing', tone: 'warning' as PillTone };
              return (
                <li key={o.id} title={o.reference} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-paper/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{o.buyerName}</p>
                      <p className="truncate text-[11px] text-smoke">{o.quantity} × {tierName(o.tierId)} · {fmtShortDate(o.createdAt)}</p>
                    </div>
                    <span className="text-sm tabular-nums text-ink">{formatNaira(o.total)}</span>
                    <StatusPill tone={st.tone}>{st.label}</StatusPill>
                  </li>);

            })}
            </ul> :
          <p className="px-5 pb-6 pt-2 text-sm text-smoke">No orders yet.</p>}
        </section>

        <section aria-labelledby="tk-issued" className="flex flex-col rounded-2xl border border-line bg-white">
          <div className="flex items-baseline justify-between px-5 pb-2 pt-4">
            <h3 id="tk-issued" className="text-[15px] font-medium text-ink">Issued tickets</h3>
            <span className="text-xs tabular-nums text-smoke">{tickets.length}</span>
          </div>
          {tickets.length ?
          <ul className="scroll-thin max-h-[22rem] overflow-y-auto px-2 pb-2">
              {tickets.map((t) =>
            <li key={t.id}>
                  <button type="button" onClick={() => setQr(t)} aria-label={`Show QR for ${t.code}`} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-paper/60">
                    <QrCode className="h-4 w-4 shrink-0 text-smoke" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[13px] text-ink">{t.code}</p>
                      <p className="truncate text-[11px] text-smoke">{t.holderName} · {tierName(t.tierId)}{t.checkedInAt ? ` · in ${fmtDateTime(t.checkedInAt)}` : ''}</p>
                    </div>
                    <StatusPill tone={TICKET[t.status].tone}>{TICKET[t.status].label}</StatusPill>
                  </button>
                </li>
            )}
            </ul> :
          <p className="px-5 pb-6 pt-2 text-sm text-smoke">Tickets appear after a successful checkout.</p>}
          {tickets.length > 0 && <p className="border-t border-line px-5 py-2.5 text-[11px] text-smoke">Tap a ticket for its QR — try the code at check-in.</p>}
        </section>
      </div>

      <TierDialog event={event} tier={dialog.tier} open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} />
      <Dialog open={!!qr} onOpenChange={(o) => !o && setQr(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle>{qr?.holderName}</DialogTitle>
            <DialogDescription>{qr?.code} · {db.ticketTiers.find((x) => x.id === qr?.tierId)?.name}</DialogDescription>
          </DialogHeader>
          {qr && <div className="flex justify-center py-2"><TicketQr code={qr.code} size={180} /></div>}
        </DialogContent>
      </Dialog>
    </div>);

}