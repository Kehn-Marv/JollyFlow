import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cx } from '../../utils/styles';

export type StoryTone = 'paper' | 'ink' | 'sky' | 'lime' | 'pink' | 'forest' | 'white';

const TONE: Record<StoryTone, {bg: string;text: string;sub: string;eyebrow: string;rule: string;}> = {
  paper: { bg: 'bg-paper', text: 'text-ink', sub: 'text-smoke', eyebrow: 'text-ink/60', rule: 'border-ink/10' },
  white: { bg: 'bg-white', text: 'text-ink', sub: 'text-smoke', eyebrow: 'text-ink/60', rule: 'border-ink/10' },
  ink: { bg: 'bg-ink on-dark', text: 'text-paper', sub: 'text-paper/65', eyebrow: 'text-paper/50', rule: 'border-paper/15' },
  sky: { bg: 'bg-sky', text: 'text-ink', sub: 'text-ink/70', eyebrow: 'text-ink/60', rule: 'border-ink/15' },
  lime: { bg: 'bg-lime', text: 'text-ink', sub: 'text-ink/70', eyebrow: 'text-ink/60', rule: 'border-ink/15' },
  pink: { bg: 'bg-bloom', text: 'text-ink', sub: 'text-ink/70', eyebrow: 'text-ink/60', rule: 'border-ink/15' },
  forest: { bg: 'bg-forest on-dark', text: 'text-paper', sub: 'text-paper/70', eyebrow: 'text-paper/50', rule: 'border-paper/15' }
};

interface FeatureStoryProps {
  id?: string;
  tone: StoryTone;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  points: string[];
  visual: React.ReactNode;
  reverse?: boolean;
  cta?: {to: string;label: string;};
}

export function FeatureStory({ id, tone, eyebrow, title, body, points, visual, reverse, cta }: FeatureStoryProps) {
  const t = TONE[tone];
  const headingId = `${id ?? eyebrow.replace(/\W+/g, '-').toLowerCase()}-title`;
  return (
    <section id={id} className={cx('scroll-mt-16', t.bg)} aria-labelledby={headingId}>
      <div className="container grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
        <div className={cx('max-w-lg', reverse && 'lg:order-2')}>
          <p className={cx('text-xs font-medium uppercase tracking-[0.2em]', t.eyebrow)}>{eyebrow}</p>
          <h2 id={headingId} className={cx('mt-3 text-4xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-5xl', t.text)}>
            {title}
          </h2>
          <p className={cx('mt-5 text-base leading-relaxed sm:text-lg', t.sub)}>{body}</p>
          <ul className={cx('mt-8 border-t', t.rule)}>
            {points.map((p, i) =>
            <li key={p} className={cx('flex items-baseline gap-4 border-b py-3 text-[15px]', t.rule, t.text)}>
                <span className={cx('w-5 shrink-0 font-mono text-[11px] tabular-nums', t.sub)}>{String(i + 1).padStart(2, '0')}</span>
                {p}
              </li>
            )}
          </ul>
          {cta &&
          <Link to={cta.to} className={cx('group mt-7 inline-flex items-center gap-2 text-sm font-medium', t.text)}>
              {cta.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          }
        </div>
        <div className={cx('min-w-0', reverse && 'lg:order-1')}>{visual}</div>
      </div>
    </section>);

}