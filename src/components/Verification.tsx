import { useEffect, useRef, useState, type FormEvent } from 'react';
import { TEST_CARDS, digits, formatCardNumber, formatExpiry, outcomeFor, type CardOutcome } from '../lib/demo';
import { n } from '../lib/format';
import { VisaMark } from './Header';
import { IconArrow, IconCard, IconLock, IconShield, IconUsers } from './Icons';
import { PresenterRow, ScreenTitle, Spinner, SuccessCheck } from './Journey';
import { useLatest } from '../lib/useLatest';
import { STEP } from '../motion/beat';
import { usePulse } from '../motion/Pulse';
import { BeatWords, Roll } from '../motion/Text';

// ── Queue ─────────────────────────────────────────────────────────────────────
const START = 1284;
export function QueueScreen({ onAdmit, presenter, product }: { onAdmit: () => void; presenter: boolean; product: string }) {
  const [pos, setPos] = useState(START);
  const done = pos <= 0;
  const admit = useLatest(onAdmit);
  usePulse(done ? 'bars' : 'wave');
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => admit.current(), 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPos((p) => Math.max(0, p - (8 + Math.floor(Math.random() * 16)))), 850);
    return () => clearTimeout(t);
  }, [pos, done, admit]);
  const progress = 1 - pos / START;
  const mins = Math.max(1, Math.ceil(pos / 642));
  return (
    <div>
      <div className="mb-7 flex items-center gap-4">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
          {!done && <span className="absolute inset-0 rounded-full bg-[var(--accent)]/20" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />}
          <IconUsers size={26} />
        </span>
        <div>
          <div className="eyebrow">{product}</div>
          <h1 key={done ? 'turn' : 'line'} className="display mt-1 text-[30px] sm:text-[36px]"><BeatWords parts={done ? 'It’s your turn' : 'You’re in line'} /></h1>
        </div>
      </div>
      {!done ? (
        <p className="text-[15.5px] leading-relaxed text-dim">Demand is high. You’re in the queue for {product}.</p>
      ) : (
        <p className="text-[15.5px] leading-relaxed text-dim">Thanks for waiting. Taking you to the next step…</p>
      )}

      <div className="mt-7 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[12px] text-mute">Queue position</div>
          <div className="mt-1 font-mono text-[30px] font-semibold tabular-nums tracking-tight">{done ? '—' : <Roll value={n(pos)} />}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[12px] text-mute">Estimated wait</div>
          <div className="mt-1 font-mono text-[30px] font-semibold tabular-nums tracking-tight">
            {done ? 'Now' : <><Roll value={mins} /> <span className="text-[16px] font-normal text-dim">{mins === 1 ? 'minute' : 'minutes'}</span></>}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Queue progress">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-strong)] to-[var(--accent-2)] transition-[width] duration-700 ease-out" style={{ width: `${Math.max(3, progress * 100)}%` }} />
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ animation: 'shimmer 1.8s linear infinite' }} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[14px] leading-relaxed text-white/85">
        <IconCard size={20} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <span>Have your eligible Visa card ready. Please do not refresh the page.</span>
      </div>

      <PresenterRow show={presenter}>
        <button type="button" className="presenter-chip" onClick={() => setPos(0)}>Advance Queue</button>
        <button type="button" className="presenter-chip" onClick={onAdmit}>Skip to verification</button>
      </PresenterRow>
    </div>
  );
}

// ── Human verification (simulated; not a CAPTCHA) ─────────────────────────────
export function HumanCheck({ onPass, onFail, presenter }: { onPass: () => void; onFail: () => void; presenter: boolean }) {
  const [state, setState] = useState<'idle' | 'checking' | 'ok'>('idle');
  const timers = useRef<number[]>([]);
  const pass = useLatest(onPass);
  usePulse(state === 'checking' ? 'bars' : 'dot');
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = () => {
    setState('checking');
    timers.current.push(window.setTimeout(() => setState('ok'), 1000));
    timers.current.push(window.setTimeout(() => pass.current(), 1800));
  };
  return (
    <div>
      <ScreenTitle eyebrow="Step 1 · Security" title="Quick security check">
        Please confirm you’re a real person to continue.
      </ScreenTitle>
      <div className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center">
          {state === 'idle' && <IconShield size={34} className="text-[var(--accent)]" />}
          {state === 'checking' && <Spinner size={40} />}
          {state === 'ok' && <SuccessCheck size={44} />}
        </span>
        <div className="text-[14.5px] leading-snug">
          <div className="font-medium">{state === 'ok' ? 'Thanks — you’re verified' : state === 'checking' ? 'Checking…' : 'Protecting fans from bots'}</div>
          <div className="mt-0.5 text-[13px] text-mute">This helps keep access fair for real fans.</div>
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-block mt-6" onClick={run} disabled={state !== 'idle'}>
        Verify &amp; Continue <IconArrow size={18} />
      </button>
      <PresenterRow show={presenter}>
        <button type="button" className="presenter-chip" onClick={onPass}>Skip check</button>
        <button type="button" className="presenter-chip" onClick={onFail}>Simulate failed check</button>
      </PresenterRow>
    </div>
  );
}

// ── Visa card verification (VCES simulation) ──────────────────────────────────
const LABELS: Record<'access' | 'sweeps', Record<Exclude<CardOutcome, 'unavailable'>, string>> = {
  access: { eligible: 'Use Eligible Test Card', ineligible: 'Use Ineligible Test Card', used: 'Use Previously Used Test Card' },
  sweeps: { eligible: 'Use Eligible Test Card', ineligible: 'Use Ineligible Test Card', used: 'Use Previously Registered Test Card' },
};

export function CardVerify({
  flow, onSubmit, presenter, stepLabel, lead,
}: {
  flow: 'access' | 'sweeps'; onSubmit: (o: CardOutcome) => void; presenter: boolean; stepLabel: string; lead: string;
}) {
  // Card details live only in this component's state and are dropped on unmount.
  const [num, setNum] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [err, setErr] = useState<{ num?: string; exp?: string; cvv?: string; form?: string }>({});
  // the pulse fills as the three card fields are completed
  usePulse('progress', (Number(digits(num).length === 16) + Number(exp.length === 5) + Number(cvv.length === 3)) / 3);

  const fill = (o: CardOutcome) => {
    const c = TEST_CARDS[o];
    setNum(c.number); setExp(c.expiry); setCvv(c.cvv); setErr({});
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const e2: typeof err = {};
    const d = digits(num);
    const [mm, yy] = exp.split('/').map(Number);
    if (d.length !== 16) e2.num = 'Enter a 16-digit card number.';
    if (!mm || mm > 12 || exp.length !== 5) e2.exp = 'Use MM/YY.';
    else if (2000 + yy < 2026) e2.exp = 'This card has expired.';
    if (digits(cvv).length !== 3) e2.cvv = '3 digits.';
    const o = outcomeFor(num);
    if (!e2.num && !o) e2.form = 'This demo only accepts the test cards below. Please do not enter a real card.';
    setErr(e2);
    if (Object.keys(e2).length === 0 && o) onSubmit(o);
  };
  const shown = formatCardNumber(num) || '•••• •••• •••• ••••';

  return (
    <form onSubmit={submit} noValidate>
      <ScreenTitle eyebrow={stepLabel} title="Verify your Visa card">{lead}</ScreenTitle>

      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-warn/40 bg-warn/10 px-3.5 py-2.5 text-[13px] font-medium text-[#ffd79a]">
        <IconLock size={16} className="shrink-0" /> Demo only — do not enter a real card.
      </div>

      <div className="relative mb-6 aspect-[1.7/1] max-h-44 w-full overflow-hidden rounded-2xl border border-white/15 p-5 shadow-2xl sm:max-h-48"
        style={{ background: 'linear-gradient(135deg,#1434cb 0%,#1a1f71 55%,#0b0f33 100%)' }} aria-hidden="true">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="h-7 w-10 rounded-md bg-gradient-to-br from-[#f3d27a] to-[#b8912f] opacity-90" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">Test card</span>
          </div>
          <div className="font-mono text-[17px] tracking-[0.12em] text-white/95 sm:text-[19px]">{shown}</div>
          <div className="flex items-end justify-between text-[11px] text-white/70">
            <span className="font-mono">{exp || 'MM/YY'}</span>
            <VisaMark className="text-[24px] text-white" />
          </div>
        </div>
      </div>

      <label className="field beat-in" data-beat="enter">
        <span>Card number</span>
        <input className="input font-mono tracking-wider" inputMode="numeric" autoComplete="off" placeholder="4000 0000 0000 0000"
          value={num} onChange={(e) => setNum(formatCardNumber(e.target.value))} aria-invalid={!!err.num} aria-describedby="err-num" />
        {err.num && <em id="err-num" className="mt-1.5 block text-[12.5px] not-italic text-err">{err.num}</em>}
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="field beat-in" data-beat="enter" style={{ animationDelay: `${STEP}ms` }}>
          <span>Expiry</span>
          <input className="input font-mono" inputMode="numeric" autoComplete="off" placeholder="MM/YY"
            value={exp} onChange={(e) => setExp(formatExpiry(e.target.value))} aria-invalid={!!err.exp} />
          {err.exp && <em className="mt-1.5 block text-[12.5px] not-italic text-err">{err.exp}</em>}
        </label>
        <label className="field beat-in" data-beat="enter" style={{ animationDelay: `${STEP * 2}ms` }}>
          <span>CVV</span>
          <input className="input font-mono" inputMode="numeric" autoComplete="off" placeholder="123" type="password"
            value={cvv} onChange={(e) => setCvv(digits(e.target.value).slice(0, 3))} aria-invalid={!!err.cvv} />
          {err.cvv && <em className="mt-1.5 block text-[12.5px] not-italic text-err">{err.cvv}</em>}
        </label>
      </div>
      {err.form && <p className="mt-4 rounded-xl border border-err/40 bg-err/10 px-3.5 py-2.5 text-[13.5px] text-[#ffc2c2]" role="alert">{err.form}</p>}

      <button type="submit" className="btn btn-primary btn-block mt-6">
        Verify card <IconArrow size={18} />
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-mute">
        <IconLock size={14} /> Checked securely with Visa. Your card number is not stored.
      </p>

      <div className="mt-7 rounded-2xl border border-dashed border-white/15 p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">Demo test cards</div>
        <div className="grid gap-2">
          {(Object.keys(LABELS[flow]) as Array<keyof (typeof LABELS)['access']>).map((k) => (
            <button key={k} type="button" onClick={() => fill(k)}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-[13.5px] hover:border-white/30 hover:bg-white/[0.06]">
              <span className="font-medium">{LABELS[flow][k]}</span>
              <span className="font-mono text-[12px] text-mute">•••• {TEST_CARDS[k].number.slice(-4)}</span>
            </button>
          ))}
        </div>
      </div>

      <PresenterRow show={presenter}>
        <button type="button" className="presenter-chip" onClick={() => fill('unavailable')}>Load “service unavailable” card</button>
      </PresenterRow>
    </form>
  );
}

// ── Checking eligibility ──────────────────────────────────────────────────────
export function Checking({ onDone }: { onDone: () => void }) {
  const done = useLatest(onDone);
  usePulse('bars');
  useEffect(() => {
    const t = setTimeout(() => done.current(), 2000);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <div className="py-6 text-center">
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <Spinner size={80} />
        <IconCard size={28} className="absolute text-[var(--accent)]" />
      </div>
      <h1 className="display text-[28px] sm:text-[32px]"><BeatWords parts="Checking eligibility…" /></h1>
      <p className="mt-2 text-[15px] text-dim">This usually takes a few seconds.</p>
      <div className="mx-auto mt-7 h-1.5 max-w-[240px] overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 rounded-full bg-[var(--accent)]" style={{ animation: 'shimmer 1.2s ease-in-out infinite' }} />
      </div>
    </div>
  );
}
