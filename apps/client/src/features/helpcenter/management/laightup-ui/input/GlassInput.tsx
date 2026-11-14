import React, { useRef, useState } from 'react';
import { cn } from '../utils/cn';
import './GlassInput.css';

export interface GlassInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    // `size` is overridden below as a visual variant (the native numeric
    // size attribute isn't meaningful for this control).
    'className' | 'prefix' | 'size'
  > {
  /**
   * Leading icon rendered before the field. Accepts any React component
   * that takes a className prop (Lucide, custom SVG, etc.).
   */
  icon?: React.ElementType;
  /**
   * Fixed text rendered before the input field with a divider separator.
   * Use for non-editable prefixes like "https://". Rendered before `icon`.
   */
  prefix?: React.ReactNode;
  /**
   * If provided, a trailing clear (X) button is rendered whenever the
   * input has a non-empty value. Clicking it calls onClear — the consumer
   * is responsible for resetting the value in response.
   *
   * Works for both controlled and uncontrolled inputs:
   *   - Controlled: onClear fires, consumer sets their state to ''.
   *   - Uncontrolled: the component tracks its own value internally to
   *     decide when to show the button, and onClear lets the consumer
   *     react (e.g. to clear associated query state).
   */
  onClear?: () => void;
  /**
   * Accessible label for the trailing clear (X) button. The lib is i18n-free,
   * so consumers pass a localized label; defaults to English `"Clear"`.
   */
  clearAriaLabel?: string;
  /**
   * Visible label text rendered above the input, wrapped in a semantic
   * <label> so clicking it focuses the field and screen readers announce
   * it correctly (WCAG 3.3.2). Placeholders are not labels — always
   * prefer this prop for form fields.
   */
  label?: string;
  /** Extra classes merged onto the wrapper. */
  className?: string;
  /**
   * Night-mode violet tone. Day mode is identical for both; only the dark
   * recess hue differs:
   *   - `'moonlight'` (default) — 242°, the laightup-glass Purkinje cool-bias.
   *   - `'brand'` — 248°, the warmer CI Bright Violet (#503bd9), same as day.
   */
  tone?: 'moonlight' | 'brand';
  /**
   * Field size. `'md'` (default) is the standard 36px control; `'sm'` is a
   * compact 30px field for dense surfaces like dropdown search; `'lg'` is a
   * 48px field that lines up with `GlassToggleChip size="lg"` / GlassButton lg.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Lift the field off the surface with a stronger drop shadow + a brighter
   * resting tint. Use on surfaces where the default near-flat input blends into
   * the background (e.g. an inspector floating on a light gradient). Opt-in —
   * default `false` keeps the standard recessed glass.
   */
  elevated?: boolean;
  /**
   * Search-"island" sizing: a compact resting `min-width` that grows on focus.
   * Pair with a flex-fill parent (e.g. `flex: 1`) and it behaves as a dynamic
   * island — fills when there's room, shrinks to the resting floor when the row
   * is squeezed, then grows back out on focus. The two widths default to
   * 220px → 340px and are overridable per surface via the CSS custom properties
   * `--glass-input-rest-min-w` / `--glass-input-focus-min-w`. Opt-in.
   */
  expandOnFocus?: boolean;
  /**
   * Marks the field as failing validation: sets `aria-invalid`, which the
   * stylesheet already paints as a destructive rim.
   */
  invalid?: boolean;
}

/* Inline X icon — kept inline (vs imported from lucide) to keep the library
   free of icon-library runtime deps. The consumer can pass their own icons
   via the `icon` prop from whatever icon library they use. */
const XIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      icon: Icon,
      prefix,
      onClear,
      clearAriaLabel = 'Clear',
      label,
      className,
      tone = 'moonlight',
      size = 'md',
      elevated = false,
      expandOnFocus = false,
      invalid = false,
      value,
      defaultValue,
      onChange,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState<string>(
      typeof defaultValue === 'string' ? defaultValue : '',
    );
    const currentValue = isControlled
      ? (typeof value === 'string' ? value : String(value ?? ''))
      : uncontrolledValue;

    const innerInputRef = useRef<HTMLInputElement>(null);
    // Merge the forwarded ref with our internal one so we can still focus
    // the input from the wrapper's onMouseDown.
    const setInputRef = (node: HTMLInputElement | null) => {
      (innerInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setUncontrolledValue(e.target.value);
      onChange?.(e);
    };

    const showClear = Boolean(onClear && currentValue.length > 0 && !disabled);

    // Click-anywhere-to-focus: if the mousedown lands on the wrapper or the
    // leading icon (not on the input itself, not on the clear button),
    // redirect focus to the input and keep any caret the user intended.
    // We use onMouseDown (not onClick) so the focus change happens before
    // the browser decides where to place the caret.
    const handleWrapperMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const target = e.target as HTMLElement;
      // Clear button handles its own mousedown (preventDefault there avoids
      // stealing focus). The input handles itself. Only redirect for other
      // regions (wrapper background, icon).
      if (
        target === e.currentTarget ||
        target.classList.contains('glass-input__icon') ||
        target.closest('.glass-input__icon')
      ) {
        e.preventDefault();
        innerInputRef.current?.focus();
      }
    };

    const inputControl = (
      <div
        className={cn(
          'glass-input',
          size === 'sm' && 'glass-input--sm',
          size === 'lg' && 'glass-input--lg',
          elevated && 'glass-input--elevated',
          expandOnFocus && 'glass-input--expand-on-focus',
          disabled && 'glass-input--disabled',
          !label && className,
        )}
        data-tone={tone}
        onMouseDown={handleWrapperMouseDown}
      >
        {prefix && (
          <>
            <span className="glass-input__prefix" aria-hidden="true">{prefix}</span>
            <span className="glass-input__prefix-divider" aria-hidden="true" />
          </>
        )}
        {Icon && <Icon className="glass-input__icon" />}
        <input
          ref={setInputRef}
          className="glass-input__field"
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          {...rest}
        />
        {showClear && (
          <button
            type="button"
            className="glass-input__clear"
            onClick={(e) => {
              e.preventDefault();
              onClear?.();
            }}
            // preventDefault on mousedown keeps the input focused — clicking X
            // shouldn't yank focus away from the field.
            onMouseDown={(e) => e.preventDefault()}
            aria-label={clearAriaLabel}
            tabIndex={-1}
          >
            <XIcon />
          </button>
        )}
      </div>
    );

    if (!label) return inputControl;

    return (
      <label
        className={cn(
          'glass-input-field',
          disabled && 'glass-input-field--disabled',
          className,
        )}
      >
        <span className="glass-input-field__label">{label}</span>
        {inputControl}
      </label>
    );
  },
);

GlassInput.displayName = 'GlassInput';
