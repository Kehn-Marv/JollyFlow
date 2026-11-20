import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import type { Booking, EventRecord } from '../../types/domain';
import { SidePanel } from '../ui/SidePanel';
import { useDb } from '../../contexts/DataContext';
import { service } from '../../services';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { bookingFinance } from '../../utils/finance';
import { dueLabel, fmtShortDate } from '../../utils/dates';
import { formatNaira } from '../../utils/money';
import { BOOKING_STATUS_LABELS, VENDOR_CATEGORY_LABELS } from '../../utils/events';
import { BOOKING_TONE, PAYMENT_LABEL, PAYMENT_TONE, StatusPill } from '../ui/StatusPill';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { btn, cx } from '../../utils/styles';

interface Props {
  event: EventRecord;
  booking: Booking | null;
  onClose: () => void;
  onPay: (bookingId: string, amount?: number) => void;
}

export function BookingDetailSheet({ event, booking, onClose, onPay }: Props) {
  const db = useDb();
  const { pending, run } = useAsyncAction();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const vendor = booking ? db.vendors.find((v) => v.id === booking.vendorId) : undefined;
  const fin = booking ? bookingFinance(db, booking) : null;
  const txns = booking ? db.transactions.filter((t) => t.bookingId === booking.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const cat = booking ? db.budgetCategories.find((c) => c.id === booking.categoryId) : undefined;

  const canPay = !!booking && !!fin && booking.status === 'confirmed' && fin.outstanding - fin.pending > 0;
  const canCancel = !!booking && (booking.status === 'confirmed' || booking.status === 'requested');

  const footer = booking && fin &&
  <div className="flex flex-wrap items-center gap-2">
      {booking.status === 'requested' &&
    <>
          <Button type="button" disabled={pending} onClick={() => run(() => service.setBookingStatus(booking.id, 'confirmed'), { success: 'Booking confirmed — now counted as committed' })} className={cx(btn.base, btn.lime, btn.sm)}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Confirmed
          </Button>
          <Button type="button" disabled={pending} onClick={() => run(() => service.setBookingStatus(booking.id, 'declined'), { success: 'Marked as declined' })} className={cx(btn.base, btn.outline, btn.sm)}>
            <XCircle className="h-4 w-4" aria-hidden="true" /> Declined
          </Button>
        </>
    }
      {canPay &&
    <Button type="button" onClick={() => onPay(booking.id, fin.depositOutstanding > 0 ? Math.max(0, fin.depositOutstanding - fin.pending) || undefined : undefined)} className={cx(btn.base, btn.ink, btn.sm)}>
          <Banknote className="h-4 w-4" aria-hidden="true" /> Record payment
        </Button>
    }
      <div className="ml-auto flex items-center gap-1">
        {vendor?.isMarketplace &&
      <Link to={`/app/vendors/${vendor.id}`} aria-label="Vendor profile" title="Vendor profile" className="grid h-9 w-9 place-items-center rounded-full text-smoke transition hover:bg-paper hover:text-ink">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
      }
        {canCancel &&
      <button type="button" onClick={() => setConfirmCancel(true)} className="h-9 rounded-full px-3 text-sm font-medium text-danger transition hover:bg-danger/10">Cancel</button>
      }
      </div>
    </div>;


  const stat = (label: string, value: number, cls = 'text-ink') =>
  <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <dt className="text-[11px] text-smoke">{label}</dt>
      <dd className={cx('truncate text-sm font-medium tabular-nums', cls)}>{formatNaira(value)}</dd>
    </div>;


  return (
    <SidePanel
      open={!!booking}
      onOpenChange={(o) => !o && onClose()}
      width="lg"
      eyebrow={booking &&
      <>
          <StatusPill tone={BOOKING_TONE[booking.status]}>{BOOKING_STATUS_LABELS[booking.status]}</StatusPill>
          {vendor && <StatusPill>{VENDOR_CATEGORY_LABELS[vendor.category]}</StatusPill>}
        </>
      }
      title={vendor?.name ?? 'Booking'}
      description={booking ? `${booking.serviceName} · ${event.title}` : undefined}
      footer={footer || undefined}>
      
      {booking && fin &&
      <div className="space-y-5 px-6 py-5">
          <section aria-label="Payment progress">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-smoke">Paid</span>
              <span className="tabular-nums text-ink"><span className="font-medium">{formatNaira(fin.paid)}</span><span className="text-smoke"> / {formatNaira(booking.agreedAmount)}</span></span>
            </div>
            <ProgressBar value={fin.paid} max={booking.agreedAmount} label="Paid towards booking" size="sm" className="mt-2" />
            <dl className="mt-3 grid grid-cols-3 divide-x divide-line">
              {stat('Agreed', booking.agreedAmount)}
              {stat('Pending', fin.pending)}
              {stat('Outstanding', booking.status === 'confirmed' ? fin.outstanding : 0, booking.status === 'confirmed' && fin.outstanding > 0 ? 'text-coral' : 'text-ink')}
            </dl>
            {booking.status !== 'confirmed' && <p className="mt-2 text-xs text-smoke">Counts as committed once confirmed.</p>}
          </section>

          <dl className="divide-y divide-line rounded-2xl border border-line text-sm">
            <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
              <dt className="text-smoke">Deposit</dt>
              <dd className="text-right tabular-nums text-ink">
                {formatNaira(booking.depositAmount)}
                {booking.depositAmount > 0 && fin.depositOutstanding === 0 ? <span className="ml-1.5 text-xs text-forest">paid</span> : booking.depositDueDate && <span className="ml-1.5 text-xs text-smoke">{dueLabel(booking.depositDueDate)}</span>}
              </dd>
            </div>
            {booking.balanceDueDate &&
          <div className="flex items-center justify-between gap-4 px-3.5 py-2.5"><dt className="text-smoke">Balance due</dt><dd className="text-ink">{fmtShortDate(booking.balanceDueDate)}</dd></div>
          }
            <div className="flex items-center justify-between gap-4 px-3.5 py-2.5"><dt className="text-smoke">Budget</dt><dd className="truncate text-ink">{cat?.name ?? 'Uncategorised'}</dd></div>
            {booking.notes && <div className="px-3.5 py-2.5"><dt className="sr-only">Notes</dt><dd className="line-clamp-2 whitespace-pre-line text-smoke">{booking.notes}</dd></div>}
          </dl>

          <section aria-labelledby="bk-payments">
            <h3 id="bk-payments" className="text-sm font-medium text-ink">Payments <span className="font-normal text-smoke">· simulated</span></h3>
            {txns.length ?
          <ul className="mt-2 divide-y divide-line">
                {txns.map((t) =>
            <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ink">{t.note || 'Payment'}</span>
                      <span className="block truncate text-[11px] text-smoke">{fmtShortDate(t.createdAt)}</span>
                    </span>
                    <span className="tabular-nums text-ink">{formatNaira(t.amount)}</span>
                    <StatusPill tone={PAYMENT_TONE[t.status]}>{PAYMENT_LABEL[t.status]}</StatusPill>
                  </li>
            )}
              </ul> :
          <p className="mt-1 text-sm text-smoke">None yet.</p>}
          </section>
          {booking.status === 'requested' && <p className="text-xs text-smoke">Record the vendor’s reply below — vendor accounts aren’t live yet.</p>}
        </div>
      }
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this booking?"
        message={fin && fin.paid > 0 ? `${formatNaira(fin.paid)} has already been paid. Cancelling removes it from committed spend; agree any refund with the vendor directly.` : 'It will no longer count towards committed spend.'}
        confirmLabel="Cancel booking"
        pending={pending}
        onConfirm={async () => {
          if (!booking) return;
          const ok = await run(() => service.setBookingStatus(booking.id, 'cancelled'), { success: 'Booking cancelled' });
          if (ok) setConfirmCancel(false);
        }} />
      
    </SidePanel>);

}