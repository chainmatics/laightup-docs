import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '../utils/cn';
import '../menu/GlassMenu.css';
import './GlassPopover.css';

/* ─────────────────────────────────────────────────────────────────────────
   GlassPopover — anchored mini-surface for rich content with controls.

   Sits between GlassTooltip (whisper) and GlassDialog (modal). Use for
   date pickers, color pickers, small filter forms, "what's this?"
   popouts. Anchored content > 440px should escalate to a Dialog.

   Wraps Radix Popover transparently, including Anchor for cases where
   the trigger and the anchor must differ (e.g., a date popover that
   anchors to its input but is opened by a button elsewhere).

   Defaults: side='bottom', align='start', sideOffset=8,
             collisionPadding=8, modal=false, size='md'.

   Usage:
     <GlassPopover>
       <GlassPopoverTrigger asChild><GlassButton>Open</GlassButton></GlassPopoverTrigger>
       <GlassPopoverContent size="md">
         …content…
         <GlassPopoverArrow />
         <GlassPopoverClose><X /></GlassPopoverClose>
       </GlassPopoverContent>
     </GlassPopover>
   ───────────────────────────────────────────────────────────────────────── */

export type GlassPopoverSize = 'sm' | 'md' | 'lg';

/** `menu`: the popover paints the GlassMenu chrome itself so a hosted
 *  GlassMenu renders flat (one surface, no double frame). */
export type GlassPopoverVariant = 'default' | 'menu';

/** `solid`: near-opaque milky surface for popovers over imagery/media, so
 *  translucent controls inside stay legible. */
export type GlassPopoverSurface = 'glass' | 'solid';

/* ───────────────────────── Root ───────────────────────── */

export interface GlassPopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * When true, popover blocks background interaction and traps focus
   * (Radix modal behavior). Default `false` — anchored content should
   * coexist with the page beneath; for forms-inside-popovers users
   * still expect to click out and have focus naturally fall back.
   */
  modal?: boolean;
  children: React.ReactNode;
}

export const GlassPopover: React.FC<GlassPopoverProps> = ({
  open,
  defaultOpen,
  onOpenChange,
  modal = false,
  children,
}) => (
  <Popover.Root
    open={open}
    defaultOpen={defaultOpen}
    onOpenChange={onOpenChange}
    modal={modal}
  >
    {children}
  </Popover.Root>
);
GlassPopover.displayName = 'GlassPopover';

/* ───────────────────────── Trigger ───────────────────────── */

export type GlassPopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof Popover.Trigger
>;

export const GlassPopoverTrigger = React.forwardRef<
  React.ElementRef<typeof Popover.Trigger>,
  GlassPopoverTriggerProps
>(({ className, ...rest }, ref) => (
  <Popover.Trigger
    ref={ref}
    className={cn('glass-popover-trigger', className)}
    {...rest}
  />
));
GlassPopoverTrigger.displayName = 'GlassPopoverTrigger';

/* ───────────────────────── Anchor ───────────────────────── */

export type GlassPopoverAnchorProps = React.ComponentPropsWithoutRef<
  typeof Popover.Anchor
>;

export const GlassPopoverAnchor = React.forwardRef<
  React.ElementRef<typeof Popover.Anchor>,
  GlassPopoverAnchorProps
>((props, ref) => <Popover.Anchor ref={ref} {...props} />);
GlassPopoverAnchor.displayName = 'GlassPopoverAnchor';

/* ───────────────────────── Content ───────────────────────── */

export interface GlassPopoverContentProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof Popover.Content>,
    'asChild'
  > {
  /** Width preset; default 'md' (= 360px max-width). */
  size?: GlassPopoverSize;
  /**
   * Override max-width directly. Number → `${n}px`. String passes through
   * unchanged (e.g., '32rem'). Takes precedence over `size`.
   */
  width?: number | string;
  /** Surface skin; default 'default'. `menu` ignores `size` (menu width
   *  rules apply), use `width` to override. */
  variant?: GlassPopoverVariant;
  /** Surface density; default 'glass'. `solid` swaps the translucent tint for
   *  a near-opaque one (blur, radius, shadow and rim unchanged). Composes with
   *  `variant="menu"`: the menu chrome keeps its shape, only the fill turns solid. */
  surface?: GlassPopoverSurface;
}

export const GlassPopoverContent = React.forwardRef<
  React.ElementRef<typeof Popover.Content>,
  GlassPopoverContentProps
>(
  (
    {
      className,
      size = 'md',
      width,
      variant = 'default',
      surface = 'glass',
      side = 'bottom',
      align = 'start',
      sideOffset = 8,
      collisionPadding = 8,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const inlineStyle: React.CSSProperties = { ...style };
    if (width !== undefined) {
      inlineStyle.maxWidth = typeof width === 'number' ? `${width}px` : width;
    }
    return (
      <Popover.Portal container={typeof document !== "undefined" ? document.querySelector<HTMLElement>(".laightup-management") : undefined}>
        <Popover.Content
          ref={ref}
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          className={cn(
            'glass-popover-content',
            `glass-popover-content--${size}`,
            variant === 'menu' && 'glass-popover-content--menu',
            surface === 'solid' && 'glass-popover-content--solid',
            className,
          )}
          style={inlineStyle}
          data-variant={variant}
          data-surface={surface}
          {...rest}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    );
  },
);
GlassPopoverContent.displayName = 'GlassPopoverContent';

/* ───────────────────────── Arrow ───────────────────────── */

export type GlassPopoverArrowProps = React.ComponentPropsWithoutRef<
  typeof Popover.Arrow
>;

export const GlassPopoverArrow = React.forwardRef<
  React.ElementRef<typeof Popover.Arrow>,
  GlassPopoverArrowProps
>(({ className, width = 10, height = 6, ...rest }, ref) => (
  <Popover.Arrow
    ref={ref}
    width={width}
    height={height}
    aria-hidden="true"
    className={cn('glass-popover-arrow', className)}
    {...rest}
  />
));
GlassPopoverArrow.displayName = 'GlassPopoverArrow';

/* ───────────────────────── Close ───────────────────────── */

export type GlassPopoverCloseProps = React.ComponentPropsWithoutRef<
  typeof Popover.Close
>;

export const GlassPopoverClose = React.forwardRef<
  React.ElementRef<typeof Popover.Close>,
  GlassPopoverCloseProps
>(({ className, 'aria-label': ariaLabel = 'Close', ...rest }, ref) => (
  <Popover.Close
    ref={ref}
    aria-label={ariaLabel}
    className={cn('glass-popover-close', className)}
    {...rest}
  />
));
GlassPopoverClose.displayName = 'GlassPopoverClose';
