import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../utils/cn';
import './GlassIconButton.css';

/**
 * GlassIconButton — compact square button for icon-only utility actions
 * (edit, save, delete, dismiss, etc.). Sibling to GlassButton; same hue
 * system but always square and stripped of horizontal padding.
 *
 * Why a separate primitive instead of a `size="icon"` variant on
 * GlassButton: GlassButton's smallest size is 32×~50 with horizontal
 * padding tuned for "button with text". Inside dense table rows or chip
 * lists, action affordances need a 24-32 SQUARE shape with zero
 * horizontal padding — different ergonomic shape, different visual
 * language. Lifting that into a dedicated primitive keeps GlassButton's
 * text-button responsibility focused.
 *
 * Variants follow the /laightup-ci dual-accent rule:
 *   brand (default)  → violet body INK at rest: the standard for neutral
 *                      utility actions (edit, close, more, open); legible on
 *                      light glass by day and dark glass by night; pairs
 *                      with `elevated` for a violet-tinted container
 *   destructive      → red rim, for delete/discard actions
 *   primary          → cyan accent (--theme-accent-h), rarely used for
 *                      icon-only; reserve for true primary affordances
 *   ghost            → white glyph by day, only on dark or colored
 *                      surfaces (toolbars, imagery) where the violet ink
 *                      would sink
 */
const iconButtonVariants = cva('glass-icon-btn', {
  variants: {
    variant: {
      ghost: 'glass-icon-btn--ghost',
      destructive: 'glass-icon-btn--destructive',
      primary: 'glass-icon-btn--primary',
      brand: 'glass-icon-btn--brand',
    },
    size: {
      sm: 'glass-icon-btn--sm',
      md: 'glass-icon-btn--md',
      lg: 'glass-icon-btn--lg',
      xl: 'glass-icon-btn--xl',
    },
    /**
     * Outline silhouette. `square` (default) keeps the rounded-rect shape;
     * `circle` makes the button a perfect circle — for trailing nav/forward
     * affordances (e.g. the dashboard action-tile arrows) where a pill/disc
     * reads as "go".
     */
    shape: {
      square: '',
      circle: 'glass-icon-btn--circle',
    },
    /**
     * Opt-in resting container + soft drop shadow. The default icon
     * button is transparent-until-hover (right for dense table-row /
     * chip-list clusters where a calm row matters). `elevated` gives it
     * a bounded surface + elevation at rest, so it reads as a discrete
     * affordance — for standalone prominent actions (e.g. the delete
     * button in the card-expand panel) that should look like a real
     * button, mirroring a dialog's close ×. Tint composes per variant.
     */
    elevated: {
      true: 'glass-icon-btn--elevated',
    },
    /**
     * Opt-in dark scrim + blur for buttons overlaid directly on
     * photography/imagery (e.g. the delete affordance on gallery image
     * tiles), where the default transparent-until-hover glyph vanishes
     * against busy or light content. Unlike `elevated` (a light milky
     * surface tuned for glass panels), this lays down a dark translucent
     * backing so the glyph keeps contrast on ANY image. The icon colour
     * stays variant-driven (destructive red, etc.).
     */
    onMedia: {
      true: 'glass-icon-btn--on-media',
    },
    /** Translucent CI-violet FAB with blurred backing; stays legible over any content. */
    floating: {
      true: 'glass-icon-btn--floating',
    },
  },
  defaultVariants: {
    variant: 'brand',
    size: 'md',
    shape: 'square',
  },
});

export interface GlassIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Render as child element (Radix Slot pattern) for composition. */
  asChild?: boolean;
  /**
   * Accessible label — REQUIRED. Icon-only buttons have no visible text,
   * so aria-label or aria-labelledby must be supplied. Marking this here
   * makes the contract explicit at the type level.
   */
  'aria-label': string;
}

export const GlassIconButton = React.forwardRef<
  HTMLButtonElement,
  GlassIconButtonProps
>(({ className, variant, size, shape, elevated, onMedia, floating, asChild = false, type, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      // Default to type="button" so the icon button never accidentally
      // submits a surrounding form (a common subtle bug with delete /
      // edit affordances inside form contexts).
      type={asChild ? undefined : type ?? 'button'}
      className={cn(iconButtonVariants({ variant, size, shape, elevated, onMedia, floating }), className)}
      {...rest}
    />
  );
});
GlassIconButton.displayName = 'GlassIconButton';
