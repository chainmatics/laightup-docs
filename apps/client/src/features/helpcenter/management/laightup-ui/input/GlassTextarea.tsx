import React from 'react';
import { cn } from '../utils/cn';
import './GlassTextarea.css';

/**
 * GlassTextarea — multi-line sibling of GlassInput. Shares the same
 * laightup CI Bright Violet body hue family (248° day; night via the `tone`
 * prop — moonlight 242° default / brand 248°) so the entire editable surface
 * set (GlassInput / GlassInline / GlassTextarea) reads as one system.
 *
 * Renders a single <textarea> with the lib's glass chrome — no wrapper
 * with prefix/icon/clear slots (those don't apply to multi-line input).
 *
 * Sizing:
 *   - `size="md"` (default): 60px min-height, vertical resize.
 *   - `size="sm"`: one line at exactly 40px (matches GlassIconButton `xl`),
 *     for chat-style composers next to a send button.
 *   - `autoGrow`: grows with its content up to `--glass-textarea-max-height`
 *     (160px default), then scrolls with the glass scrollbar.
 *   - `rows` prop sets the initial visible rows.
 */
export interface GlassTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'className' | 'size'
  > {
  className?: string;
  /**
   * Night-mode violet tone (day is identical for both). See GlassInput:
   *   - `'moonlight'` (default) — 242°, the Purkinje cool-bias.
   *   - `'brand'` — 248°, the CI Bright Violet (#503bd9).
   */
  tone?: 'moonlight' | 'brand';
  /** Lift the field off a light surface (same recipe as GlassInput `elevated`). */
  elevated?: boolean;
  /** `sm` = single-line 40px field; `md` (default) = 60px multi-line field. */
  size?: 'sm' | 'md';
  /** Grow with the content up to `--glass-textarea-max-height`, then scroll. */
  autoGrow?: boolean;
}

const supportsFieldSizing = () =>
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('field-sizing', 'content');

export const GlassTextarea = React.forwardRef<
  HTMLTextAreaElement,
  GlassTextareaProps
>(
  (
    {
      className,
      tone = 'moonlight',
      elevated = false,
      size = 'md',
      autoGrow = false,
      onInput,
      ...rest
    },
    forwardedRef,
  ) => {
    const inner = React.useRef<HTMLTextAreaElement | null>(null);
    const setRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        inner.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    const fit = React.useCallback(() => {
      const node = inner.current;
      if (!autoGrow || !node || supportsFieldSizing()) return;
      // Fallback for engines without `field-sizing: content` (Firefox).
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight + node.offsetHeight - node.clientHeight}px`;
    }, [autoGrow]);
    React.useLayoutEffect(fit, [fit, rest.value]);

    return (
      <textarea
        ref={setRef}
        className={cn(
          'glass-textarea',
          size === 'sm' && 'glass-textarea--sm',
          autoGrow && 'glass-textarea--auto-grow',
          elevated && 'glass-textarea--elevated',
          className,
        )}
        data-tone={tone}
        onInput={(event) => {
          fit();
          onInput?.(event);
        }}
        {...rest}
      />
    );
  },
);
GlassTextarea.displayName = 'GlassTextarea';
