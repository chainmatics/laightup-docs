'use client';

import React from 'react';
import { cn } from '../utils/cn';
import { GlassTooltip } from '../tooltip/GlassTooltip';
import './GlassTruncatedText.css';

/**
 * Self-clipping text that reveals its full value in a tooltip on hover/focus.
 * Three forms: `lines={1}` (default) single-line ellipsis, `lines>1` line clamp,
 * `wrap` wraps instead of clipping — for a name embedded inside a sentence.
 */

function extractText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return '';
}

/** Nearest ancestor whose single-line ellipsis would swallow an atomic inline whole. */
function findClippingAncestor(node: HTMLElement): HTMLElement | null {
  let el = node.parentElement;
  for (let depth = 0; el && depth < 6; depth++, el = el.parentElement) {
    const cs = getComputedStyle(el);
    if (
      cs.whiteSpace === 'nowrap' &&
      cs.overflow !== 'visible' &&
      cs.textOverflow === 'ellipsis'
    ) {
      return el;
    }
  }
  return null;
}

export type GlassTruncatedTextProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  'children' | 'title'
> & {
  /** The text to render. Strings double as the tooltip content. */
  children: React.ReactNode;
  /** Tooltip content. Overrides the text auto-extracted from `children`. */
  tooltip?: React.ReactNode;
  /** Tag to render. @default 'span' */
  as?: React.ElementType;
  /** 1 = single-line ellipsis, >1 = line clamp. @default 1 */
  lines?: number;
  /**
   * Render inline-block so the value can sit inside a sentence. Never use this
   * inside a line that itself clips: an inline-block is an atomic inline, so
   * the parent's ellipsis drops the whole box and the value vanishes. Clip the
   * whole sentence instead.
   */
  inline?: boolean;
  /** Wrap instead of clipping — mutually exclusive with clipping, overrides `lines`. */
  wrap?: boolean;
  /** Side the tooltip prefers. @default 'top' */
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  /** Suppress the tooltip (e.g. an ancestor already explains the value). */
  disableTooltip?: boolean;
  /** Open delay in ms. Falls back to the app-wide GlassTooltipProvider. */
  tooltipDelay?: number;
};

export const GlassTruncatedText = React.forwardRef<
  HTMLElement,
  GlassTruncatedTextProps
>(
  (
    {
      children,
      tooltip,
      as: Tag = 'span',
      lines = 1,
      inline = false,
      wrap = false,
      tooltipSide = 'top',
      disableTooltip = false,
      tooltipDelay,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const clamped = !wrap && lines > 1;
    // `tooltip={cond && value}` passes false/'' — treat any falsy-empty value as absent.
    const hasTooltipOverride =
      tooltip !== undefined && tooltip !== null && tooltip !== false && tooltip !== '';
    const extracted = tooltip === undefined ? extractText(children).trim() : '';
    const content = hasTooltipOverride ? tooltip : extracted !== '' ? extracted : null;

    const missingText =
      tooltip === undefined && extracted === '' && !disableTooltip && !wrap;
    const nodeRef = React.useRef<HTMLElement | null>(null);
    const setNode = React.useCallback(
      (node: HTMLElement | null) => {
        nodeRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      },
      [ref],
    );

    // In an effect, not the render body: a list row re-renders often and would flood the console.
    React.useEffect(() => {
      if (
        typeof process === 'undefined' ||
        process.env?.['NODE_ENV'] !== 'development'
      ) {
        return;
      }
      if (missingText) {
        console.warn(
          'GlassTruncatedText: children has no extractable text — pass `tooltip` explicitly.',
        );
      }
      if (inline && nodeRef.current && findClippingAncestor(nodeRef.current)) {
        console.warn(
          'GlassTruncatedText: `inline` sits inside a clipping ancestor. An inline-block is an ' +
            'atomic inline, so the ancestor\'s ellipsis drops the whole box and the text vanishes. ' +
            'Clip the whole line instead.',
        );
      }
    }, [missingText, inline]);

    const element = (
      <Tag
        ref={setNode}
        className={cn(
          'glass-truncated-text',
          wrap && 'glass-truncated-text--wrap',
          !wrap && lines <= 1 && 'glass-truncated-text--single',
          clamped && 'glass-truncated-text--clamp',
          inline && 'glass-truncated-text--inline',
          className,
        )}
        style={
          clamped
            ? { ...style, ['--glass-truncated-text-lines' as string]: String(lines) }
            : style
        }
        {...rest}
      >
        {children}
      </Tag>
    );

    if (disableTooltip || wrap || content === null) return element;

    return (
      <GlassTooltip
        content={content}
        side={tooltipSide}
        delay={tooltipDelay}
        onlyWhenTruncated
      >
        {element}
      </GlassTooltip>
    );
  },
);

GlassTruncatedText.displayName = 'GlassTruncatedText';
