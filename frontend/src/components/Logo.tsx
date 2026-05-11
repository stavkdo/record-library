interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 56, className = '' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt="Records Library logo"
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
