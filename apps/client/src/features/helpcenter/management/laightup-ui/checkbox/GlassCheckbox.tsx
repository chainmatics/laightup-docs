import React from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { cn } from '../utils/cn';
import './GlassCheckbox.css';

/* ─────────────────────────────────────────────────────────────────────────
   GlassCheckbox — glass-skinned checkbox over @radix-ui/react-checkbox.

   Three sizes (sm 16px / md 20px / lg 24px), three states (unchecked /
   checked / indeterminate), with disabled + focus-visible variants.

   Uses --theme-h/s/l (CI accent loud, palette-driven) for the on-state
   fill and the focus ring. Off-state is a translucent glass tile with
   a low-alpha accent rim that lifts on hover.

   Indicator glyphs are inline SVG (lucide-react is reserved for stories
   per lib convention — keeps the component dependency-free).

   Usage:
     // Uncontrolled
     <GlassCheckbox defaultChecked aria-label="Email me updates" />

     // Controlled
     <GlassCheckbox
       checked={value}
       onCheckedChange={setValue}
       label="Email me updates"
     />

     // Indeterminate (parent of a partially-checked group)
     <GlassCheckbox checked="indeterminate" />
   ───────────────────────────────────────────────────────────────────────── */

export type GlassCheckboxSize = 'sm' | 'md' | 'lg';

export interface GlassCheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Checkbox.Root>, 'asChild'> {
  /** Visual size — `md` (20px) is the default form size. */
  size?: GlassCheckboxSize;
  /**
   * Optional inline label. When provided, the checkbox is wrapped in a
   * `<label>` so clicking the text also toggles state. Pass `null` /
   * omit for a label-less checkbox (table column, action bar, etc.) and
   * provide `aria-label` on the Root instead.
   */
  label?: React.ReactNode;
}

/* ─── Glyphs (inline SVG, dependency-free) ────────────────────────────── */

const CheckGlyph = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
  </svg>
);

const IndeterminateGlyph = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <line x1="4" y1="8" x2="12" y2="8" />
  </svg>
);

/* ─── Component ───────────────────────────────────────────────────────── */

export const GlassCheckbox = React.forwardRef<
  React.ElementRef<typeof Checkbox.Root>,
  GlassCheckboxProps
>(({ className, size = 'md', label, checked, ...rest }, ref) => {
  const root = (
    <Checkbox.Root
      ref={ref}
      checked={checked}
      className={cn(
        'glass-checkbox',
        `glass-checkbox--${size}`,
        className,
      )}
      {...rest}
    >
      <Checkbox.Indicator className="glass-checkbox__indicator" forceMount>
        {checked === 'indeterminate' ? <IndeterminateGlyph /> : <CheckGlyph />}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );

  if (label === undefined || label === null) {
    return root;
  }

  return (
    <label
      className={cn(
        'glass-checkbox__label',
        `glass-checkbox__label--${size}`,
      )}
    >
      {root}
      <span className="glass-checkbox__label-text">{label}</span>
    </label>
  );
});
GlassCheckbox.displayName = 'GlassCheckbox';

export interface GlassCheckboxMarkProps {
  checked: boolean | 'indeterminate';
  size?: GlassCheckboxSize;
  className?: string;
}

/**
 * The checkbox look without the control, for rows that are themselves the
 * toggle (e.g. a menuitemcheckbox): a nested button would be invalid HTML.
 */
export function GlassCheckboxMark({ checked, size = 'sm', className }: GlassCheckboxMarkProps) {
  const state =
    checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked';
  return (
    <span
      aria-hidden="true"
      data-state={state}
      className={cn('glass-checkbox', `glass-checkbox--${size}`, 'glass-checkbox--mark', className)}
    >
      <span className="glass-checkbox__indicator">
        {checked === 'indeterminate' ? <IndeterminateGlyph /> : <CheckGlyph />}
      </span>
    </span>
  );
}
