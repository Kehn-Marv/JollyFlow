import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cx } from '../../utils/styles';

const STAGES = ['Understanding your event', 'Putting together your checklist', 'Working through your budget', 'Lining up vendors to consider'];

export function GeneratingStep({ onCancel }: {onCancel: () => void;}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => Math.min(n + 1, STAGES.length - 1)), 420);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section aria-live="polite" aria-busy="true" className="mx-auto max-w-md rounded-3xl border border-line bg-white p-6 sm:p-8">
      <ol className="space-y-3.5">
        {STAGES.map((s, n) =>
        <li key={s} className={cx('flex items-center gap-3 text-sm transition-colors', n <= i ? 'text-ink' : 'text-smoke/50')}>
            <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full', n < i ? 'bg-ink text-paper' : n === i ? 'bg-lime text-ink' : 'border border-line')}>
              {n < i ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : n === i ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
            </span>
            {s}
          </li>
        )}
      </ol>
      <button type="button" onClick={onCancel} className="mt-6 text-sm font-medium text-smoke underline-offset-4 hover:text-ink hover:underline">Cancel</button>
    </section>);

}