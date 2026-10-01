import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import { STEP } from './beat';

type Part = string | { text: string; className?: string };

/**
 * A headline that builds word by word on the beat grid (one word per eighth note).
 * The words stay real text, so screen readers and copy/paste are unaffected.
 */
export function BeatWords({ parts, start = 0 }: { parts: Part | Part[]; start?: number }) {
  const list = (Array.isArray(parts) ? parts : [parts]).map((p) => (typeof p === 'string' ? { text: p } : p));
  let k = 0;
  return (
    <>
      {list.map((p, j) => (
        <Fragment key={j}>
          {p.text.split(/\s+/).filter(Boolean).map((w, i, arr) => {
            const n = k++;
            return (
              <Fragment key={i}>
                <span className={`bw ${p.className ?? ''}`} data-beat="enter" style={{ animationDelay: `${start + n * STEP}ms` }}>{w}</span>
                {(i < arr.length - 1 || j < list.length - 1) && ' '}
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </>
  );
}

/** Numbers roll up like an odometer: each digit spins from 0 (or its last value) to its target. */
export function Roll({ value, className = '' }: { value: string | number; className?: string }) {
  const text = String(value);
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    // first paint at zero, then roll to the value
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(text)));
    return () => cancelAnimationFrame(id);
  }, [text]);
  let d = 0;
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="roll-x">
        {text.split('').map((ch, i) => {
          if (!/\d/.test(ch)) return <span key={i}>{ch}</span>;
          const target = shown == null ? 0 : Number((shown[i] && /\d/.test(shown[i]) ? shown[i] : ch));
          return (
            <span key={i} className="roll-d" style={{ '--d': target, '--k': d++ } as CSSProperties}>
              <span className="ph">{ch}</span>
              <span className="strip">{DIGITS}</span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
const DIGITS = Array.from({ length: 10 }, (_, i) => <span key={i}>{i}</span>);
