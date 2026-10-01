import { useEffect, useRef, type ReactNode } from 'react';
import { mountFilm } from './engine';
import type { Variant } from './world';
import './film.css';

/**
 * The scroll story at the top of each landing page. Children are the beats:
 * `.beat.b-hero` first, then `.beat.b-step`s, each with a `.beat-box` around its copy.
 * Copy stays live HTML; the engine only drives opacity, transforms and the canvas.
 */
export function ArenaFilm({ variant, partner, label, children }: { variant: Variant; partner: string; label: string; children: ReactNode }) {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pins = useRef<HTMLDivElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const snd = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sec.current || !stage.current || !pins.current) return;
    return mountFilm({
      variant,
      section: sec.current,
      stage: stage.current,
      pinsWrap: pins.current,
      side: side.current,
      cue: cue.current,
      soundBtn: snd.current,
      labels: { partner },
    });
  }, [variant, partner]);

  return (
    <section ref={sec} className="cine" aria-label={label}>
      <div ref={stage} className="cine-stage">
        <div className="cine-scrim" aria-hidden="true" />
        <div className="cine-hero-side" aria-hidden="true" />
        <div ref={side} className="cine-side" aria-hidden="true" />
        <div ref={pins} className="cine-pins" aria-hidden="true" />
        {children}
        <button ref={snd} type="button" className="snd" aria-pressed="false" hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          </svg>
          <span>Sound</span>
        </button>
        <div ref={cue} className="cine-cue" aria-hidden="true">
          SCROLL
        </div>
      </div>
    </section>
  );
}

/** One step beat: eyebrow, headline, one or two sentences. */
export function StepBeat({ n, eyebrow, title, children, cta }: { n?: string; eyebrow: string; title: string; children?: ReactNode; cta?: ReactNode }) {
  return (
    <section className="beat b-step">
      <div className="beat-box">
        <div className="eyebrow">
          {n && <b>{n}</b>}
          {n && ' · '}
          {eyebrow}
        </div>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
        {cta && <div className="mt-6 flex flex-wrap gap-3">{cta}</div>}
      </div>
    </section>
  );
}
