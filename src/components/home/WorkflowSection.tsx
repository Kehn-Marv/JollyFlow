import React from 'react';
import { Banknote, CalendarPlus, Images, Ticket, Users } from 'lucide-react';
import { workflowSteps } from '../../data/marketing';

const ICONS = [CalendarPlus, Users, Banknote, Ticket, Images];

/** Five quiet steps on one connected track — no diagram, no stickers. */
export function WorkflowSection() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-bloom" aria-labelledby="how-title">
      <div className="container py-20 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink/60">How it works</p>
            <h2 id="how-title" className="mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-ink sm:text-5xl">
              Everything connects to the event.
            </h2>
          </div>
          <p className="max-w-md text-base text-ink/70 lg:justify-self-end lg:text-lg">
            Every RSVP, vendor payment, and ticket sale syncs in real time - so you always know where your event stands.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-px overflow-hidden rounded-[1.75rem] bg-ink/10 sm:grid-cols-2 lg:grid-cols-5">
          {workflowSteps.map((s, i) => {
            const Icon = ICONS[i] ?? CalendarPlus;
            return (
              <li key={s.n} className="flex flex-col bg-white/85 p-6 backdrop-blur-sm transition-colors hover:bg-white lg:min-h-[15rem]">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-paper text-ink">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs tabular-nums text-smoke">{s.n}</span>
                </div>
                <h3 className="mt-6 text-[17px] font-medium leading-snug text-ink lg:mt-auto lg:pt-8">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-smoke">{s.body}</p>
              </li>);

          })}
        </ol>
      </div>
    </section>);

}