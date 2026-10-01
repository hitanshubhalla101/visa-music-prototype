import { useState, type FormEvent, type ReactNode } from 'react';
import type { CampaignConfig } from '../config/campaign';
import { DEMO_ENTRANT, type Entrant } from '../state/DemoContext';
import { dateLong } from '../lib/format';
import { IconArrow, IconCheck, IconLock, IconMail } from './Icons';
import { PresenterRow, ScreenTitle, SuccessCheck } from './Journey';
import { BEAT, STEP } from '../motion/beat';
import { usePulse } from '../motion/Pulse';
import { BeatWords, Roll } from '../motion/Text';

export function EligibleSweeps({ onContinue }: { onContinue: () => void }) {
  usePulse('dot');
  return (
    <div className="py-2 text-center">
      <SuccessCheck />
      <h1 className="display mt-5 text-[30px] sm:text-[34px]"><BeatWords parts="You’re eligible to enter." /></h1>
      <p className="mx-auto mt-2 max-w-sm text-[15.5px] leading-relaxed text-dim">Next, tell us where to reach you if you’re selected.</p>
      <button type="button" className="btn btn-primary btn-block mt-7" onClick={onContinue}>
        Continue <IconArrow size={18} />
      </button>
    </div>
  );
}

// ── Registration form ─────────────────────────────────────────────────────────
const US_STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Mexico', 'Brazil', 'Australia', 'Japan', 'Germany', 'France'];
const LANGS = ['English', 'Español', 'Português', 'Français', '日本語', 'Deutsch'];
const REQUIRED: Array<keyof Entrant> = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'region', 'postal', 'country'];

function validate(e: Entrant) {
  const err: Partial<Record<keyof Entrant, string>> = {};
  REQUIRED.forEach((k) => { if (!e[k].trim()) err[k] = 'Required'; });
  if (e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.email)) err.email = 'Enter a valid email address.';
  if (e.phone && e.phone.replace(/\D/g, '').length < 7) err.phone = 'Enter a valid phone number.';
  return err;
}

function Field({ label, error, optional, children, className = '', i }: { label: string; error?: string; optional?: boolean; children: ReactNode; className?: string; i?: number }) {
  return (
    // fields slide in one after another on the beat grid
    <label className={`field ${className} ${i != null ? 'beat-in' : ''}`} data-beat={i != null ? 'enter' : undefined} style={i != null ? { animationDelay: `${i * STEP}ms` } : undefined}>
      <span>
        {label}
        {optional && <em className="ml-1.5 not-italic text-mute">(optional)</em>}
      </span>
      {children}
      {error && <em className="mt-1.5 block text-[12.5px] not-italic text-err">{error}</em>}
    </label>
  );
}

export function EntryForm({ initial, onSubmit, presenter }: { initial: Entrant; onSubmit: (e: Entrant) => void; presenter: boolean }) {
  const [e, setE] = useState<Entrant>(initial);
  const [err, setErr] = useState<Partial<Record<keyof Entrant, string>>>({});
  const [tried, setTried] = useState(false);
  const set = (k: keyof Entrant) => (ev: { target: { value: string } }) => {
    const next = { ...e, [k]: ev.target.value };
    if (k === 'country') next.region = '';
    setE(next);
    if (tried) setErr(validate(next));
  };
  const complete = REQUIRED.filter((k) => e[k].trim()).length / REQUIRED.length;
  usePulse('progress', complete);
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    setTried(true);
    const v = validate(e);
    setErr(v);
    if (Object.keys(v).length === 0) onSubmit(e);
    else document.getElementById(`f-${Object.keys(v)[0]}`)?.focus();
  };
  const inp = (k: keyof Entrant, props: Record<string, unknown> = {}) => (
    <input id={`f-${k}`} className="input" value={e[k]} onChange={set(k)} aria-invalid={!!err[k]} {...props} />
  );
  const us = e.country === 'United States';

  return (
    <form onSubmit={submit} noValidate>
      <ScreenTitle eyebrow="Step 3 · Your details" title="Complete your entry">
        We’ll only use these details to administer the sweepstakes and contact you if you’re selected.
      </ScreenTitle>

      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-[12px] text-mute">
          <span>Required fields</span><span className="tabular-nums">{Math.round(complete * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out" style={{ width: `${complete * 100}%` }} />
        </div>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-mute">Contact</legend>
        <Field i={0} label="First name" error={err.firstName}>{inp('firstName', { autoComplete: 'given-name' })}</Field>
        <Field i={1} label="Last name" error={err.lastName}>{inp('lastName', { autoComplete: 'family-name' })}</Field>
        <Field i={2} label="Email address" error={err.email} className="sm:col-span-2">{inp('email', { type: 'email', autoComplete: 'email', inputMode: 'email' })}</Field>
        <Field i={3} label="Phone number" error={err.phone} className="sm:col-span-2">{inp('phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}</Field>
      </fieldset>

      <fieldset className="mt-7 grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-mute">Address</legend>
        <Field i={4} label="Country" error={err.country} className="sm:col-span-2">
          <select id="f-country" className="input" value={e.country} onChange={set('country')}>
            {COUNTRIES.map((c) => <option key={c} className="bg-panel">{c}</option>)}
          </select>
        </Field>
        <Field i={5} label="Street address" error={err.address1} className="sm:col-span-2">{inp('address1', { autoComplete: 'address-line1' })}</Field>
        <Field i={6} label="Address line 2" optional className="sm:col-span-2">{inp('address2', { autoComplete: 'address-line2' })}</Field>
        <Field i={7} label="City" error={err.city} className="sm:col-span-2">{inp('city', { autoComplete: 'address-level2' })}</Field>
        <Field i={8} label={us ? 'State' : 'State / Province'} error={err.region}>
          {us ? (
            <select id="f-region" className="input" value={e.region} onChange={set('region')} aria-invalid={!!err.region}>
              <option value="" className="bg-panel">Select</option>
              {US_STATES.map((s) => <option key={s} className="bg-panel">{s}</option>)}
            </select>
          ) : inp('region', { autoComplete: 'address-level1' })}
        </Field>
        <Field i={9} label={us ? 'ZIP code' : 'Postal code'} error={err.postal}>{inp('postal', { autoComplete: 'postal-code' })}</Field>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-mute">Preferences</legend>
        <Field i={10} label="Preferred language" optional>
          <select id="f-language" className="input" value={e.language} onChange={set('language')}>
            <option value="" className="bg-panel">No preference</option>
            {LANGS.map((l) => <option key={l} className="bg-panel">{l}</option>)}
          </select>
        </Field>
      </fieldset>

      <button type="submit" className="btn btn-primary btn-block mt-8">
        Continue to rules &amp; consent <IconArrow size={18} />
      </button>
      <button type="button" className="mt-3 w-full text-center text-[13px] text-white/60 underline-offset-4 hover:text-white hover:underline" onClick={() => { setE(DEMO_ENTRANT); setErr({}); }}>
        Fill with demo entrant (Jordan Lee)
      </button>
      <PresenterRow show={presenter}>
        <button type="button" className="presenter-chip" onClick={() => onSubmit(DEMO_ENTRANT)}>Skip with demo entrant</button>
      </PresenterRow>
    </form>
  );
}

// ── Rules & consent ───────────────────────────────────────────────────────────
function Check({ checked, onChange, children, id }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer gap-3.5 rounded-xl p-2 -m-2 hover:bg-white/[0.03]">
      <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-[var(--accent)]/30 ${checked ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]' : 'border-white/35'}`} aria-hidden="true">
        {checked && <IconCheck size={15} strokeWidth={3} />}
      </span>
      <span className="text-[14.5px] leading-relaxed text-white/90">{children}</span>
    </label>
  );
}

export function ConsentBlock({
  c, entrant, marketing, setMarketing, onSubmit, onEdit, presenter,
}: {
  c: CampaignConfig; entrant: Entrant; marketing: boolean; setMarketing: (v: boolean) => void; onSubmit: () => void; onEdit: () => void; presenter: boolean;
}) {
  const [rules, setRules] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = rules && privacy;
  usePulse('progress', (Number(rules) + Number(privacy)) / 2);
  const submit = () => {
    if (!ready) return;
    setBusy(true);
    setTimeout(onSubmit, 1300);
  };
  return (
    <div>
      <ScreenTitle eyebrow="Step 4 · Rules & consent" title="Review and submit" />

      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[14px]">
        <div className="min-w-0">
          <div className="truncate font-medium">{entrant.firstName} {entrant.lastName}</div>
          <div className="truncate text-mute">{entrant.email}</div>
        </div>
        <button type="button" onClick={onEdit} className="shrink-0 text-[13px] font-medium text-[var(--accent)] hover:underline">Edit</button>
      </div>

      <section aria-labelledby="req-h" className="rounded-2xl border border-white/15 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="req-h" className="text-[13px] font-semibold uppercase tracking-[0.14em]">Required to enter</h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">Required</span>
        </div>
        <div className="grid gap-4">
          <Check id="c-rules" checked={rules} onChange={setRules}>
            I have read and agree to the <a href={c.campaignRulesUrl} className="font-medium text-[var(--accent)] underline underline-offset-2">Official Rules</a> and confirm that I meet the eligibility requirements.
          </Check>
          <Check id="c-privacy" checked={privacy} onChange={setPrivacy}>
            I acknowledge that my entry information will be shared with the sweepstakes administrator, Don Jagoda Associates, and handled according to the <a href={c.privacyUrl} className="font-medium text-[var(--accent)] underline underline-offset-2">Visa Privacy Notice</a>.
          </Check>
        </div>
      </section>

      {c.marketingOptInEnabled && (
        <section aria-labelledby="opt-h" className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="opt-h" className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/80">Stay in touch with Visa</h2>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-semibold text-white/70">Optional</span>
          </div>
          <Check id="c-mkt" checked={marketing} onChange={setMarketing}>
            Yes, I would like to receive marketing emails from Visa about offers, promotions, events and experiences. I understand that I can unsubscribe at any time.
          </Check>
          <p className="mt-3 pl-[38px] text-[12.5px] text-mute">Not required to enter. Your chance of winning is the same either way.</p>
        </section>
      )}

      <button type="button" className="btn btn-primary btn-block mt-7" disabled={!ready || busy} onClick={submit}>
        {busy ? 'Submitting…' : 'Submit Entry'}
        {!busy && <IconArrow size={18} />}
      </button>
      {!ready && <p className="mt-2.5 text-center text-[12.5px] text-mute">Tick both required boxes to submit.</p>}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-mute"><IconLock size={14} /> Your entry is stored securely.</p>
      <PresenterRow show={presenter}>
        <span className="text-[12px] text-[#e3d6ff]">Marketing consent: <strong>{marketing ? 'opted in' : 'not selected'}</strong> — entry is accepted either way.</span>
      </PresenterRow>
    </div>
  );
}

// ── Confirmation ──────────────────────────────────────────────────────────────
export function Confirmation({ c, entryRef, email, onExplore }: { c: CampaignConfig; entryRef: string; email: string; onExplore: () => void }) {
  // the pulse bursts into an equalizer, then the message settles in on the third beat
  usePulse('burst');
  return (
    <div className="text-center">
      <SuccessCheck size={84} />
      <h1 className="display mt-5 text-[34px] sm:text-[40px]"><BeatWords parts="You’re entered." start={BEAT * 2} /></h1>
      <p className="mx-auto mt-3 max-w-sm text-[15.5px] leading-relaxed text-dim">
        Thank you for entering for a chance to attend {c.artistName}.
      </p>
      <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-dim">
        DJA will administer the drawing and contact selected winners according to the Official Rules.
      </p>
      <div className="mx-auto mt-7 rounded-2xl border border-[var(--accent)]/45 bg-[var(--accent)]/10 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Entry reference</div>
        <div className="mt-1.5 select-all font-mono text-[28px] font-semibold"><Roll value={entryRef} /></div>
      </div>
      {email && (
        <p className="mt-4 inline-flex items-center gap-2 text-[13.5px] text-dim"><IconMail size={16} /> Confirmation sent to {email}</p>
      )}
      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[14px] leading-relaxed text-white/85">
        No further action is required. If selected, you will be contacted according to the Official Rules.
        {c.drawingDate && <span className="mt-1 block text-[13px] text-mute">Drawing on or about {dateLong(c.drawingDate)}.</span>}
      </div>
      <button type="button" className="btn btn-ghost btn-block mt-7" onClick={onExplore}>
        Explore More Visa Music Experiences <IconArrow size={18} />
      </button>
    </div>
  );
}

// ── DJA handoff: for the stakeholder, not the consumer ────────────────────────
const PIPE = [
  { t: 'Entry securely stored', d: 'Entrant details + consent record + entry reference. Card number is never stored.' },
  { t: 'Scheduled secure transfer', d: 'Batch file over SFTP / API (cadence to be confirmed).' },
  { t: 'Don Jagoda Associates', d: 'Sweepstakes administrator receives entrant file.' },
  { t: 'Entrant validation', d: 'De-duplication, eligibility and rules compliance.' },
  { t: 'Random drawing', d: 'Not first come, first served. Conducted by DJA.' },
  { t: 'Winner outreach / alternate process', d: 'Notification, verification, alternates if unclaimed.' },
];

export function DjaPipeline({ pending = false, compact = false }: { pending?: boolean; compact?: boolean }) {
  return (
    <ol className="relative">
      {PIPE.map((p, i) => {
        const st = pending ? (i === 0 ? 'done' : i === 1 ? 'pending' : 'todo') : i === 0 || i === 1 ? 'done' : 'todo';
        return (
          <li key={p.t} className="relative flex gap-3 pb-4 last:pb-0">
            {i < PIPE.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-px bg-note/30" aria-hidden="true" />}
            <span className={`relative z-10 mt-0.5 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
              st === 'done' ? 'border-ok bg-ok/20 text-ok' : st === 'pending' ? 'border-warn bg-warn/15 text-warn' : 'border-note/50 bg-panel text-note'}`}>
              {st === 'done' ? <IconCheck size={14} strokeWidth={3} /> : i + 1}
            </span>
            <div className="min-w-0">
              <div className={`font-semibold ${i === 2 ? 'uppercase tracking-[0.08em] text-[#e3d6ff]' : ''} ${compact ? 'text-[13px]' : 'text-[14.5px]'}`}>
                {p.t}
                {st === 'pending' && <span className="ml-2 rounded-full bg-warn/15 px-2 py-0.5 text-[10.5px] font-semibold normal-case tracking-normal text-warn">Pending · next batch 02:00</span>}
              </div>
              {!compact && <div className="mt-0.5 text-[12.5px] leading-snug text-mute">{p.d}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DjaHandoff({ c, entryRef, email, pending, presenter, onExplore }: { c: CampaignConfig; entryRef: string; email: string; pending: boolean; presenter: boolean; onExplore: () => void }) {
  return (
    <div>
      <Confirmation c={c} entryRef={entryRef} email={email} onExplore={onExplore} />
      {presenter && (
        <div className="anim-rise mt-8 rounded-2xl border border-dashed border-note/60 bg-[#1a1233]/70 p-5 text-left">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-note">Behind the scenes · stakeholder view</div>
            <span className="font-mono text-[11px] text-mute">{entryRef}</span>
          </div>
          <DjaPipeline pending={pending} />
        </div>
      )}
    </div>
  );
}
