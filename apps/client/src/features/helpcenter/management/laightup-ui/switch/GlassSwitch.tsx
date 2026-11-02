/**
 * @chainmatics/laightup-glass — GlassSwitch
 *
 * Pill-track + circular-thumb on/off control. Wraps Radix Switch for
 * accessibility (keyboard nav, ARIA, form integration) and skins it
 * with the laightup glass identity:
 *
 *  - Track off:  glassy translucent grey, low-alpha tint + backdrop-filter
 *  - Track on:   warm peach-amber gradient (day) / theme-amethyst (night)
 *                — engaged = "letting light through", echoes the sunbeam
 *                / moonlight metaphor used throughout the library
 *  - Thumb:      reuses the scrollbar's 4-layer recipe (lesson #46)
 *                body + top highlight + screen-blend specular catchlight
 *                + bottom meniscus + prismatic hairline rim
 *  - Motion:     spring-overshoot easing from the scrollbar work
 *                (cubic-bezier(0.34, 1.2, 0.64, 1)) over 220ms
 *  - Active:     thumb compresses slightly, springs back on release
 *  - Focus:      theme-color outline ring with 2px offset
 *  - Reduced motion: snap, no spring overshoot
 *
 * Sizes (track × thumb):
 *  - 'sm' — 36 × 20 (thumb 16)
 *  - 'md' — 44 × 26 (thumb 22)  ← default
 *  - 'lg' — 56 × 32 (thumb 28)
 *
 * API: pass-through Radix Switch props — controlled (`checked` +
 * `onCheckedChange`) or uncontrolled (`defaultChecked`). All standard
 * form-integration props (`name`, `value`, `required`, `disabled`,
 * `id`, `aria-*`) work as expected.
 */
import React from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '../utils/cn';
import './GlassSwitch.css';

export type GlassSwitchSize = 'sm' | 'md' | 'lg';

export interface GlassSwitchLabels {
  /** Text rendered when the switch is in the OFF state. */
  off: React.ReactNode;
  /** Text rendered when the switch is in the ON state. */
  on: React.ReactNode;
}

export interface GlassSwitchProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>,
    'asChild'
  > {
  /** Visual size. Default: 'md'. */
  size?: GlassSwitchSize;
  /**
   * Inline state labels rendered inside the track — text (e.g.,
   * 'On'/'Off') or icons (any `ReactNode`, including SVGs that use
   * `fill="currentColor"` to inherit the label color tokens).
   *
   * The label opposite the thumb is the visible one — off-content on
   * the right when unchecked, on-content on the left when checked.
   * Decorative: Radix Switch already exposes state via ARIA, so the
   * inline content is `aria-hidden`.
   *
   * NOT SUPPORTED ON `size='sm'` — the track is too narrow for a
   * fixed slot without colliding with the thumb. Setting `labels`
   * with `size='sm'` is a no-op (labels are silently dropped + a
   * dev-mode console warning is emitted). Use `'md'` or `'lg'`.
   *
   * Enabling labels widens the track (md 44→68 / lg 56→84) and
   * carves a fixed slot opposite the thumb (md 22×18 / lg 30×22) so
   * text and icons render at the same visual position regardless of
   * content type. The thumb diameter and track height are unchanged.
   *
   * Recommended content per size:
   *  - md: 2-3 char text (e.g., 'On'/'Off') or 14-16px icons
   *  - lg: 3-4 char text (e.g., 'Auto'/'Man') or 16-20px icons
   */
  labels?: GlassSwitchLabels;
}

export const GlassSwitch = React.forwardRef<
  React.ElementRef<typeof RadixSwitch.Root>,
  GlassSwitchProps
>(({ size = 'md', labels, className, ...rest }, ref) => {
  // Labels (text or icon) are not supported on size='sm' — the track
  // is too narrow for a fixed slot opposite the thumb without colliding.
  // Silently drop them at this size; emit a dev-mode warning so the
  // consumer knows they're being ignored.
  const allowLabels = size !== 'sm' && labels !== undefined;

  React.useEffect(() => {
    const isDev =
      typeof process !== 'undefined' &&
      process.env?.['NODE_ENV'] === 'development';
    if (!isDev) return;
    if (size === 'sm' && labels !== undefined) {
      console.warn(
        '[GlassSwitch] labels are not supported on size="sm" (track too narrow); use size="md" or "lg" if labels are required. Labels were ignored.',
      );
    }
  }, [size, labels]);

  return (
    <RadixSwitch.Root
      ref={ref}
      className={cn(
        'glass-switch',
        allowLabels && 'glass-switch--with-labels',
        className,
      )}
      data-size={size}
      {...rest}
    >
      {allowLabels && labels ? (
        <>
          <span
            className="glass-switch__label glass-switch__label--on"
            aria-hidden="true"
          >
            {labels.on}
          </span>
          <span
            className="glass-switch__label glass-switch__label--off"
            aria-hidden="true"
          >
            {labels.off}
          </span>
        </>
      ) : null}
      <RadixSwitch.Thumb className="glass-switch__thumb" />
    </RadixSwitch.Root>
  );
});

GlassSwitch.displayName = 'GlassSwitch';
