/**
 * @chainmatics/laightup-glass - settings primitives
 *
 * Building blocks for Linear-style settings pages:
 *  - GlassSettingsPageHeader: page title + one-sentence description (+ actions)
 *  - GlassSettingsSection:    optional heading over ONE grouped glass surface
 *  - GlassSettingsRow:        label + description left, control right,
 *                             optional full-width content below
 *  - GlassSettingsNav / NavGroup / NavItem: the settings sidebar
 */
import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../utils/cn';
import { GlassCard } from '../card/GlassCard';
import './GlassSettings.css';

/* ── Page header ─────────────────────────────────────────────────────── */

export interface GlassSettingsPageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const GlassSettingsPageHeader = React.forwardRef<
  HTMLElement,
  GlassSettingsPageHeaderProps
>(({ title, description, actions, className, ...rest }, ref) => (
  <header
    ref={ref}
    className={cn('glass-settings-page-header', className)}
    {...rest}
  >
    <div className="glass-settings-page-header__text">
      <h1 className="glass-settings-page-header__title">{title}</h1>
      {description && (
        <p className="glass-settings-page-header__description">{description}</p>
      )}
    </div>
    {actions && (
      <div className="glass-settings-page-header__actions">{actions}</div>
    )}
  </header>
));
GlassSettingsPageHeader.displayName = 'GlassSettingsPageHeader';

/* ── Section ─────────────────────────────────────────────────────────── */

export interface GlassSettingsSectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /**
   * Pads the surface's body like a row (14px/18px) for sections that hold
   * free-form content instead of `GlassSettingsRow`s, which pad themselves.
   */
  bodyPadding?: boolean;
}

export const GlassSettingsSection = React.forwardRef<
  HTMLElement,
  GlassSettingsSectionProps
>(({ title, description, bodyPadding = false, className, children, id, ...rest }, ref) => {
  const autoId = React.useId();
  const titleId = `${id ?? autoId}-title`;
  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={cn('glass-settings-section', className)}
      {...rest}
    >
      {(title || description) && (
        <div className="glass-settings-section__header">
          {title && (
            <h2 id={titleId} className="glass-settings-section__title">
              {title}
            </h2>
          )}
          {description && (
            <p className="glass-settings-section__description">{description}</p>
          )}
        </div>
      )}
      <GlassCard
        size="md"
        className={cn(
          'glass-settings-section__surface',
          bodyPadding && 'glass-settings-section__surface--padded',
        )}
      >
        {children}
      </GlassCard>
    </section>
  );
});
GlassSettingsSection.displayName = 'GlassSettingsSection';

/* ── Row ─────────────────────────────────────────────────────────────── */

export interface GlassSettingsRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned slot for the row's control (switch, select, button). */
  control?: React.ReactNode;
  /** Leading visual (avatar, icon) shown before the label. */
  leading?: React.ReactNode;
  /** Read-only text value in the control slot (date, id, plan name). */
  value?: React.ReactNode;
  /** When set, the label renders as a `<label>` bound to this control id. */
  htmlFor?: string;
  /** Full-width content below the label line (tables, uploads, lists). */
  children?: React.ReactNode;
  /** The row is the current one (e.g. its detail is open): violet wash, `aria-current`. */
  selected?: boolean;
  /** Keeps label and control on one line in narrow containers instead of stacking them. */
  inline?: boolean;
  /** Makes the whole row a keyboard-operable button; only for rows without their own controls. */
  onActivate?: () => void;
  /** With `onActivate`: the row stays focusable but ignores clicks and keys (`aria-disabled`). */
  disabled?: boolean;
}

export const GlassSettingsRow = React.forwardRef<
  HTMLDivElement,
  GlassSettingsRowProps
>((
  {
    label,
    description,
    control,
    value,
    leading,
    htmlFor,
    children,
    selected,
    inline,
    onActivate,
    disabled,
    className,
    id,
    onClick,
    onKeyDown,
    ...rest
  },
  ref,
) => {
  const autoId = React.useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const descriptionId = description ? `${baseId}-description` : undefined;
  const LabelTag = htmlFor ? 'label' : 'span';
  const activatable = !!onActivate;
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (!disabled && !event.defaultPrevented) onActivate?.();
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!disabled) onActivate?.();
  };
  return (
    <div
      ref={ref}
      id={id}
      role={activatable ? 'button' : 'group'}
      tabIndex={activatable ? 0 : undefined}
      aria-disabled={activatable && disabled ? true : undefined}
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      className={cn('glass-settings-row', className)}
      data-interactive={activatable && !disabled ? '' : undefined}
      data-selected={selected || undefined}
      data-inline={inline || undefined}
      aria-current={selected || undefined}
      onClick={activatable ? handleClick : onClick}
      onKeyDown={activatable ? handleKeyDown : onKeyDown}
      {...rest}
    >
      <div className="glass-settings-row__main">
        {leading && <div className="glass-settings-row__leading">{leading}</div>}
        <div className="glass-settings-row__text">
          <LabelTag
            id={labelId}
            htmlFor={htmlFor}
            className="glass-settings-row__label"
          >
            {label}
          </LabelTag>
          {description && (
            <p id={descriptionId} className="glass-settings-row__description">
              {description}
            </p>
          )}
        </div>
        {(control || value) && (
          <div className="glass-settings-row__control">
            {value && <span className="glass-settings-row__value">{value}</span>}
            {control}
          </div>
        )}
      </div>
      {children && <div className="glass-settings-row__content">{children}</div>}
    </div>
  );
});
GlassSettingsRow.displayName = 'GlassSettingsRow';

/* ── Nav ─────────────────────────────────────────────────────────────── */

export type GlassSettingsNavProps = React.HTMLAttributes<HTMLElement>;

export const GlassSettingsNav = React.forwardRef<HTMLElement, GlassSettingsNavProps>(
  ({ className, ...rest }, ref) => (
    <nav ref={ref} className={cn('glass-settings-nav', className)} {...rest} />
  ),
);
GlassSettingsNav.displayName = 'GlassSettingsNav';

export interface GlassSettingsNavGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  label?: React.ReactNode;
}

export const GlassSettingsNavGroup = React.forwardRef<
  HTMLDivElement,
  GlassSettingsNavGroupProps
>(({ label, className, children, ...rest }, ref) => {
  const labelId = React.useId();
  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={label ? labelId : undefined}
      className={cn('glass-settings-nav-group', className)}
      {...rest}
    >
      {label && (
        <div id={labelId} className="glass-settings-nav-group__label">
          {label}
        </div>
      )}
      <ul className="glass-settings-nav-group__list">{children}</ul>
    </div>
  );
});
GlassSettingsNavGroup.displayName = 'GlassSettingsNavGroup';

export interface GlassSettingsNavItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: React.ReactNode;
  icon?: React.ElementType;
  active?: boolean;
  /** Render the single child element (e.g. a router Link) as the item; its own children are replaced. */
  asChild?: boolean;
  children?: React.ReactElement;
}

export interface GlassSettingsNavFooterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  name: React.ReactNode;
  roleLabel?: React.ReactNode;
  initials?: React.ReactNode;
  onLogout?: () => void;
  logoutLabel: React.ReactNode;
  /** Icon rendered inside the logout button (app supplies it, e.g. lucide's LogOut). */
  logoutIcon?: React.ElementType;
}

export const GlassSettingsNavFooter = React.forwardRef<
  HTMLDivElement,
  GlassSettingsNavFooterProps
>(
  (
    { name, roleLabel, initials, onLogout, logoutLabel, logoutIcon: LogoutIcon, className, ...rest },
    ref,
  ) => (
    <div ref={ref} className={cn('glass-settings-nav-footer', className)} {...rest}>
      <div className="glass-settings-nav-footer__identity">
        <div className="glass-settings-nav-footer__avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="glass-settings-nav-footer__text">
          <span className="glass-settings-nav-footer__name">{name}</span>
          {roleLabel && (
            <span className="glass-settings-nav-footer__role">{roleLabel}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        className="glass-settings-nav-footer__logout"
        onClick={onLogout}
        aria-label={typeof logoutLabel === 'string' ? logoutLabel : undefined}
      >
        {LogoutIcon && (
          <LogoutIcon className="glass-settings-nav-footer__logout-icon" aria-hidden="true" />
        )}
        <span className="glass-settings-nav-footer__logout-label">{logoutLabel}</span>
      </button>
    </div>
  ),
);
GlassSettingsNavFooter.displayName = 'GlassSettingsNavFooter';

export const GlassSettingsNavItem = React.forwardRef<
  HTMLButtonElement,
  GlassSettingsNavItemProps
>(({ label, icon: Icon, active = false, asChild = false, className, children, ...rest }, ref) => {
  const content = (
    <>
      {Icon && <Icon className="glass-settings-nav-item__icon" aria-hidden="true" />}
      <span className="glass-settings-nav-item__label">{label}</span>
    </>
  );
  const shared = {
    className: cn('glass-settings-nav-item', className),
    'data-active': active ? 'true' : undefined,
    'aria-current': active ? ('page' as const) : undefined,
  };
  return (
    <li>
      {asChild && React.isValidElement(children) ? (
        <Slot ref={ref} {...shared} {...rest}>
          {React.cloneElement(children, undefined, content)}
        </Slot>
      ) : (
        <button ref={ref} type="button" {...shared} {...rest}>
          {content}
        </button>
      )}
    </li>
  );
});
GlassSettingsNavItem.displayName = 'GlassSettingsNavItem';
