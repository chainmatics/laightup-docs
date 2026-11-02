import React, { useCallback, useRef, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import './GlassTooltip.css';

export interface GlassTooltipProviderProps {
  /** Default open delay in ms. Default 200. */
  delayDuration?: number;
  /**
   * Window during which a subsequent tooltip opens instantly (warm-up
   * behavior). Radix default is 300ms.
   */
  skipDelayDuration?: number;
  /** If true, hovering tooltip content keeps it open. Default false. */
  disableHoverableContent?: boolean;
  children: React.ReactNode;
}

/**
 * App-root wrapper that supplies shared timing state to every GlassTooltip.
 * Required — without it, Radix's Tooltip.Root will log a console warning.
 */
export const GlassTooltipProvider: React.FC<GlassTooltipProviderProps> = ({
  delayDuration = 200,
  skipDelayDuration,
  disableHoverableContent = false,
  children,
}) => (
  <Tooltip.Provider
    delayDuration={delayDuration}
    skipDelayDuration={skipDelayDuration}
    disableHoverableContent={disableHoverableContent}
  >
    {children}
  </Tooltip.Provider>
);

GlassTooltipProvider.displayName = 'GlassTooltipProvider';

export interface GlassTooltipProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Tooltip content — string for simple labels, ReactNode for rich
   * content (e.g., a label + keyboard shortcut).
   */
  content: React.ReactNode;
  /** Side of the trigger the tooltip prefers. Default 'top'. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  /**
   * Per-tooltip delay override in ms. Falls back to the Provider's
   * delayDuration. Commonly used to set delay={0} for tooltips on
   * disabled controls that explain why the control is disabled.
   */
  delay?: number;
  /**
   * When true, the tooltip only opens if the trigger's text is actually
   * clipped (`scrollWidth > clientWidth` or `scrollHeight > clientHeight`). The trigger element is expected
   * to own the truncation CSS (`white-space:nowrap; overflow:hidden;
   * text-overflow:ellipsis`). When the text fits, no tooltip — clean, no
   * noise on names that already read fully.
   *
   * Implementation note: the clip check runs *on hover/focus intent*, the
   * moment Radix requests the tooltip open, rather than being pre-measured
   * and cached in state. Reading `scrollWidth`/`clientWidth` at open-time
   * means layout is fully settled, which sidesteps every first-render and
   * morph-timing race that plagued the older measure-on-mount approach (a
   * FLIP/transform morph never fires a ResizeObserver, so a cached
   * measurement taken mid-morph could get stuck `false` forever). The Radix
   * trigger stays permanently mounted; we just gate the controlled `open`
   * state on a fresh measurement.
   */
  onlyWhenTruncated?: boolean;
  /**
   * Single React element that receives pointer/keyboard focus and acts
   * as the trigger. Must forward its ref (Radix's `asChild` requirement).
   * Naked strings, fragments, and multi-element children are not
   * supported — Radix throws a descriptive error at runtime.
   *
   * HTML `disabled` suppresses pointer events at the browser level, so
   * tooltips on disabled triggers don't open. Prefer `aria-disabled="true"`
   * with a no-op onClick, or wrap the disabled element in a <span>.
   */
  children: React.ReactElement;
}

/**
 * Opinionated Radix Tooltip wrapped in glass styling. Minimum-friction
 * API for the common case:
 *
 *   <GlassTooltip content="Delete">
 *     <GlassButton icon={Trash2} />
 *   </GlassTooltip>
 *
 * Pass `onlyWhenTruncated` to make it an overflow-aware tooltip that only
 * fires when the trigger's text is actually clipped:
 *
 *   <GlassTooltip content={fullName} onlyWhenTruncated>
 *     <h2 className="truncate">{fullName}</h2>
 *   </GlassTooltip>
 */
export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  content,
  side = 'top',
  align = 'center',
  alignOffset = 0,
  delay,
  onlyWhenTruncated = false,
  open: controlledOpen,
  onOpenChange,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const nodeRef = useRef<HTMLElement | null>(null);

  // Callback ref handed to <Tooltip.Trigger>. Because the Trigger renders
  // `asChild`, Radix composes this ref onto the child's DOM node (alongside
  // its own anchor ref), so `nodeRef` always points at the exact element the
  // user sees — the one carrying the truncation CSS.
  const setTriggerNode = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  // Controlled open, gated on a *fresh* clip measurement taken at the moment
  // Radix requests the tooltip (hover/focus). The trigger's pointer/focus
  // handlers always run; we just decide whether to honor the open request.
  const handleOpenChange = useCallback(
    (next: boolean) => {
      const node = nodeRef.current;
      // 1px tolerance dodges sub-pixel rounding false-positives; line-clamp overflows vertically.
      // A nowrap line never clips vertically: glyphs poking out of a tight line-height are not a clip.
      // A real line-clamp hides at least one full line; glyph spill from a tight line-height is not a clip.
      const clipsVertically = (el: HTMLElement) => {
        const cs = getComputedStyle(el);
        if (cs.whiteSpace === 'nowrap') return false;
        const lineHeight =
          parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2 || 0;
        return el.scrollHeight - el.clientHeight > Math.max(1, lineHeight / 2);
      };
      const eligible = Boolean(
        next &&
          node &&
          (node.scrollWidth - 1 > node.clientWidth || clipsVertically(node)),
      );
      setOpen(eligible);
      onOpenChange?.(eligible);
    },
    [onOpenChange],
  );

  const rootProps = onlyWhenTruncated
    ? { open: controlledOpen ?? open, onOpenChange: handleOpenChange }
    : { open: controlledOpen, onOpenChange };

  return (
    <Tooltip.Root delayDuration={delay} {...rootProps}>
      <Tooltip.Trigger
        asChild
        ref={onlyWhenTruncated ? setTriggerNode : undefined}
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal container={typeof document !== "undefined" ? document.querySelector<HTMLElement>(".laightup-management") : undefined}>
        <Tooltip.Content
          side={side}
          align={align}
          alignOffset={alignOffset}
          sideOffset={6}
          className="glass-tooltip"
          // Truncation tooltips echo a full name/path that didn't fit — give
          // them a wider, content-sized box (CSS) so the value never gets
          // re-clipped inside the tooltip. Plain label tooltips keep the
          // narrow 240px wrap.
          data-truncation={onlyWhenTruncated ? '' : undefined}
        >
          {content}
          <Tooltip.Arrow
            className="glass-tooltip__arrow"
            width={10}
            height={5}
          />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};

GlassTooltip.displayName = 'GlassTooltip';
