import { memo, useMemo } from 'react';
import { ART_PRESETS, type ArtPreset } from '../config/campaign';

/**
 * Placeholder event artwork: abstract concert light over a crowd silhouette. No photography, so
 * nothing implies a real artist. A campaign's `heroImage` can be a preset name or any image URL.
 */
const PALETTES: Record<ArtPreset, [string, string, string]> = {
  aurora: ['#2340ff', '#7a3bff', '#19d4ff'],
  ember: ['#ff6a1a', '#ff2d7a', '#f7b600'],
  tide: ['#0a6cff', '#00c2a8', '#3b2bd1'],
  neon: ['#ff2dd4', '#6a00ff', '#00e5ff'],
  dusk: ['#ff7a59', '#6a4bff', '#2a2f9e'],
};

export const isImageUrl = (s: string) => /^(https?:|\/|data:image)/.test(s.trim());

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const Crowd = memo(function Crowd({ band }: { band: string }) {
  const { heads, arms } = useMemo(() => {
    const r = rng(42);
    const heads: Array<[number, number, number]> = [];
    const arms: Array<[number, number, number, number, boolean]> = [];
    for (let row = 0; row < 3; row++) {
      const y = 800 + row * 45, sz = 26 + row * 9;
      for (let x = -20; x < 1640; x += sz * 1.35 + r() * 16) {
        heads.push([x, y + r() * 14, sz]);
        if (r() < 0.2 + row * 0.04) arms.push([x + (r() - 0.5) * 20, y - sz * 0.4, (r() - 0.5) * 40, sz * (3 + r() * 1.2), r() < 0.55]);
      }
    }
    return { heads, arms };
  }, []);
  return (
    <g>
      {arms.map(([x, y, a, len, lit], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
          <rect x={-7} y={-len} width={14} height={len} rx={7} fill="#03040a" />
          <circle cx={0} cy={-len - 4} r={11} fill="#03040a" />
          {lit && <rect x={-9} y={-len * 0.72} width={18} height={7} rx={3.5} fill={band} style={{ filter: 'drop-shadow(0 0 8px ' + band + ')' }} />}
        </g>
      ))}
      {heads.map(([x, y, s], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={s * 0.5} fill="#03040a" />
          <ellipse cx={x} cy={y + s * 1.05} rx={s * 0.95} ry={s * 0.75} fill="#03040a" />
        </g>
      ))}
      <rect x={0} y={880} width={1600} height={40} fill="#03040a" />
    </g>
  );
});

export function Art({ image, band = '#5b82ff', className = '', crowd = true }: { image: string; band?: string; className?: string; crowd?: boolean }) {
  if (isImageUrl(image)) {
    return <img src={image} alt="" className={`h-full w-full object-cover ${className}`} />;
  }
  const preset = (ART_PRESETS as readonly string[]).includes(image) ? (image as ArtPreset) : 'aurora';
  const [a, b, c] = PALETTES[preset];
  const id = `art-${preset}`;
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03040b" />
          <stop offset="0.55" stopColor="#0a0d22" />
          <stop offset="1" stopColor="#04050c" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="70" />
        </filter>
        <filter id={`${id}-soft`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}-bg)`} />
      <g filter={`url(#${id}-blur)`} opacity="0.85">
        <ellipse className="anim-drift" cx="1050" cy="360" rx="420" ry="220" fill={a} />
        <ellipse className="anim-drift" style={{ animationDelay: '-6s' }} cx="560" cy="300" rx="360" ry="200" fill={b} opacity="0.8" />
        <ellipse cx="820" cy="640" rx="560" ry="120" fill={c} opacity="0.45" />
      </g>
      <g filter={`url(#${id}-soft)`} style={{ mixBlendMode: 'screen' }}>
        {[260, 560, 820, 1080, 1340].map((x, i) => (
          <polygon
            key={x}
            className="anim-sweep"
            style={{ animationDelay: `${-i * 1.7}s`, transformOrigin: `${x}px 0px` }}
            points={`${x - 6},0 ${x + 6},0 ${x + 150},900 ${x - 150},900`}
            fill={`url(#${id}-beam)`}
            opacity={0.22 + (i % 2) * 0.12}
          />
        ))}
      </g>
      <rect x="360" y="600" width="880" height="16" rx="8" fill="#fff" opacity="0.18" filter={`url(#${id}-soft)`} />
      {crowd && <Crowd band={band} />}
    </svg>
  );
}
