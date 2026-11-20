import type { PlannerService } from '../contracts';
import { PlannerError } from '../../types/planner';
import { generatePlan, validatePlan } from '../../utils/planner/generatePlan';

const TIMEOUT_MS = 10_000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Lets a demo presenter rehearse failure states: add ?plannerFail=timeout|network|invalid to the URL. */
function forcedFailure(): 'timeout' | 'network' | 'invalid' | null {
  try {
    const v = new URLSearchParams(window.location.search).get('plannerFail');
    return v === 'timeout' || v === 'network' || v === 'invalid' ? v : null;
  } catch {
    return null;
  }
}

/** Deterministic, on-device planner. Same brief + same event state → same plan, every session. */
export const demoPlanner: PlannerService = {
  mode: 'demo',
  async generatePlan(brief, context) {
    const fail = forcedFailure();
    const work = (async () => {
      await wait(fail === 'timeout' ? TIMEOUT_MS + 1000 : 1700);
      if (fail === 'network') throw new PlannerError('network');
      const raw = fail === 'invalid' ? { id: 'x', tasks: 'oops' } : generatePlan(brief, context);
      try {
        return validatePlan(raw);
      } catch {
        throw new PlannerError('invalid');
      }
    })();
    const timeout = wait(TIMEOUT_MS).then(() => {
      throw new PlannerError('timeout');
    });
    return Promise.race([work, timeout]);
  }
};