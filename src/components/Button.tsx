import type { ButtonHTMLAttributes } from 'react';

/**
 * While `busy` the button stays focusable (aria-disabled, not disabled) so keyboard focus is not lost;
 * callers must also guard against re-entry.
 */
export function Button({ busy = false, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button className="btn" aria-busy={busy ? 'true' : 'false'} aria-disabled={busy ? 'true' : undefined} {...rest}>
      {children}
    </button>
  );
}
