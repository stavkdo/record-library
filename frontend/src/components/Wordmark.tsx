import { useId } from 'react';

interface WordmarkProps {
  /** Font size in px (drives overall scale). */
  size?: number;
  /** Color of the "Rec...rds" text. Defaults to light for dark theme. */
  textColor?: string;
  /** Whether the vinyl rotates on hover. */
  spinOnHover?: boolean;
  className?: string;
}

/**
 * Brand wordmark: "Rec[vinyl]rds" — the "o" is an inline SVG vinyl disc
 * coloured with the site's brand gradient (coral → pink) on a near-black
 * disc that reads correctly on the dark theme.
 */
export function Wordmark({
  size = 28,
  textColor = '#fafafa',
  spinOnHover = true,
  className = '',
}: WordmarkProps) {
  const vinylSize = Math.round(size * 1.1);
  return (
    <span
      className={`font-display font-extrabold tracking-tight inline-flex items-center leading-none select-none ${className}`}
      style={{ fontSize: size, color: textColor }}
    >
      <span>Rec</span>
      <VinylGlyph size={vinylSize} spinOnHover={spinOnHover} />
      <span>rds</span>
    </span>
  );
}

function VinylGlyph({
  size,
  spinOnHover,
}: {
  size: number;
  spinOnHover: boolean;
}) {
  const rawId = useId().replace(/[:]/g, '');
  const labelId = `wm-label-${rawId}`;
  const discId = `wm-disc-${rawId}`;
  const sheenId = `wm-sheen-${rawId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`inline-block mx-[0.04em] shrink-0 ${
        spinOnHover ? 'group-hover:animate-vinyl-spin' : ''
      }`}
      style={{ transform: 'translateY(0.04em)' }}
      aria-hidden="true"
    >
      <defs>
        {/* Disc body — brand gradient (coral → pink, with orange highlight) */}
        <radialGradient id={discId} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#ff8a3d" />
          <stop offset="55%" stopColor="#ff5e3a" />
          <stop offset="100%" stopColor="#ec4899" />
        </radialGradient>
        {/* Label — near-black with subtle diagonal sheen */}
        <linearGradient id={labelId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a22" />
          <stop offset="100%" stopColor="#050507" />
        </linearGradient>
        {/* Light reflection arc */}
        <linearGradient id={sheenId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* Disc */}
      <circle cx="50" cy="50" r="49" fill={`url(#${discId})`} />

      {/* Grooves — light tint reads against the colourful disc */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
      <circle cx="50" cy="50" r="37" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
      <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />

      {/* Sheen highlight on the colourful disc */}
      <path
        d="M 22 42 A 32 32 0 0 1 56 18"
        fill="none"
        stroke={`url(#${sheenId})`}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Label */}
      <circle cx="50" cy="50" r="22" fill={`url(#${labelId})`} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Center hole — tiny coral accent so it reads against the dark label */}
      <circle cx="50" cy="50" r="3" fill="#ff5e3a" />
    </svg>
  );
}
