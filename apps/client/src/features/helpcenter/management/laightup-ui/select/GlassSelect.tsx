'use client';

import React from 'react';
import { ChevronDown, Search } from 'lucide-react';
import {
  GlassPopover,
  GlassPopoverTrigger,
  GlassPopoverContent,
} from '../popover/GlassPopover';
import { GlassMenu, GlassMenuItem } from '../menu/GlassMenu';
import { GlassInput } from '../input/GlassInput';
import { GlassTruncatedText } from '../truncated-text/GlassTruncatedText';
import { useScrollLockBypass } from '../popover/useScrollLockBypass';
import { cn } from '../utils/cn';
import './GlassSelect.css';

/* ─────────────────────────────────────────────────────────────────────────
   GlassSelect — typed dropdown built on GlassPopover + GlassMenu primitives.

   Use for compact value-pickers (role chooser, language chooser, theme
   variant). For free-text search inside the menu, escalate to a custom
   combobox composition. For full-screen forms, use a dialog.

   Visual: trigger styled as a glass pill with a chevron that flips on open.
   Selected item is marked with a checkmark via GlassMenuItem's `selected`
   prop. Menu content uses GlassPopover's anchored surface — same blur,
   night-mode tint, and focus ring as the rest of the system.

   Long option lists: pass `searchable` to render a filter input above the
   menu (matched against each option's `searchText`, falling back to a plain
   string label). The menu is at least as wide as the trigger and grows with
   the options up to 320px (or the viewport); beyond that options truncate
   with a tooltip. Pass `menuWidth="trigger"` to pin it to the trigger width.

   Controlled-only API: pass `value` + `onValueChange`. The component does
   not own selection state.

   Usage:
     <GlassSelect
       value={role}
       onValueChange={setRole}
       options={[
         { value: 'Admin', label: 'Admin' },
         { value: 'Editor', label: 'Editor' },
         { value: 'Viewer', label: 'Viewer' },
       ]}
     />
   ───────────────────────────────────────────────────────────────────────── */

export type GlassSelectSize = 'sm' | 'md';

/** Visual prominence of the trigger.
 *  - 'default' (translucent body fill, for surfaces with their own backdrop)
 *  - 'solid'   (deeper body fill, for use beside high-contrast siblings like
 *              GlassInput in a compose row where parity in weight matters)
 *  - 'elevated' (light field look of GlassInput `elevated`, for light panels
 *              like drawers and dialogs; md trigger is 40px tall)
 */
export type GlassSelectVariant = 'default' | 'solid' | 'elevated';

/** Menu width rule.
 *  - 'content' (default): at least the trigger's width, grows with the options
 *              up to 320px or the available viewport width, beyond that truncates
 *  - 'trigger': exactly the trigger's width, longer options truncate
 */
export type GlassSelectMenuWidth = 'trigger' | 'content';

export interface GlassSelectOption<TValue extends string = string> {
  value: TValue;
  label: React.ReactNode;
  /** Optional icon shown to the left of the label inside the menu item */
  icon?: React.ComponentType<{ className?: string }>;
  /** 'full' keeps the icon at full opacity (e.g. colored flags); default 'muted'. */
  iconTone?: 'muted' | 'full';
  /** When true, the option is rendered but cannot be picked */
  disabled?: boolean;
  /**
   * Plain text matched against the search query when `searchable`. Required
   * for options whose `label` is not a plain string (e.g. a two-line node);
   * a string label is used as the fallback.
   */
  searchText?: string;
}

export interface GlassSelectProps<TValue extends string = string> {
  value: TValue;
  onValueChange: (next: TValue) => void;
  options: GlassSelectOption<TValue>[];
  /** Override the trigger label render (default: the matching option's label) */
  renderTrigger?: (selected: GlassSelectOption<TValue> | undefined) => React.ReactNode;
  size?: GlassSelectSize;
  /** Visual prominence — see GlassSelectVariant. Default 'default'. */
  variant?: GlassSelectVariant;
  disabled?: boolean;
  className?: string;
  /** Accessible label for the trigger button (e.g., "Default role") */
  'aria-label'?: string;
  /** Side the menu prefers to open on. Default 'bottom'. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignment of the menu against the trigger. Default 'start'. */
  align?: 'start' | 'center' | 'end';
  /** Render a filter input above the option list. Default false. */
  searchable?: boolean;
  /** Placeholder for the filter input (only when `searchable`). */
  searchPlaceholder?: string;
  /** Message shown when the search query matches no option. */
  noResultsMessage?: string;
  /** Lift the menu above a raised popover it opens inside. Default false. */
  raised?: boolean;
  /** Show the selected option's icon in the trigger too. Default false. */
  showSelectedIcon?: boolean;
  /** Menu width rule, see GlassSelectMenuWidth. Default 'content'. */
  menuWidth?: GlassSelectMenuWidth;
}

export function GlassSelect<TValue extends string = string>({
  value,
  onValueChange,
  options,
  renderTrigger,
  size = 'md',
  variant = 'default',
  disabled = false,
  className,
  'aria-label': ariaLabel,
  side = 'bottom',
  align = 'start',
  searchable = false,
  searchPlaceholder,
  noResultsMessage,
  raised = false,
  showSelectedIcon = false,
  menuWidth = 'content',
}: GlassSelectProps<TValue>): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const selected = options.find((o) => o.value === value);
  const TriggerIcon = showSelectedIcon && !renderTrigger ? selected?.icon : undefined;
  // Keep the menu scrollable when opened inside a modal dialog (see hook).
  const setContentRef = useScrollLockBypass<HTMLDivElement>();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter((o) => {
      const text = o.searchText ?? (typeof o.label === 'string' ? o.label : '');
      return text.toLowerCase().includes(q);
    });
  }, [options, query, searchable]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery('');
  };

  return (
    <GlassPopover open={open} onOpenChange={handleOpenChange}>
      <GlassPopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'glass-select-trigger',
            `glass-select-trigger--${size}`,
            `glass-select-trigger--${variant}`,
            className,
          )}
          data-open={open ? '' : undefined}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {TriggerIcon && (
            <span
              className={cn(
                'glass-select-trigger__icon-slot',
                selected?.iconTone === 'full' && 'glass-select-trigger__icon-slot--full',
              )}
              aria-hidden="true"
            >
              <TriggerIcon className="glass-select-trigger__icon" />
            </span>
          )}
          {renderTrigger || typeof selected?.label !== 'string' ? (
            <span className="glass-select-trigger__label">
              {renderTrigger ? renderTrigger(selected) : selected?.label ?? ''}
            </span>
          ) : (
            <GlassTruncatedText className="glass-select-trigger__label">
              {selected.label}
            </GlassTruncatedText>
          )}
          <ChevronDown
            className="glass-select-trigger__chevron"
            aria-hidden="true"
          />
        </button>
      </GlassPopoverTrigger>
      <GlassPopoverContent
        ref={setContentRef}
        size="sm"
        variant="menu"
        side={side}
        align={align}
        sideOffset={4}
        className={cn(
          'glass-select__popover',
          menuWidth === 'trigger' && 'glass-select__popover--trigger',
          raised && 'glass-select__popover--raised',
        )}
        onOpenAutoFocus={searchable ? (e) => e.preventDefault() : undefined}
      >
        {searchable && (
          <GlassInput
            className="glass-select__search"
            size={size}
            icon={Search}
            value={query}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder ?? ariaLabel}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
          />
        )}
        <GlassMenu aria-label={ariaLabel} className="glass-select__menu">
          {filtered.map((opt) => (
            <GlassMenuItem
              key={opt.value}
              icon={opt.icon}
              iconTone={opt.iconTone}
              selected={opt.value === value}
              disabled={opt.disabled}
              truncate={typeof opt.label === 'string'}
              onClick={() => {
                if (opt.disabled) return;
                onValueChange(opt.value);
                handleOpenChange(false);
              }}
            >
              {opt.label}
            </GlassMenuItem>
          ))}
        </GlassMenu>
        {searchable && filtered.length === 0 && (
          <p className="glass-select__empty">{noResultsMessage}</p>
        )}
      </GlassPopoverContent>
    </GlassPopover>
  );
}

GlassSelect.displayName = 'GlassSelect';
