/**
 * Cinematic scroll engine (ported from the cinematic-scroll-story starter).
 *
 * scroll ─▶ u ─▶ camParam (hold 45%, ease 55%) ─▶ spring ─▶ cp ─▶ camAt(cp) ─▶ one fragment shader
 * cp ─▶ beat opacity ─▶ active beat ─▶ callouts projected from 3-D points
 * Events run on clocks (S) once the camera arrives, and rewind when it leaves.
 *
 * Kept from the engine: spring camera, camAt paths, clocks, callout projection/placement,
 * resolution calibration, settle, reduced motion, no-WebGL fallback, sound plumbing, ?debug.
 * Replaced: the world (world.ts), the shots, the clocks' events, the pins, the sound's instrument.
 */
import { DRAW_AT, DRAW_SPOTS, FRAG, SHOTS, SUBJECT_TOP, TAP_SPOT, UNIFORMS, WIN_SPOTS, armOf, type Shot, type V3, type Variant } from './world';

export interface FilmOptions {
  variant: Variant;
  section: HTMLElement;
  stage: HTMLElement;
  pinsWrap: HTMLElement;
  side?: HTMLElement | null;
  cue?: HTMLElement | null;
  soundBtn?: HTMLButtonElement | null;
  labels: { partner: string };
}

interface Pin {
  node: HTMLElement;
  span: HTMLElement;
  beat: number;
  at: () => V3;
  when?: () => boolean;
  delay?: number;
  shown: boolean;
  tf: string;
  key: string;
  w: number;
  h: number;
  preferLeft: boolean;
}

interface Cam { p: V3; t: V3; f: number; s: number; cp: number; time: number }

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const sm = (a: number, b: number, x: number) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const norm = (v: V3): V3 => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const toward = (x: number, target: number, up: number, down: number, dt: number) => x + clamp(target - x, -down * dt, up * dt);

export function mountFilm(o: FilmOptions): () => void {
  const { section: sec, stage, pinsWrap, side, cue, soundBtn, variant } = o;
  // A fresh canvas per mount: a context lost on unmount can never be reused.
  const cv = document.createElement('canvas');
  cv.className = 'cine-gl'; cv.setAttribute('aria-hidden', 'true');
  stage.insertBefore(cv, stage.firstChild);
  const beats = Array.from(stage.querySelectorAll<HTMLElement>('.beat'));
  const K = SHOTS[variant];
  const NB = Math.min(beats.length, K.length), TAIL = 1.0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEBUG = /[?&]debug\b/.test(location.search);
  const ACCESS = variant === 'access';
  const VERIFY = ACCESS ? 2 : 1;
  const cleanups: Array<() => void> = [];
  const on = (t: EventTarget, ev: string, fn: EventListener, opt?: AddEventListenerOptions) => {
    t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt));
  };
  sec.classList.add('live');
  sec.style.height = `${Math.round((NB - 1 + TAIL) * 105 + 100)}vh`;

  // ── 1. the shots ────────────────────────────────────────────────────────────
  let portrait = matchMedia('(max-aspect-ratio: 1/1)').matches, HFOV = portrait ? 12 : 17;
  const kp = (k: Shot) => (portrait && k.pm ? k.pm : k.p);
  const kt = (k: Shot) => (portrait && k.tm ? k.tm : k.t);
  const scrollU = () => {
    const span = sec.offsetHeight - innerHeight;
    return span <= 0 ? 0 : clamp(-sec.getBoundingClientRect().top / span, 0, 1) * (NB - 1 + TAIL);
  };
  const camParam = (u: number) => { const i = Math.floor(u); return i >= NB - 1 ? NB - 1 : i + ease(clamp((u - i - 0.45) / 0.55, 0, 1)); };
  const beatOpacity = (i: number, c: number) => 1 - sm(0.1, 0.34, Math.abs(c - i));
  let heroShift = 0.2, heroShiftS = 0.2;
  function camAt(cp: number) {
    const i = Math.min(Math.floor(cp), NB - 2), f = cp - i, g = 1 - f, A = K[i], B = K[i + 1];
    const ap = kp(A), bp = kp(B), at = kt(A), bt = kt(B);
    const quad = (a: V3, c: V3, b: V3) => [0, 1, 2].map((k) => g * g * a[k] + 2 * f * g * c[k] + f * f * b[k]) as V3;
    const cubic = (a: V3, c: V3, d: V3, b: V3) => [0, 1, 2].map((k) => g * g * g * a[k] + 3 * g * g * f * c[k] + 3 * g * f * f * d[k] + f * f * f * b[k]) as V3;
    const fy = bp[1] < ap[1] ? 1 - g * g : f * f;   // come down before going in, leave before going up
    return {
      p: B.via2 && B.via ? cubic(ap, B.via, B.via2, bp) : B.via ? quad(ap, B.via, bp) : [mix(ap[0], bp[0], f), mix(ap[1], bp[1], fy), mix(ap[2], bp[2], f)] as V3,
      t: B.tvia ? quad(at, B.tvia, bt) : [mix(at[0], bt[0], f), mix(at[1], bt[1], f), mix(at[2], bt[2], f)] as V3,
      f: mix(A.f, B.f, f),
      s: mix(A.lens ? heroShiftS : 0, B.lens ? heroShiftS : 0, f),
    };
  }
  function scrollToBeat(i: number) {
    const span = sec.offsetHeight - innerHeight;
    scrollTo({ top: sec.getBoundingClientRect().top + scrollY + ((i + 0.08) / (NB - 1 + TAIL)) * span, behavior: reduce ? 'auto' : 'smooth' });
  }
  on(stage, 'click', (e) => {
    const el = (e.target as HTMLElement).closest?.('[data-go]');
    if (el) { e.preventDefault(); scrollToBeat(+(el.getAttribute('data-go') || 0)); }
  });

  // ── 2. clocks: what happens once you arrive runs on time, not on scroll ──────
  const S = { rest: 0, open: 1, queue: 0, check: 0, code: 0, fill: 0, enter: 0, draw: 0, stage: 0.6 };
  function spot(): [number, number, number] {       // the drawing's spotlight: x, z, intensity
    const d = S.draw;
    const P = DRAW_SPOTS;
    let x: number, z: number;
    if (d < DRAW_AT[0]) {                              // it searches the plaza, then settles
      const k = d / DRAW_AT[0], e = ease(clamp(k * 1.25 - 0.25, 0, 1));
      const wx = 14 * Math.cos(k * 5.2), wz = 66 + 12 * Math.sin(k * 4.1);
      x = mix(wx, P[0][0], e); z = mix(wz, P[0][1], e);
    } else {
      let i = 0; while (i < P.length - 1 && d >= DRAW_AT[i + 1]) i++;
      if (i >= P.length - 1) { x = P[i][0]; z = P[i][1]; }
      else {
        const k = (d - DRAW_AT[i]) / (DRAW_AT[i + 1] - DRAW_AT[i]), e = ease(clamp((k - 0.3) / 0.7, 0, 1));
        x = mix(P[i][0], P[i + 1][0], e) + Math.sin(e * Math.PI) * 5; z = mix(P[i][1], P[i + 1][1], e);
      }
    }
    return [x, z, sm(0, 0.04, d) * (1 - sm(0.93, 1, d) * 0.6)];
  }
  const landed = () => DRAW_AT.reduce((n, a) => n + sm(a - 0.015, a + 0.015, S.draw), 0);
  // The hero gate, on the verify clock: A taps, amber, steps aside; B steps up, taps, blue; the gate opens.
  function amber(time: number) {
    const c = S.check;
    const flick = reduce ? 1 : 0.55 + 0.45 * (Math.sin(time * 31) > -0.2 ? 1 : 0.2);
    return sm(0.14, 0.18, c) * (1 - sm(0.42, 0.5, c)) * flick;
  }
  const blue = () => sm(0.8, 0.86, S.check);
  const gateOpen = () => (ACCESS ? sm(0.86, 0.95, S.check) : 0);
  function fanA(): [number, number, number, number] {   // x, z, arm, shown
    const c = S.check, e = sm(0.48, 0.62, c);
    return [TAP_SPOT[0] - 1.3 * e, TAP_SPOT[1] + 1.7 * e, sm(0.05, 0.16, c) * (1 - sm(0.4, 0.48, c)), 1];
  }
  // B walks in keyed to the camera's own move, so they always lead it through the doors (and rewind with it).
  function fanB(): [number, number, number, number] {
    const c = S.check, w = ACCESS && cam ? sm(3.0, 3.3, cam.cp) : 0;
    const z = TAP_SPOT[1] + 1.4 * (1 - sm(0.6, 0.72, c)) - 6.5 * w;
    return [TAP_SPOT[0], z, sm(0.72, 0.8, c) * (1 - sm(0, 0.15, w)), z > 36.5 ? 1 : 0];
  }
  const bandA = (): V3 => { const f = fanA(); return armOf(f[0], f[1], f[2]).band; };
  const bandB = (): V3 => { const f = fanB(); return armOf(f[0], f[1], f[2]).band; };
  function lit() {                                   // inside: already a full house at the front, filling
    return ACCESS ? mix(0.4, 1.06, S.fill) : 0.55;
  }
  const litPlaza = () => 0.06 + 0.52 * S.enter;       // outside, Register-to-Win: entries coming in
  const landedIn = (cp: number) => landed() * sm(3.3, 3.75, cp);

  // ── 3. setup: compile off-screen, measure, then fade in ──────────────────────
  let gl: WebGL2RenderingContext | null = null, prog: WebGLProgram | null = null, fsh: WebGLShader | null = null;
  const U: Record<string, WebGLUniformLocation | null> = {};
  let ready = false, destroyed = false;
  const px1 = new Uint8Array(4);
  let pcExt: { COMPLETION_STATUS_KHR: number } | null = null;
  function fail() { sec.classList.add('nogl'); cv.style.display = 'none'; gl = null; ready = false; }
  try { gl = cv.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' }); }
  catch { gl = null; }
  if (DEBUG && /[?&]nogl\b/.test(location.search)) gl = null;
  if (gl) {
    pcExt = gl.getExtension('KHR_parallel_shader_compile');
    const mk = (type: number, src: string) => { const s = gl!.createShader(type)!; gl!.shaderSource(s, src); gl!.compileShader(s); return s; };
    const vsh = mk(gl.VERTEX_SHADER, '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
    fsh = mk(gl.FRAGMENT_SHADER, FRAG);
    prog = gl.createProgram()!; gl.attachShader(prog, vsh); gl.attachShader(prog, fsh);
    gl.bindAttribLocation(prog, 0, 'a'); gl.linkProgram(prog);
    on(cv, 'webglcontextlost', (e) => { e.preventDefault(); fail(); });
  } else fail();
  function whenCompiled(cb: () => void) {   // setTimeout, not rAF: a hidden tab or pane pauses rAF
    if (!pcExt || !gl) { cb(); return; }
    const poll = () => { if (!gl || destroyed) return; if (gl.getProgramParameter(prog!, pcExt!.COMPLETION_STATUS_KHR)) cb(); else setTimeout(poll, 16); };
    poll();
  }
  function linked() {
    if (!gl || !prog) return false;
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getShaderInfoLog(fsh!) || gl.getProgramInfoLog(prog)); fail(); return false; }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    UNIFORMS.forEach((n) => { U[n] = gl!.getUniformLocation(prog!, n); });
    return true;
  }
  function fontsReady(cb: () => void) {
    let done = false; const go = () => { if (!done) { done = true; cb(); } };
    if (document.fonts?.ready) document.fonts.ready.then(go, go); else go();
    setTimeout(go, 900);
  }

  const DPR = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0, msPerPx = 0, downs = 0, boxes: number[][] = [];
  function lens() {   // tilt the hero shot so the stage screen's top lands where the layout leaves room
    const k = K[0], p = kp(k);
    const th = Math.max(Math.tan(k.f * Math.PI / 360), Math.tan(HFOV * Math.PI / 180) / (W / Math.max(1, H)));
    const dz = Math.hypot(p[0] - SUBJECT_TOP[0], p[2] - SUBJECT_TOP[2]), top = (SUBJECT_TOP[1] - p[1]) / dz;
    const want = portrait ? 0.1 : 0.2;   // desktop: hero copy sits left; phone: copy sits low
    heroShift = clamp(top / th - (1 - 2 * want), -0.9, 0.75);
  }

  // ── 4. callouts: projected from 3-D, placed clear of the text and each other ──
  const pins: Pin[] = [];
  function pin(text: string, beat: number, at: () => V3, extra: { when?: () => boolean; delay?: number; left?: boolean; dashed?: boolean } = {}) {
    const d = document.createElement('div');
    d.className = 'pin' + (extra.dashed ? ' dashed' : '');
    d.innerHTML = '<i></i><span></span>';
    const span = d.querySelector('span')!; span.textContent = text; pinsWrap.appendChild(d);
    pins.push({ node: d, span, beat, at, when: extra.when, delay: extra.delay, shown: false, tf: '', key: '', w: 0, h: 22, preferLeft: !!extra.left });
  }
  const lifted = (v: V3): V3 => [v[0], v[1] + 0.1, v[2]];
  let camNow = 0;
  if (ACCESS) {
    pin('Waiting room · your place is held', 1, () => [-1.5, 1.95, 45.3], { delay: 500 });
    pin('Admitted in batches', 1, () => [0, 1.25, 41.8], { delay: 1300 });
    pin('Not eligible · no code issued', 2, () => lifted(bandA()), { when: () => S.check > 0.17 && S.check < 0.5, dashed: true, left: true });
    pin('Eligible Visa card', 2, () => lifted(bandB()), { when: () => S.check > 0.85 });
    pin('One unique code · one card', 3, () => lifted(bandB()), { when: () => S.code > 0.2 });
    pin('Verified fans', 4, () => [-7, 1.6, -10], { when: () => S.fill > 0.3 });
    pin(`${o.labels.partner} · Visa presale`, 4, () => [0, 2.3, -34], { when: () => S.fill > 0.55 });
  } else {
    pin('Not eligible · no entry', 1, () => lifted(bandA()), { when: () => S.check > 0.17 && S.check < 0.5, dashed: true, left: true });
    pin('Eligible to enter', 1, () => lifted(bandB()), { when: () => S.check > 0.85 });
    pin('Entries received', 2, () => [-5, 1.6, 60], { when: () => S.enter > 0.25 });
    pin('One entry per card', 2, () => [6, 1.6, 70], { when: () => S.enter > 0.6, delay: 800 });
    pin('Random drawing · run by DJA', 3, () => { const p = spot(); return [p[0], 1.6, p[1]]; }, { when: () => S.draw > 0.03 && S.draw < DRAW_AT[0] - 0.02, dashed: true });
    DRAW_SPOTS.forEach((d, i) => pin('Selected entrant', 3, () => [d[0], 1.6, d[1]], { when: () => landed() > i + 0.5 }));
    pin('Winners · front of the stage', 4, () => [WIN_SPOTS[1][0], 1.6, WIN_SPOTS[1][1]], { when: () => S.stage > 0.9 });
  }

  function measure() {   // layout is read here, on resize and once fonts are in, never per frame
    W = stage.clientWidth; H = stage.clientHeight; portrait = H > W; HFOV = portrait ? 12 : 17;
    boxes = beats.map((b) => { const c = b.querySelector<HTMLElement>('.beat-box') || b; const r = c.getBoundingClientRect(), s = stage.getBoundingClientRect(); return [r.left - s.left, r.top - s.top, r.right - s.left, r.bottom - s.top]; });
    pins.forEach((p) => { p.w = p.span.offsetWidth; p.h = p.span.offsetHeight || 22; });
    lens();
  }
  function fit() {
    if (!gl) return;
    const cap = Math.min(W * H * DPR * DPR, 5e6);
    const px = msPerPx > 0 ? clamp(6 / msPerPx, 0.2e6, cap) : Math.min(cap, 0.8e6);   // ~6 ms of GPU per frame
    const sc = Math.sqrt(px / Math.max(1, W * H)) * Math.pow(0.8, downs);
    const w = Math.max(1, Math.round(W * sc)), h = Math.max(1, Math.round(H * sc));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
  }

  let cam: Cam | null = null, fwd: V3 = [0, 0, -1], right: V3 = [1, 0, 0], upv: V3 = [0, 1, 0], tanH = 0.3;
  function project(X: V3): [number, number] | null {
    const c = cam!, v: V3 = [X[0] - c.p[0], X[1] - c.p[1], X[2] - c.p[2]], z = dot(v, fwd);
    if (z < 0.3) return null;
    return [W / 2 + dot(v, right) / (z * tanH) * H / 2, H / 2 - (dot(v, upv) / (z * tanH) - c.s) * H / 2];
  }

  let uS = scrollU(), cpS = camParam(uS), cpV = 0, last = 0, active = -2, visible = true, raf = 0,
    nowMs = 0, activeAt = 0, shown = false, slow: number[] = [], lastScroll = 0;
  const t0 = performance.now(), frozenT = 21.0, memo: Record<string, unknown> = {};
  let parked: number | null = null, manual = false;   // ?debug only
  const put = <T,>(key: string, val: T, fn: (v: T) => void) => { if (memo[key] !== val) { memo[key] = val; fn(val); } };

  function step(u: number, dt: number, now: number) {
    uS = u;
    const cpT = parked != null ? parked : reduce ? Math.min(NB - 1, Math.round(u)) : camParam(u);
    if (reduce || !dt || parked != null) { cpS = cpT; cpV = 0; }
    else {   // the camera is a crane on a critically damped spring, not a cursor
      const om = 2, x = om * dt, ex = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
      const ch = cpS - cpT, tmp = (cpV + om * ch) * dt;
      cpV = (cpV - om * tmp) * ex; cpS = cpT + (ch + tmp) * ex;
    }
    const cp = cpS, near = (b: number) => Math.abs(cp - b) < 0.12, far = (b: number) => Math.abs(cp - b) > 0.45;
    if (reduce || !dt) {   // each clock at its state for the nearest beat
      const b = Math.round(cp);
      S.check = b === VERIFY ? 0.9 : b > VERIFY ? 1 : 0;
      S.code = ACCESS && b === 3 ? 0.6 : 0;
      S.fill = ACCESS && b === 4 ? 1 : 0;
      S.enter = !ACCESS && b >= 2 ? 1 : 0;
      S.draw = !ACCESS && b >= 3 ? 1 : 0;
      S.stage = b === NB - 1 ? 1 : 0.6;
      heroShiftS = heroShift;
    } else {
      S.rest = toward(S.rest, Math.abs(cp - Math.round(cp)) < 0.02 && Math.abs(cpV) < 0.05 ? 1 : 0, 1 / 16, 0.9, dt);
      // the gate plays once you arrive; it stays done once you've moved on, and rewinds if you go back
      if (near(VERIFY)) S.check = Math.min(1, S.check + dt / 7); else if (cp > VERIFY + 0.45) S.check = 1; else if (far(VERIFY)) S.check = 0;
      S.stage = toward(S.stage, cp > NB - 1.3 ? 1 : 0.6, 1 / 3, 0.8, dt);
      S.queue += dt * 0.22;   // one fan per lane every ~4.5 s: tap, approved, barrier up, through
      if (ACCESS) {
        if (near(3)) S.code = Math.min(1, S.code + dt / 3); else if (far(3)) S.code = 0;
        S.fill = cp > 3.7 ? Math.min(1, S.fill + dt / 7) : cp < 3.45 ? toward(S.fill, 0, 0, 1.2, dt) : S.fill;
      } else {
        S.enter = cp > 1.85 ? Math.min(1, S.enter + dt / 6) : cp < 1.55 ? toward(S.enter, 0, 0, 1.2, dt) : S.enter;
        S.draw = near(3) || cp > 3.5 ? Math.min(1, S.draw + dt / 8) : cp < 2.55 ? 0 : S.draw;
      }
      if (S.open < 1) S.open = Math.min(1, S.open + dt / (u > 0.02 ? 0.9 : 6));
      heroShiftS += (heroShift - heroShiftS) * (1 - Math.exp(-dt * 5));
    }
    const c = camAt(cp);
    if (S.rest > 0 && !reduce) {   // push-in once the camera rests; deeper on the close-ups
      const pe = S.rest * S.rest * (3 - 2 * S.rest), pv = [c.t[0] - c.p[0], c.t[1] - c.p[1], c.t[2] - c.p[2]];
      const r = Math.round(cp), pk = (r === 0 ? 0.03 : r === VERIFY || (ACCESS && r === 3) ? 0.1 : 0.06) * pe;
      c.p[0] += pv[0] * pk; c.p[1] += pv[1] * pk; c.p[2] += pv[2] * pk;
    }
    if (S.open < 1 && !reduce) {   // the scene arrives already moving, drawing back from the stage
      const oe = 1 - S.open, ow = oe * oe * (3 - 2 * oe) * (1 - sm(0, 0.6, cp));
      const bk = norm([c.p[0] - c.t[0], c.p[1] - c.t[1], c.p[2] - c.t[2]]);
      c.p[0] -= bk[0] * 10 * ow; c.p[1] += 1.5 * ow; c.p[2] -= bk[2] * 10 * ow;
    }
    const time = reduce ? frozenT : (now - t0) / 1000;
    if (!reduce) {   // the camera breathes a little, as if hand-held
      const d = 0.004 * Math.hypot(c.p[0] - c.t[0], c.p[1] - c.t[1], c.p[2] - c.t[2]);
      c.p[0] += Math.sin(time * 0.13) * d * 2; c.p[1] += Math.sin(time * 0.17 + 1) * d * 0.6; c.t[1] += Math.sin(time * 0.11 + 2) * d * 0.5;
    }
    cam = { ...c, cp, time };
    camNow = time;
    fwd = norm([c.t[0] - c.p[0], c.t[1] - c.p[1], c.t[2] - c.p[2]]); right = norm(cross(fwd, [0, 1, 0])); upv = cross(right, fwd);
    tanH = Math.max(Math.tan(c.f * Math.PI / 360), Math.tan(HFOV * Math.PI / 180) / (W / Math.max(1, H)));
  }

  function render() {
    if (!gl || !cam) return;
    const c = cam, cp = c.cp, sp = spot(), A = fanA(), B = fanB();
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform1f(U.uTime, c.time); gl.uniform1f(U.uTanH, tanH); gl.uniform1f(U.uShift, c.s);
    gl.uniform1f(U.uLit, lit());
    gl.uniform1f(U.uLitP, litPlaza());
    gl.uniform1f(U.uA, amber(c.time));
    gl.uniform1f(U.uB, blue());
    gl.uniform1f(U.uOpen, gateOpen());
    gl.uniform1f(U.uQueue, S.queue);
    gl.uniform1f(U.uLanes, ACCESS ? 1 : 0);
    gl.uniform1f(U.uPlaza, ACCESS ? 0 : 1);
    gl.uniform4f(U.uFA, A[0], A[1], A[2], A[3]);
    gl.uniform4f(U.uFB, B[0], B[1], B[2], B[3]);
    gl.uniform1f(U.uLandedIn, ACCESS ? 0 : landedIn(cp));
    gl.uniform1f(U.uCode, ACCESS ? sm(0, 0.25, S.code) * (reduce ? 0.8 : 0.6 + 0.4 * Math.sin(c.time * 4)) : 0);
    gl.uniform1f(U.uStage, S.stage);
    gl.uniform1f(U.uBeam, 1 - sm(0.2, 0.9, cp));
    gl.uniform1f(U.uLanded, ACCESS ? 0 : landed());
    gl.uniform1f(U.uGold, ACCESS ? 0 : 1);
    gl.uniform3f(U.uSpot, sp[0], sp[1], ACCESS ? 0 : sp[2] * (1 - sm(3.3, 3.8, cp)));
    gl.uniform3f(U.uPos, c.p[0], c.p[1], c.p[2]); gl.uniform3f(U.uTgt, c.t[0], c.t[1], c.t[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Only what changed is written, and nothing is read back here.
  function hud(u: number, cp: number) {
    let best = -1, bo = 0, sideO = 0;
    for (let i = 0; i < NB; i++) {
      const b = beats[i] as HTMLElement & { _o?: string; _t?: string };
      const op = beatOpacity(i, cp), os = op < 0.004 ? '0' : op.toFixed(3);
      if (b._o !== os) { b._o = os; b.style.opacity = os; b.classList.toggle('vis', os !== '0'); }
      if (!reduce) { const ts = ((1 - op) * (cp < i ? 18 : -12)).toFixed(1); if (b._t !== ts) { b._t = ts; b.style.transform = `translate3d(0,${ts}px,0)`; } }
      if (op > bo) { bo = op; best = i; }
      if (i > 0 && op > sideO) sideO = op;
    }
    const cur = bo > 0.6 ? best : -1;
    if (cur !== active) { beats.forEach((b, i) => b.classList.toggle('on', i === cur)); active = cur; activeAt = nowMs; }
    if (side) put('side', sideO.toFixed(2), (v) => { side.style.opacity = v; });
    if (cue) put('cue', (1 - sm(0.05, 0.3, u)).toFixed(2), (v) => { cue.style.opacity = v; });
    const bx = active >= 0 ? boxes[active] : null, placed: number[][] = [];
    for (const P of pins) {
      const show = ready && !!cam && active === P.beat && (!P.when || P.when()) && (reduce || !P.delay || nowMs - activeAt > P.delay);
      const xy = show ? project(P.at()) : null;
      const under = !!(xy && bx && xy[0] > bx[0] - 16 && xy[0] < bx[2] + 16 && xy[1] > bx[1] - 26 && xy[1] < bx[3] + 12);
      let ok = !!(xy && !under && xy[0] > 12 && xy[0] < W - 12 && xy[1] > 74 && xy[1] < H - 12), sd = '', lx = 0, ly = 0;
      if (ok && xy) {   // beside the dot on its preferred side, then the other, then below, then above
        const order = P.preferLeft ? 'LRBT' : 'RLBT';
        for (let k = 0; k < 4 && !sd; k++) {
          const c2 = order.charAt(k);
          const x0 = c2 === 'R' ? 12 : c2 === 'L' ? -(12 + P.w) : clamp(-P.w / 2, 12 - xy[0], W - 12 - xy[0] - P.w);
          const y0 = c2 === 'B' ? 12 : c2 === 'T' ? -12 - P.h : -P.h / 2;
          const rc = [xy[0] + x0, xy[1] + y0, xy[0] + x0 + P.w, xy[1] + y0 + P.h];
          if (rc[0] < 12 || rc[2] > W - 12 || rc[1] < 70 || rc[3] > H - 8) continue;
          if (bx && rc[0] < bx[2] + 8 && rc[2] > bx[0] - 8 && rc[1] < bx[3] + 8 && rc[3] > bx[1] - 8) continue;
          let hit = false;
          for (const pr of placed) { if (rc[0] < pr[2] + 6 && rc[2] + 6 > pr[0] && rc[1] < pr[3] + 4 && rc[3] + 4 > pr[1]) { hit = true; break; } }
          if (!hit) { sd = c2; lx = x0; ly = y0; placed.push(rc); }
        }
        ok = !!sd;
      }
      if (ok && xy) {
        const key = `${sd}${Math.round(lx)},${Math.round(ly)}`;
        if (P.key !== key) { P.key = key; P.node.style.setProperty('--lx', `${lx.toFixed(0)}px`); P.node.style.setProperty('--ly', `${ly.toFixed(0)}px`); }
        const tf = `translate3d(${xy[0].toFixed(1)}px,${xy[1].toFixed(1)}px,0)`;
        if (P.tf !== tf) { P.tf = tf; P.node.style.transform = tf; }
      }
      if (P.shown !== ok) { P.shown = ok; P.node.classList.toggle('on', ok); }
    }
  }

  function frame(now: number) {
    raf = 0;
    if (destroyed) return;
    const dt = last ? clamp((now - last) / 1000, 0, 0.1) : 1 / 60; last = now;
    const r = sec.getBoundingClientRect(), span = r.height - innerHeight;   // read first, then write
    const u = span > 0 ? clamp(-r.top / span, 0, 1) * (NB - 1 + TAIL) : 0;
    nowMs = now;
    step(u, dt, now);
    if (ready) { render(); if (!shown) { shown = true; cv.classList.add('on'); } }
    hud(uS, cam!.cp);
    sound(cam!.cp);
    if (ready && !reduce && !manual) {   // one step down for a machine that is plainly struggling, never mid-scroll
      slow.push(dt * 1000); if (slow.length > 120) slow.shift();
      if (slow.length === 120 && downs < 1 && now - lastScroll > 800) {
        const q = slow.slice().sort((a, b) => a - b); if (q[60] > 40) { downs++; fit(); slow = []; }
      }
    }
    if (visible && !manual && (!reduce || !shown)) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible && !manual && !destroyed) raf = requestAnimationFrame(frame); };

  // ── 5. settling: a stop between shots glides on to the one you were heading for ──
  let lastY = scrollY, down = true, settleT = 0, touching = false;
  function settle() {
    if (!visible || reduce || touching || parked != null) return;
    const u = scrollU(), i = Math.floor(u), f = u - i;
    if (i >= NB - 1 || u <= 0.001 || f < 0.47 || f > 0.93) return;
    scrollToBeat(down ? i + 1 : i);
  }
  on(window, 'scroll', () => {
    const y = scrollY; if (y !== lastY) { down = y > lastY; lastY = y; }
    lastScroll = performance.now(); clearTimeout(settleT); settleT = window.setTimeout(settle, 180); kick();
  }, { passive: true });
  on(window, 'touchstart', () => { touching = true; }, { passive: true });
  on(window, 'touchend', () => { touching = false; clearTimeout(settleT); settleT = window.setTimeout(settle, 240); }, { passive: true });
  on(window, 'resize', () => { measure(); fit(); kick(); });
  let ro: ResizeObserver | null = null;
  if ('ResizeObserver' in window) {
    let rw = 0, rh = 0;
    ro = new ResizeObserver(() => { if (stage.clientWidth !== rw || stage.clientHeight !== rh) { rw = stage.clientWidth; rh = stage.clientHeight; measure(); fit(); kick(); } });
    ro.observe(stage);
  }
  let io: IntersectionObserver | null = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; if (visible) { last = 0; kick(); } SND?.seen(visible && !document.hidden); }), { threshold: 0 });
    io.observe(sec);
  }

  // ── 6. sound: off unless asked for, synthesised, no files ───────────────────
  // Instrument: a warm arena pad over crowd murmur. A soft low pair for "not eligible",
  // two bright notes when a band locks blue, a rising pentatonic note as the floor lights.
  const SND = (() => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    let ctx: AudioContext | null = null, master!: GainNode, send!: GainNode, bed!: GainNode, onS = false, seen = true, bedLevel = -1;
    function build() {
      ctx = new AC!();
      const comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
      master = ctx.createGain(); master.gain.value = 0; master.connect(comp);
      const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), damp = ctx.createBiquadFilter();
      dl.delayTime.value = 0.41; fb.gain.value = 0.36; wet.gain.value = 0.42; damp.type = 'lowpass'; damp.frequency.value = 2600;
      send = ctx.createGain(); send.connect(dl); dl.connect(damp); damp.connect(fb); fb.connect(dl); damp.connect(wet); wet.connect(master);
      bed = ctx.createGain(); bed.gain.value = 0; bed.connect(master);
      // pad
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.6; lp.connect(bed);
      [[110, 'sawtooth', 0.06], [110.4, 'sawtooth', 0.06], [164.8, 'triangle', 0.08], [220.2, 'sine', 0.05]].forEach(([f, t, g]) => {
        const osc = ctx!.createOscillator(), gg = ctx!.createGain(); osc.type = t as OscillatorType; osc.frequency.value = f as number; gg.gain.value = g as number;
        osc.connect(gg); gg.connect(lp); osc.start();
      });
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 180; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      // crowd murmur: filtered noise
      const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
      src.buffer = buf; src.loop = true; bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.7; ng.gain.value = 0.05;
      src.connect(bp); bp.connect(ng); ng.connect(bed); src.start();
    }
    const level = () => (onS && seen ? 0.13 : 0);   // about -18 dB
    function tone(freq: number, type: OscillatorType, at: number, dur: number, peak: number) {
      const c = ctx!, os = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
      os.type = type; os.frequency.value = freq;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + Math.min(0.4, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      os.connect(g); g.connect(master); g.connect(send); os.start(t); os.stop(t + dur + 0.05);
    }
    return {
      toggle() { if (!ctx) build(); onS = !onS; if (onS && ctx!.state === 'suspended') ctx!.resume(); master.gain.setTargetAtTime(level(), ctx!.currentTime, 0.25); return onS; },
      seen(v: boolean) { seen = v; if (ctx) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.4); },
      bed(v: number) { if (!ctx || Math.abs(v - bedLevel) < 0.01) return; bedLevel = v; bed.gain.setTargetAtTime(v, ctx.currentTime, 0.5); },
      deny() { if (!ctx || !onS) return; tone(196, 'triangle', 0, 0.7, 0.14); tone(164.8, 'triangle', 0.18, 0.9, 0.12); },
      chime() { if (!ctx || !onS) return; tone(659.25, 'triangle', 0, 1.8, 0.18); tone(987.77, 'sine', 0.14, 2.2, 0.12); },
      note(k: number) {
        if (!ctx || !onS) return;
        const f = [329.63, 392, 440, 523.25, 587.33, 659.25, 783.99][k % 7];
        tone(f, 'triangle', 0, 2.6, 0.1); tone(f * 2, 'sine', 0.04, 1.8, 0.03);
      },
      close() { try { ctx?.close(); } catch { /* already closed */ } },
    };
  })();
  let prevA = 0, prevB = 0, prevFill = 0, prevLanded = 0, noteK = 0;
  if (SND && soundBtn) {
    soundBtn.hidden = false;
    on(soundBtn, 'click', () => {
      const v = SND.toggle();
      soundBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
      const s = soundBtn.querySelector('span'); if (s) s.textContent = v ? 'Sound on' : 'Sound';
    });
    on(document, 'visibilitychange', () => SND.seen(!document.hidden && visible));
  }
  function sound(cp: number) {   // edge-detected: each cue fires once, never per frame
    if (!SND) return;
    SND.bed(reduce ? 0 : 0.55 + 0.45 * S.stage);
    const a = S.check > 0.15 && S.check < 0.5 ? 1 : 0, b = S.check > 0.82 && S.check < 1 ? 1 : 0;
    if (!prevA && a) SND.deny();
    if (!prevB && b) SND.chime();
    prevA = a; prevB = b;
    const fillStep = Math.floor((ACCESS ? S.fill : S.enter) * 5);
    if (fillStep > prevFill) SND.note(noteK++);
    if (fillStep === 0) noteK = 0;
    prevFill = fillStep;
    const L = Math.floor(landed() + 0.01);
    if (L > prevLanded) SND.chime();
    prevLanded = L;
    void cp;
  }

  // ── 7. debug (only with ?debug): park the camera, drive frames by hand ───────
  // __cine.manual(); __cine.park(2); __cine.tick(33, 120); __cine.gpu(20)
  if (DEBUG) {
    sec.classList.add('cine-debug');
    let fake = 0;
    const state = () => ({ cp: cam && +cam.cp.toFixed(3), active, ready, canvas: [cv.width, cv.height], S: { ...S }, t: +camNow.toFixed(2), A: fanA(), B: fanB(), cam: cam && { p: cam.p.map((x) => +x.toFixed(2)), t: cam.t.map((x) => +x.toFixed(2)) } });
    const dbg = {
      park(cp: number) { parked = cp; return dbg; },
      manual() { manual = true; if (raf) cancelAnimationFrame(raf); raf = 0; fake = performance.now(); return dbg; },
      tick(ms?: number, n?: number) { for (let i = 0; i < (n || 1); i++) { fake += ms || 16.7; frame(fake); } return state(); },
      state,
      gpu(n?: number) {
        if (!ready || !gl) return null; n = n || 20; render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
        const s0 = performance.now(); for (let i = 0; i < n; i++) render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
        return +((performance.now() - s0) / n).toFixed(2);
      },
    };
    (window as unknown as Record<string, unknown>).__cine = dbg;
  }

  // ── 8. start: the text is live at once; the scene joins when it is ready ─────
  measure(); kick();
  if (gl) whenCompiled(() => {
    if (!gl || destroyed || !linked()) return;
    fontsReady(() => {
      if (!gl || destroyed) return;
      measure(); step(scrollU(), 0, performance.now());
      cv.width = 64; cv.height = 40; gl.viewport(0, 0, 64, 40);
      render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);   // the driver's stall, out of sight
      const perFrame = (n: number) => {   // ms per frame at about n pixels: warmed up, batches of three, best of two
        const tw = Math.max(64, Math.round(Math.sqrt(n * W / Math.max(1, H)))), th = Math.max(40, Math.round(n / tw));
        cv.width = tw; cv.height = th; gl!.viewport(0, 0, tw, th);
        render(); render(); gl!.readPixels(0, 0, 1, 1, gl!.RGBA, gl!.UNSIGNED_BYTE, px1);
        let best = 1e9;
        for (let r = 0; r < 2; r++) {
          const s0 = performance.now(); render(); render(); render(); gl!.readPixels(0, 0, 1, 1, gl!.RGBA, gl!.UNSIGNED_BYTE, px1);
          best = Math.min(best, (performance.now() - s0) / 3);
        }
        return { ms: best, px: tw * th };
      };
      const lo = perFrame(0.4e6), hi = perFrame(1.6e6), slope = (hi.ms - lo.ms) / (hi.px - lo.px);   // the fixed round trip cancels
      msPerPx = slope > 0 ? slope : Math.max(hi.ms, 0.05) / hi.px;
      fit(); ready = true;
      if (!reduce && scrollY < 10 && !DEBUG) S.open = 0;   // the opening push, only when the page opens at the top
      last = 0; kick();
    });
  });

  return () => {
    destroyed = true;
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(settleT);
    cleanups.forEach((f) => f());
    io?.disconnect();
    ro?.disconnect();
    SND?.close();
    pins.forEach((p) => p.node.remove());
    try { gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* ignore */ }
    if (DEBUG) delete (window as unknown as Record<string, unknown>).__cine;
    cv.remove();
    sec.classList.remove('live', 'nogl', 'cine-debug');
    sec.style.height = '';
  };
}
