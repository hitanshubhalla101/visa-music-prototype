import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { BEAT } from './beat';

/**
 * The sound pulse: the one visual thread through every screen. Nine bars and a core dot that
 * morph between shapes on springs:
 *   dot      a beating dot that emits a ring on every beat (idle, invitation)
 *   rest     a still dot (edge states: calm, no rings)
 *   wave     a travelling waveform (waiting in the queue)
 *   bars     an equalizer (working: checking, confirming)
 *   progress bars that light up left to right (forms)
 *   burst    a full equalizer and wide rings (success), which settles back to a dot after 4 beats
 */
export type PulseShape = 'dot' | 'rest' | 'wave' | 'bars' | 'progress' | 'burst';

const N = 9;
const AMP = [0.45, 0.8, 0.55, 1, 0.7, 0.95, 0.5, 0.85, 0.4];
const WAVE = Array.from({ length: N }, (_, i) => 0.35 + 0.65 * Math.sin(((i + 0.5) / N) * Math.PI));

/** 'burst' plays for four beats, then settles into 'dot'. */
export function useSettledShape(shape: PulseShape) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    setSettled(false);
    if (shape !== 'burst') return;
    const t = setTimeout(() => setSettled(true), BEAT * 4);
    return () => clearTimeout(t);
  }, [shape]);
  return shape === 'burst' && settled ? 'dot' : shape;
}

const LABEL: Record<PulseShape, string> = {
  dot: '', rest: '', wave: 'Waiting', bars: 'Working', progress: 'Progress', burst: 'Success',
};

export function Pulse({
  shape = 'dot', progress = 0, size = 'md', vt = false, className = '',
}: {
  shape?: PulseShape; progress?: number; size?: 'sm' | 'md' | 'lg'; vt?: boolean; className?: string;
}) {
  const s = useSettledShape(shape);
  const lit = Math.round(Math.max(0, Math.min(1, progress)) * N);
  return (
    <span
      className={`vm-pulse vm-${size} ${vt ? 'vm-vt' : ''} ${className}`}
      data-shape={s}
      role={s === 'progress' ? 'progressbar' : undefined}
      aria-valuemin={s === 'progress' ? 0 : undefined}
      aria-valuemax={s === 'progress' ? 100 : undefined}
      aria-valuenow={s === 'progress' ? Math.round(progress * 100) : undefined}
      aria-label={s === 'progress' ? LABEL.progress : undefined}
      aria-hidden={s === 'progress' ? undefined : true}
    >
      <span className="vm-rings" data-beat="loop"><i /><i /></span>
      <span className="vm-core"><b data-beat="loop" /></span>
      {AMP.map((amp, i) => (
        <span
          key={i}
          className="vm-bar"
          style={{ '--i': i, '--x': i - (N - 1) / 2, '--ax': Math.abs(i - (N - 1) / 2), '--amp': amp, '--wv': WAVE[i].toFixed(3), '--on': i < lit ? 1 : 0 } as CSSProperties}
        >
          <b data-beat="loop" />
        </span>
      ))}
    </span>
  );
}

// ── Journey screens set the pulse's shape; the shell renders it on the card's edge ──
interface PulseState { shape: PulseShape; progress: number }
const PulseCtx = createContext<((p: PulseState) => void) | null>(null);

export function PulseProvider({ children, render }: { children: ReactNode; render: (p: PulseState) => ReactNode }) {
  const [p, setP] = useState<PulseState>({ shape: 'dot', progress: 0 });
  const set = useMemo(() => (n: PulseState) => setP((o) => (o.shape === n.shape && o.progress === n.progress ? o : n)), []);
  return (
    <PulseCtx.Provider value={set}>
      {render(p)}
      {children}
    </PulseCtx.Provider>
  );
}

/** Call from a journey screen: `usePulse('progress', 0.4)`. */
export function usePulse(shape: PulseShape, progress = 0) {
  const set = useContext(PulseCtx);
  useEffect(() => { set?.({ shape, progress }); }, [set, shape, progress]);
}

export function PulseBadge({ shape, progress }: PulseState) {
  const s = useSettledShape(shape);
  return (
    <div className="vm-badge vm-vt" data-shape={s}>
      <Pulse shape={s} progress={progress} size="lg" />
    </div>
  );
}
