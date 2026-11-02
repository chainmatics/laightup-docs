import React, { useEffect, useRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';
import './GlassCard.css';

/**
 * Publishes the parent <GlassCard>'s size to descendant compound
 * children (<GlassCardTitle>, <GlassCardDescription>) so their
 * typography scale tracks the card size. null outside any card.
 */
export const GlassCardSizeContext = React.createContext<
  'sm' | 'md' | 'lg' | 'xl' | null
>(null);

/**
 * Publishes the parent <GlassCard>'s layout to descendant compound
 * children (<GlassCardMedia>) so layout-aware defaults (e.g. aspect
 * ratio) adapt without requiring an explicit prop. Defaults to 'stacked'
 * outside any card, matching the <GlassCard> layout prop default.
 */
export const GlassCardLayoutContext = React.createContext<'stacked' | 'row'>(
  'stacked',
);

const cardVariants = cva('glass', {
  variants: {
    size: {
      sm: 'glass-card-sm glass-card--sm',
      md: 'glass-card-md glass-card--md',
      lg: 'glass-card-lg glass-card--lg',
      xl: 'glass-card-xl glass-card--xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Render as child element (Radix Slot pattern) */
  asChild?: boolean;
  /** Enable hover lift, border brighten, active press states */
  interactive?: boolean;
  /**
   * Parallax tilt on hover.
   * Pointer position within the card drives 3D rotation (±7°/±5°) and the
   * specular highlight follows the cursor in day mode (linear directional
   * wash in night mode per the moonlight palette). Respects
   * prefers-reduced-motion. Reserve for hero cards — if it tilts, it's
   * saying "notice me".
   */
  tilt?: boolean;
  /**
   * Arrangement of compound children. 'stacked' (default) is a flex
   * column. 'row' is a 3-column grid — leading Media, body (Header +
   * Content), trailing Footer — each column collapses if empty.
   */
  layout?: 'stacked' | 'row';
  /**
   * Marks this card as the active/selected item in a multi-select
   * surface. Triggers a prismatic rim ring (day: warm → plum; night:
   * silver → violet) via --rim-c1..c3. Published as data-selected on
   * the root for CSS rules and descendant overlays that adjust their
   * visibility based on selection state.
   */
  selected?: boolean;
  /**
   * Recedes this card visually when a sibling is selected. Reduces
   * --glass-tint-alpha and applies filter: saturate(0.82). Does NOT
   * reduce opacity (glass transparency compounds badly with opacity).
   * Published as data-dim on the root.
   */
  dim?: boolean;
  /**
   * Linked-hover state driven from outside the card (e.g. hovering the pin
   * this card belongs to). Paints the same ambient violet wash as a hover.
   * Published as data-highlighted on the root.
   */
  highlighted?: boolean;
  /**
   * Solid (matte) surface variant. Swaps the default refractive recipe for a
   * calmer, more opaque frosted glass — backdrop blur + an opaque-ish tint +
   * a simple inset highlight, WITHOUT the light-specular veil or the prismatic
   * rim (the same surface the GlassActionTile uses). For dense content panels
   * where the Refracted-Light flourishes read as busy or over-lighten the
   * surface.
   */
  solid?: boolean;
  /**
   * Fully opaque surface variant. No tint alpha, no backdrop blur, no specular
   * veil or prismatic rim - white in day mode, the dark panel tone in night
   * mode. For dense working surfaces (data tables, editors) where the canvas
   * showing through costs legibility.
   */
  opaque?: boolean;
  /**
   * Aurora (Tier-3 hero) surface variant. A deeper, more layered float plus a
   * slow cyan→violet aurora light-wash, designed to host a <GlassRefractCanvas>
   * child for the live WebGL upgrade (toggle `data-refract-ready` on the root to
   * crossfade the CSS stand-in out). Reserve for 1–2 hero surfaces per page.
   */
  aurora?: boolean;
  className?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      asChild = false,
      interactive = false,
      tilt = false,
      size = 'md',
      layout = 'stacked',
      selected = false,
      dim = false,
      highlighted = false,
      solid = false,
      opaque = false,
      aurora = false,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'div';
    const internalRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref ?? internalRef) as React.RefObject<HTMLDivElement>;

    useEffect(() => {
      if (!tilt) return;
      const el = combinedRef.current;
      if (!el) return;

      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

      let rect: DOMRect | null = null;

      const onEnter = () => {
        rect = el.getBoundingClientRect();
        el.classList.add('glass-card-tilt--hovering');
      };
      const onMove = (e: PointerEvent) => {
        if (!rect) rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        el.style.setProperty('--tilt-x', `${(px - 0.5) * 14}deg`);
        el.style.setProperty('--tilt-y', `${(py - 0.5) * -10}deg`);
        el.style.setProperty('--hl-x', `${px * 100}%`);
        el.style.setProperty('--hl-y', `${py * 100}%`);
      };
      const onLeave = () => {
        rect = null;
        el.classList.remove('glass-card-tilt--hovering');
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
        // Animate highlight back to the global light position, then clear
        // so drift mode can take over again.
        const rootStyle = getComputedStyle(document.documentElement);
        const lx = rootStyle.getPropertyValue('--light-x').trim() || '30%';
        const ly = rootStyle.getPropertyValue('--light-y').trim() || '18%';
        el.style.setProperty('--hl-x', lx);
        el.style.setProperty('--hl-y', ly);
        window.setTimeout(() => {
          el.style.removeProperty('--hl-x');
          el.style.removeProperty('--hl-y');
        }, 600);
      };

      el.addEventListener('pointerenter', onEnter);
      el.addEventListener('pointermove', onMove, { passive: true });
      el.addEventListener('pointerleave', onLeave);

      return () => {
        el.removeEventListener('pointerenter', onEnter);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
      };
    }, [tilt, combinedRef]);

    return (
      <GlassCardSizeContext.Provider value={size ?? 'md'}>
        <GlassCardLayoutContext.Provider value={layout}>
          <Comp
            ref={combinedRef as React.Ref<HTMLDivElement>}
            data-layout={layout}
            data-selected={selected ? 'true' : undefined}
            data-dim={dim ? 'true' : undefined}
            data-highlighted={highlighted ? 'true' : undefined}
            className={cn(
              'glass-card',
              cardVariants({ size }),
              interactive && 'glass-card-interactive',
              tilt && 'glass-card-tilt',
              solid && 'glass-solid',
              opaque && 'glass-opaque',
              aurora && 'glass-aurora',
              className,
            )}
            {...rest}
          >
            {children}
          </Comp>
        </GlassCardLayoutContext.Provider>
      </GlassCardSizeContext.Provider>
    );
  },
);

GlassCard.displayName = 'GlassCard';

/* ── GlassCardHeader ─────────────────────────────────────────────────── */

export interface GlassCardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  GlassCardHeaderProps
>(({ asChild = false, className, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      {...rest}
      className={cn('glass-card-header', className)}
    />
  );
});
GlassCardHeader.displayName = 'GlassCardHeader';

/* ── GlassCardAction ─────────────────────────────────────────────────── */

export interface GlassCardActionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const GlassCardAction = React.forwardRef<
  HTMLDivElement,
  GlassCardActionProps
>(({ asChild = false, className, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      {...rest}
      className={cn('glass-card-action', className)}
    />
  );
});
GlassCardAction.displayName = 'GlassCardAction';

/* ── GlassCardTitle ──────────────────────────────────────────────────── */

export interface GlassCardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Render as child element via Radix Slot. Default false. Use when
   * you need <h2>, <a>, or any element other than the default <h3>.
   */
  asChild?: boolean;
}

export const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  GlassCardTitleProps
>(({ asChild = false, className, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'h3';
  const size = React.useContext(GlassCardSizeContext) ?? 'md';
  return (
    <Comp
      ref={ref as React.Ref<HTMLHeadingElement>}
      {...rest}
      className={cn('glass-card-title', `glass-card-title--${size}`, className)}
    />
  );
});
GlassCardTitle.displayName = 'GlassCardTitle';

/* ── GlassCardDescription ───────────────────────────────────────────── */

export interface GlassCardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean;
}

export const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  GlassCardDescriptionProps
>(({ asChild = false, className, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'p';
  const size = React.useContext(GlassCardSizeContext) ?? 'md';
  return (
    <Comp
      ref={ref as React.Ref<HTMLParagraphElement>}
      {...rest}
      className={cn(
        'glass-card-description',
        `glass-card-description--${size}`,
        className,
      )}
    />
  );
});
GlassCardDescription.displayName = 'GlassCardDescription';

/* ── GlassCardMedia ─────────────────────────────────────────────────── */

export interface GlassCardMediaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * CSS aspect-ratio. Strings pass through ('16/9', '4/3'). Numbers
   * format as `${n} / 1` (e.g., 1.5 → '1.5 / 1'). `null` disables the
   * ratio lock and lets content size the region. Default: `'16/9'` in
   * stacked layout, `'1/1'` in row layout (read from
   * `GlassCardLayoutContext`). Pass `ratio={null}` to delegate
   * aspect-ratio control to inline `style` instead.
   *
   * Row-mode width: the leading media column sizes to content by
   * default. To fix a column width in a row card, pass `style={{
   * width: <n>px }}` on this element — width control is intentionally
   * delegated to inline style because row cards vary widely in their
   * leading-visual size.
   */
  ratio?: string | number | null;
  /**
   * Extend media edge-to-edge by negating the parent card's padding
   * via negative margins. Corners inherit the card's border-radius.
   */
  bleed?: boolean;
  asChild?: boolean;
}

export const GlassCardMedia = React.forwardRef<
  HTMLDivElement,
  GlassCardMediaProps
>(
  (
    { asChild = false, ratio, bleed = false, className, style, ...rest },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'div';
    const layout = React.useContext(GlassCardLayoutContext);

    // When no ratio is supplied, derive a layout-aware default:
    // row cards are horizontally tight → square (1/1) reads better;
    // stacked cards are full-width → widescreen (16/9) is the natural default.
    const effectiveRatio =
      ratio === undefined ? (layout === 'row' ? '1/1' : '16/9') : ratio;

    const aspectRatioValue =
      effectiveRatio === null
        ? undefined
        : typeof effectiveRatio === 'number'
          ? `${effectiveRatio} / 1`
          : effectiveRatio;

    const mergedStyle: React.CSSProperties = {
      ...style,
      ...(aspectRatioValue !== undefined ? { aspectRatio: aspectRatioValue } : {}),
    };

    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        {...rest}
        data-bleed={bleed ? 'true' : undefined}
        style={mergedStyle}
        className={cn('glass-card-media', className)}
      />
    );
  },
);
GlassCardMedia.displayName = 'GlassCardMedia';

/* ── GlassCardContent ───────────────────────────────────────────────── */

export interface GlassCardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  GlassCardContentProps
>(({ asChild = false, className, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      {...rest}
      className={cn('glass-card-content', className)}
    />
  );
});
GlassCardContent.displayName = 'GlassCardContent';

/* ── GlassCardFooter ────────────────────────────────────────────────── */

export interface GlassCardFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  GlassCardFooterProps
>(({ asChild = false, className, ...rest }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      {...rest}
      className={cn('glass-card-footer', className)}
    />
  );
});
GlassCardFooter.displayName = 'GlassCardFooter';

export { cardVariants };

/* ── GlassCardSelectToggle ────────────────────────────────────────────
   Round glass checkbox pill. Positioned absolute top-right of the
   parent .glass-card-media via CSS. Visibility: hidden by default,
   revealed on card hover AND always-visible when the card has
   data-selected or data-dim — so once any grid sibling is selected,
   every toggle appears without needing hover. */

const CheckGlyph: React.FC = () => (
  <svg
    width="14"
    height="14"
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

export interface GlassCardSelectToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  /** Controlled checked state. */
  checked: boolean;
  /** Called with the NEW checked value. */
  onCheckedChange?: (next: boolean) => void;
}

export const GlassCardSelectToggle = React.forwardRef<
  HTMLButtonElement,
  GlassCardSelectToggleProps
>(({ checked, onCheckedChange, onClick, className, ...rest }, ref) => {
  return (
    <button
      ref={ref}
      {...rest}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={rest['aria-label'] ?? 'Select item'}
      data-checked={checked ? 'true' : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange?.(!checked);
        onClick?.(e);
      }}
      className={cn('glass-card-select-toggle', className)}
    >
      {checked ? <CheckGlyph /> : null}
    </button>
  );
});
GlassCardSelectToggle.displayName = 'GlassCardSelectToggle';

/* ── GlassCardDragHandle ──────────────────────────────────────────────
   Grip glyph at top-left of Media. Hover-reveal only (drag is an
   affordance, not a state indicator). Spreads all props through so
   dnd-kit listeners / attributes can attach via spread. */

const GripGlyph: React.FC = () => (
  <svg
    width="12"
    height="16"
    viewBox="0 0 12 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="3" cy="3" r="1.25" />
    <circle cx="9" cy="3" r="1.25" />
    <circle cx="3" cy="8" r="1.25" />
    <circle cx="9" cy="8" r="1.25" />
    <circle cx="3" cy="13" r="1.25" />
    <circle cx="9" cy="13" r="1.25" />
  </svg>
);

export type GlassCardDragHandleProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
>;

export const GlassCardDragHandle = React.forwardRef<
  HTMLButtonElement,
  GlassCardDragHandleProps
>(({ className, onClick, ...rest }, ref) => {
  return (
    <button
      ref={ref}
      {...rest}
      type="button"
      aria-label={rest['aria-label'] ?? 'Drag to reorder'}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn('glass-card-drag-handle', className)}
    >
      <GripGlyph />
    </button>
  );
});
GlassCardDragHandle.displayName = 'GlassCardDragHandle';

/* ── GlassCardFavoriteToggle ──────────────────────────────────────────
   Star toggle button. Always-visible (favorited is a persistent state,
   not a contextual affordance). No forced position — consumer places
   it (Header.Action slot, Media corner via inline position:absolute,
   etc.). Day pressed color is warm gold; night pressed color is
   themed lavender because moonlight-optics rule bans warm accents in
   night mode (moon disc is the only warm anchor allowed). */

const StarGlyph: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export interface GlassCardFavoriteToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Controlled pressed state. */
  pressed: boolean;
  /** Called with the NEW pressed value. */
  onPressedChange?: (next: boolean) => void;
}

export const GlassCardFavoriteToggle = React.forwardRef<
  HTMLButtonElement,
  GlassCardFavoriteToggleProps
>(({ pressed, onPressedChange, onClick, className, ...rest }, ref) => {
  const defaultLabel = pressed ? 'Remove favorite' : 'Add to favorites';
  return (
    <button
      ref={ref}
      {...rest}
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={rest['aria-label'] ?? defaultLabel}
      data-pressed={pressed ? 'true' : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onPressedChange?.(!pressed);
        onClick?.(e);
      }}
      className={cn('glass-card-favorite-toggle', className)}
    >
      <StarGlyph filled={pressed} />
    </button>
  );
});
GlassCardFavoriteToggle.displayName = 'GlassCardFavoriteToggle';

/* ── GlassCardOverlay ─────────────────────────────────────────────────
   Absolute-positioned overlay inside Media. 'bottom' (default) =
   bottom-anchored gradient strip with children as inline flex row
   for action buttons. 'full' = dark scrim covering the whole media
   with children centered. Hover-only visibility on the parent card. */

export interface GlassCardOverlayProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** 'bottom' (default) or 'full'. */
  position?: 'bottom' | 'full';
  asChild?: boolean;
}

export const GlassCardOverlay = React.forwardRef<
  HTMLDivElement,
  GlassCardOverlayProps
>(
  (
    { asChild = false, position = 'bottom', className, onClick, ...rest },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref as React.Ref<HTMLDivElement>}
        {...rest}
        data-position={position}
        // The overlay is a contained interactive region. Clicks on its
        // children are scoped to those children — they must NOT bubble
        // up and trigger the parent card's onClick (primary action).
        // Consumer onClick on the overlay itself is preserved; it runs
        // before the stopPropagation so parent handlers further up the
        // tree still don't see it either.
        onClick={(e) => {
          onClick?.(e);
          e.stopPropagation();
        }}
        className={cn('glass-card-overlay', className)}
      />
    );
  },
);
GlassCardOverlay.displayName = 'GlassCardOverlay';
