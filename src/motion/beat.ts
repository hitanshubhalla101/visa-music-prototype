/**
 * The beat: 120 BPM, one beat every 500 ms. Loops are phase-locked to the document timeline so
 * every pulse, ring and idle button hits the same downbeat; entrances start on the next eighth
 * note. Screen changes run as view transitions that open from where you tapped, or from the pulse.
 */
import { flushSync } from 'react-dom';

export const BEAT = 500;
/** Stagger unit for words and fields: an eighth note, half a beat (still on the 120 BPM grid). */
export const STEP = BEAT / 2;

export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const SEL = '[data-beat], .btn-primary';
let lastPointer = { x: 0, y: 0, t: -1e9 };

function lock(el: Element) {
  const enter = el.getAttribute('data-beat') === 'enter';
  const now = (document.timeline.currentTime as number | null) ?? performance.now();
  for (const a of el.getAnimations({ subtree: !enter })) {
    // Loops share one phase (start at time 0); entrances wait for the next eighth note.
    a.startTime = enter ? Math.ceil(now / STEP) * STEP : 0;
  }
}

/** Call once at start-up. */
export function installBeatSync() {
  if (typeof window === 'undefined') return;
  addEventListener('pointerdown', (e) => { lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() }; }, { capture: true, passive: true });
  if (reducedMotion() || !('getAnimations' in Element.prototype)) return;
  const scan = (root: Element) => {
    if (root.matches(SEL)) lock(root);
    root.querySelectorAll(SEL).forEach(lock);
  };
  new MutationObserver((ms) => {
    for (const m of ms) m.addedNodes.forEach((n) => { if (n instanceof Element) scan(n); });
  }).observe(document.body, { childList: true, subtree: true });
  scan(document.body);
}

interface VT { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> }
type VTDocument = Document & { startViewTransition?: (cb: () => void) => VT };

/**
 * Run a state change as a screen transition: the next screen opens as a circle from the last tap
 * (if recent) or from the pulse, in one beat. Falls back to an instant change.
 */
export function screenTransition(update: () => void) {
  const d = document as VTDocument;
  if (reducedMotion() || !d.startViewTransition) { update(); return; }
  let x = innerWidth / 2, y = innerHeight / 2;
  const pulse = document.querySelector('.vm-vt');
  if (performance.now() - lastPointer.t < 1200) { x = lastPointer.x; y = lastPointer.y; }
  else if (pulse) { const r = pulse.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { x = r.left + r.width / 2; y = r.top + r.height / 2; } }
  const s = document.documentElement.style;
  s.setProperty('--vt-x', `${x}px`);
  s.setProperty('--vt-y', `${y}px`);
  s.setProperty('--vt-r', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 8}px`);
  const t = d.startViewTransition(() => flushSync(update));
  // a transition interrupted by the next one is skipped; the update still happens, so that's fine
  const ok = () => {};
  t.ready.catch(ok); t.finished.catch(ok); t.updateCallbackDone.catch(ok);
}
