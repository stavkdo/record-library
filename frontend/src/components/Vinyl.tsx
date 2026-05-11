interface VinylProps {
  size?: number;
  spinning?: boolean;
}

export function Vinyl({ size = 460, spinning = true }: VinylProps) {
  return (
    <img
      src="/vinyl.png"
      width={size}
      height={size}
      alt=""
      className={`shrink-0 rounded-full vinyl-glow ${spinning ? 'animate-vinyl-spin' : ''}`}
      style={{ width: size, height: size }}
    />
  );
}
