import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoEntry } from '../../hooks/useDemoEntry';
import { HeroComposition } from './HeroComposition';
import { btn, cx } from '../../utils/styles';

/** Centered, type-led statement with a live product window rising from the fold. */
export function HeroSection() {
  const { user } = useAuth();
  const { enter, pending } = useDemoEntry();
  const reduce = useReducedMotion();
  const rise = (delay = 0) =>
  reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <section className="on-dark relative overflow-hidden bg-ink text-paper" aria-labelledby="hero-title">
      <div className="container relative flex flex-col items-center pt-20 text-center sm:pt-28">
        <motion.h1
          {...rise(0)}
          id="hero-title"
          className="max-w-4xl text-[3rem] font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl xl:text-[6rem]">
          
          Make every event <span className="text-lime">happen seamlessly.</span>
        </motion.h1>
        <motion.p {...rise(0.08)} className="mt-7 max-w-xl text-lg leading-relaxed text-paper/60 sm:text-xl">
          Start with your idea. JolliFlow helps turn it into a plan, bring everyone together and keep track of every naira.
        </motion.p>
        <motion.div {...rise(0.16)} className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link to={user ? '/app/events/new' : '/signup'} className={cx(btn.base, btn.lime, btn.lg, 'w-full sm:w-auto')}>
            Create an event <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button type="button" onClick={() => enter()} disabled={pending} className={cx(btn.base, btn.onDark, btn.lg, 'w-full sm:w-auto')}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Explore the live demo
          </button>
        </motion.div>
        <motion.p {...rise(0.22)} className="mt-5 text-sm text-paper/40">
          No sign-up for the demo · Payments are simulated
        </motion.p>

        <HeroComposition />
      </div>
    </section>);

}