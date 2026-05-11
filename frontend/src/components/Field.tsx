import type { InputHTMLAttributes } from 'react';

type FieldProps = {
  label?: string;
  variant?: 'pill' | 'stacked';
} & InputHTMLAttributes<HTMLInputElement>;

/**
 * `pill`     — borderless dark input used inside modals.
 * `stacked`  — labelled input used in auth forms.
 * Both share the same Linear-inspired dark surface + amber focus ring.
 */
export function Field({
  label,
  variant = 'stacked',
  className = '',
  ...rest
}: FieldProps) {
  const baseInput =
    'w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-100 placeholder-zinc-500 transition-all focus:outline-none focus:border-[#ff5e3a]/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#ff5e3a]/20';

  if (variant === 'pill') {
    return (
      <input
        {...rest}
        placeholder={rest.placeholder ?? label}
        className={`${baseInput} ${className}`}
      />
    );
  }
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium tracking-wide text-zinc-400 mb-1.5">
          {label}
        </span>
      )}
      <input {...rest} className={`${baseInput} ${className}`} />
    </label>
  );
}
