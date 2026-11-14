import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { GlassCheckboxMark } from '../checkbox/GlassCheckbox';
import { GlassTruncatedText } from '../truncated-text/GlassTruncatedText';
import { cn } from '../utils/cn';
import './GlassMenu.css';

/* ─────────────────────────────────────────────────────────────────────────
   GlassMenu — the dropdown surface.

   Drop this inside a Radix Popover/DropdownMenu Content (or any positioned
   container) to get the glass treatment. The library does NOT own
   positioning — that's the consumer's concern (they pick Popover vs
   DropdownMenu vs HoverCard based on their access pattern).

   Usage:
     <Popover.Root>
       <Popover.Trigger asChild><GlassFilterPill ... /></Popover.Trigger>
       <Popover.Content asChild>
         <GlassMenu>
           <GlassMenuItem icon={MapPin}>All locations</GlassMenuItem>
           <GlassMenuItem selected>Downtown</GlassMenuItem>
         </GlassMenu>
       </Popover.Content>
     </Popover.Root>
   ───────────────────────────────────────────────────────────────────────── */

export type GlassMenuCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface GlassMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  className?: string;
  /** Anchor the menu to the trigger corner it opened from: that corner is
   *  flattened to a near-straight edge, and the open/close animation scales from
   *  it, so the menu reads as unfolding from the trigger. The caller picks the
   *  corner nearest its trigger. */
  originCorner?: GlassMenuCorner;
}

export const GlassMenu = React.forwardRef<HTMLDivElement, GlassMenuProps>(
  ({ asChild = false, className, children, originCorner, ...rest }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        role="menu"
        className={cn('glass-menu', className)}
        data-origin-corner={originCorner}
        {...rest}
      >
        {children}
      </Comp>
    );
  },
);
GlassMenu.displayName = 'GlassMenu';

/* ── Section label (for grouping options) ── */
export interface GlassMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const GlassMenuLabel = React.forwardRef<HTMLDivElement, GlassMenuLabelProps>(
  ({ className, children, ...rest }, ref) => (
    <div ref={ref} className={cn('glass-menu__label', className)} {...rest}>
      {children}
    </div>
  ),
);
GlassMenuLabel.displayName = 'GlassMenuLabel';

/* ── Separator ── */
export interface GlassMenuSeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const GlassMenuSeparator = React.forwardRef<
  HTMLDivElement,
  GlassMenuSeparatorProps
>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation="horizontal"
    className={cn('glass-menu__separator', className)}
    {...rest}
  />
));
GlassMenuSeparator.displayName = 'GlassMenuSeparator';

/* ── Menu item ── */

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export interface GlassMenuItemProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'role'
  > {
  /** Leading icon component (Lucide, custom, any ElementType). */
  icon?: React.ElementType;
  /** 'full' keeps the icon at full opacity (e.g. colored flags); default 'muted'. */
  iconTone?: 'muted' | 'full';
  /** Main label text. */
  children: React.ReactNode;
  /** Optional secondary line under the label. */
  description?: React.ReactNode;
  /** Selected state: theme-tinted background + trailing check. */
  selected?: boolean;
  /** Trailing keyboard hint chip (e.g. "↵", "F2", "⌘D", "›", "⌫"). */
  kbd?: React.ReactNode;
  /** Inline secondary text rendered next to the label (e.g. "oder halten",
   *  "nur Genehmigt"). Different from `description` which renders on its
   *  own line below the label. */
  inlineHint?: React.ReactNode;
  /** Visual variant. `danger` paints the row red and tints the hover bg
   *  with a soft red wash. */
  variant?: 'default' | 'danger';
  /** Render element. Defaults to `'button'`. Use `'div'` when the row
   *  needs to contain nested interactive content — e.g. a submenu-trigger
   *  row whose children include a nested `<GlassMenu role="menu">` (a
   *  menu inside a button is invalid HTML). When `'div'`, `tabIndex=0`
   *  is set automatically so the row stays keyboard-reachable, and
   *  `aria-disabled` is used in place of the `disabled` HTML attribute. */
  as?: 'button' | 'div';
  /** ARIA role override. Defaults to `'menuitem'`. Use
   *  `'menuitemcheckbox'` for toggleable rows (the `selected` prop drives
   *  `aria-checked`) or `'menuitemradio'` for radio-group rows. */
  role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  /** `'checkbox'` shows a leading checkbox reflecting `selected` instead of
   *  the row tint; meant for multi-select rows (`role="menuitemcheckbox"`). */
  indicator?: 'checkbox';
  /** Reveal a clipped label on hover. Only for a plain-text label: the
   *  reveal reads the rendered text, so a custom node has nothing to show. */
  truncate?: boolean;
  className?: string;
}

/**
 * A row inside a GlassMenu. Renders as <button> by default; pass `as="div"`
 * for the rare case of a submenu-trigger row that needs to contain a nested
 * menu (invalid HTML inside a button).
 *
 * For Radix composition (DropdownMenu.Item, ContextMenu.Item, etc.) use
 * inverse composition:
 *
 *   <DropdownMenu.Item asChild>
 *     <GlassMenuItem onClick={...}>Option</GlassMenuItem>
 *   </DropdownMenu.Item>
 *
 * The Radix primitive spreads onSelect/keyboard handlers onto our button via
 * asChild, preserving focus trap + arrow-key nav while keeping the glass UI.
 */
export const GlassMenuItem = React.forwardRef<
  HTMLButtonElement | HTMLDivElement,
  GlassMenuItemProps
>(
  (
    {
      icon: Icon,
      iconTone = 'muted',
      children,
      description,
      selected = false,
      kbd,
      inlineHint,
      variant = 'default',
      as = 'button',
      role = 'menuitem',
      indicator,
      truncate = false,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const isCheckbox =
      role === 'menuitemcheckbox' || role === 'menuitemradio';
    const sharedClassName = cn(
      'glass-menu-item',
      selected && 'glass-menu-item--selected',
      indicator === 'checkbox' && 'glass-menu-item--checkbox',
      variant === 'danger' && 'glass-menu-item--danger',
      className,
    );
    // The reveal measures the element carrying the clipping CSS, so the
    // truncated text IS the label box rather than a wrapper around it.
    const label = truncate ? (
      <GlassTruncatedText className="glass-menu-item__label">
        {children}
      </GlassTruncatedText>
    ) : (
      <span className="glass-menu-item__label">{children}</span>
    );
    const body = (
      <>
        {indicator === 'checkbox' && <GlassCheckboxMark checked={selected} />}
        {Icon && (
          <span
            className={cn(
              'glass-menu-item__icon-slot',
              iconTone === 'full' && 'glass-menu-item__icon-slot--full',
            )}
          >
            <Icon className="glass-menu-item__icon" />
          </span>
        )}
        <span className="glass-menu-item__body">
          {inlineHint ? (
            <span className="glass-menu-item__label-row">
              {label}
              <span className="glass-menu-item__hint">{inlineHint}</span>
            </span>
          ) : (
            label
          )}
          {description && (
            <span className="glass-menu-item__description">{description}</span>
          )}
        </span>
        {kbd && <span className="glass-menu-item__kbd">{kbd}</span>}
        {selected && !isCheckbox && (
          <CheckIcon className="glass-menu-item__check" />
        )}
      </>
    );

    if (as === 'div') {
      // Submenu-trigger / container variant — can hold a nested <GlassMenu>
      // as a child without producing invalid HTML (which a <button> would).
      // Disabled state expressed via aria-disabled since <div> ignores the
      // `disabled` attribute; the lib CSS already styles
      // `[aria-disabled="true"]` identically to `:disabled`.
      const { onClick, onMouseEnter, onMouseLeave, ...divRest } =
        rest as unknown as React.HTMLAttributes<HTMLDivElement> & {
          'aria-haspopup'?: React.AriaAttributes['aria-haspopup'];
          'aria-expanded'?: React.AriaAttributes['aria-expanded'];
        };
      return (
        <div
          ref={ref as React.ForwardedRef<HTMLDivElement>}
          role={role}
          tabIndex={disabled ? -1 : 0}
          aria-checked={isCheckbox ? selected : undefined}
          aria-disabled={disabled || undefined}
          data-selected={selected || undefined}
          className={sharedClassName}
          onClick={disabled ? undefined : onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          {...divRest}
        >
          {body}
        </div>
      );
    }

    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type="button"
        role={role}
        disabled={disabled}
        aria-checked={
          isCheckbox ? selected : selected || undefined
        }
        data-selected={selected || undefined}
        className={sharedClassName}
        {...rest}
      >
        {body}
      </button>
    );
  },
);
GlassMenuItem.displayName = 'GlassMenuItem';
