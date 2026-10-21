// "Demo guide" panel, opened from Prototype controls: the 8-step demo script (plan §10) as one-click
// jumps. Our own presenter UI (not Meesho's), styled like the controls. Step data: ./demoGuide.ts.
import { useLocation, useNavigate } from 'react-router';
import { useDemo } from '../store/demo';
import { DEMO_GUIDE, jumpHref, stepDayLabel, type GuideJump } from './demoGuide';

/**
 * A guide jump in flight. React Router commits the new location in a transition, after the store
 * would already hold the new persona/day; DemoUrlSync would then write those params onto the OLD
 * page and cancel the jump. So the jump navigates first, and DemoUrlSync applies the persona/day/lang
 * (takePendingJump) once the new route is the current one.
 */
let pending: GuideJump | null = null;

/** For DemoUrlSync: 'wait' while the jump's route isn't current yet, the jump once it is, else null. */
export function takePendingJump(pathname: string): GuideJump | 'wait' | null {
  if (!pending) return null;
  if (pathname !== pending.path.split('?')[0]) return 'wait';
  const j = pending;
  pending = null;
  return j;
}

const PERSONA_SHORT = { jasmeet: 'Jasmeet', samar: 'Samar', reseller: 'Reseller' } as const;

export function DemoGuide({ active, onJump, onClose }: { active: number | null; onJump: (step: number) => void; onClose: () => void }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const s = useDemo();

  const go = (step: number, j: GuideJump) => {
    const href = jumpHref(j);
    if (href === `${loc.pathname}${loc.search}`) {
      s.setPersona(j.persona);
      s.setDay(j.day);
      s.setLang('en');
    } else {
      pending = j;
      navigate(href);
    }
    window.scrollTo(0, 0);
    onJump(step);
  };

  return (
    <div
      data-demo-guide
      role="dialog"
      aria-label="Demo guide"
      className="fixed right-[19.5rem] z-snackbar w-[24rem] max-w-[calc(100vw-21rem)] flex flex-col rounded-lg bg-black text-white font-default text-base shadow-2xl"
      style={{ top: 'calc(var(--concept-strip-h) + 6px)', maxHeight: 'calc(100vh - var(--concept-strip-h) - 12px)' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-solid border-white/15 border-x-0 border-t-0 shrink-0">
        <span className="font-semibold tracking-wide uppercase text-sm text-white/70">Demo guide · 8 steps</span>
        <button type="button" onClick={onClose} className="bg-transparent border-0 text-white/70 cursor-pointer text-lg leading-none" aria-label="Close demo guide">
          ×
        </button>
      </div>
      <ol className="m-0 p-2 list-none flex flex-col gap-1 overflow-y-auto">
        {DEMO_GUIDE.map((st) => {
          const on = active === st.n;
          return (
            <li key={st.n} data-guide-step={st.n} className={`rounded-md p-2 border border-solid ${on ? 'border-white/60 bg-white/10' : 'border-transparent'}`}>
              <div className="flex items-start gap-2">
                <span className={`shrink-0 mt-px inline-flex items-center justify-center size-5 rounded-full text-sm font-semibold ${on ? 'bg-white text-black' : 'bg-white/15 text-white'}`}>{st.n}</span>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{st.title}</span>
                    <span className="shrink-0 text-sm text-white/60">
                      {stepDayLabel(st.day)} · {PERSONA_SHORT[st.persona]}
                    </span>
                  </div>
                  <p className="m-0 text-sm leading-[1.35] text-white/80">{st.body}</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <button
                      type="button"
                      data-guide-jump={st.n}
                      onClick={() => go(st.n, st.jump)}
                      className="rounded-sm border border-solid border-white bg-white text-black px-1.5 py-0.5 text-sm cursor-pointer"
                    >
                      {st.jump.label} →
                    </button>
                    {st.also.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => go(st.n, a)}
                        className="rounded-sm border border-solid border-white/30 bg-transparent text-white px-1.5 py-0.5 text-sm cursor-pointer"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="m-0 px-3 py-2 text-sm text-white/50 border-t border-solid border-white/15 border-x-0 border-b-0 shrink-0">
        Each jump sets persona, day and EN. Reset demo clears saved listings, commits and price edits.
      </p>
    </div>
  );
}
