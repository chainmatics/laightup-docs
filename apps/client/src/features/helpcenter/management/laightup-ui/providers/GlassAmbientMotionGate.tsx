'use client';

/**
 * @chainmatics/laightup-glass — GlassAmbientMotionGate
 *
 * Freezes purely decorative, infinitely looping motion while nobody is
 * interacting with the page, by reflecting `data-user-idle="true"` onto
 * <html>. Elements marked `data-ambient-motion` (plus their ::before /
 * ::after) get `animation-play-state: paused` under that flag — see
 * glass-utilities.css.
 *
 * Why this exists: a running CSS animation keeps Chromium's whole frame
 * pipeline awake at the display refresh rate, and that wake-up — not the
 * animation's size or complexity — is the dominant cost. Measured on a 120Hz
 * display as % of one CPU core: 0 running animations 0.0%, ONE 10px pulsing
 * dot 16-21%, 60 of them 40%. So a page is either ~free or ~20%+; trimming
 * decoration without reaching ZERO running loops buys almost nothing.
 *
 * Pausing (rather than removing) keeps the design intact: motion plays
 * whenever the user is actually present, and only freezes after they have
 * been still for `idleAfterMs`. `animation-play-state` preserves the keyframe
 * position — right for symmetric pulses; one-way sweeps are parked off-screen
 * instead (see the registries in glass-utilities.css / app index.css).
 *
 * Mount once at the app root, next to LightDirectionProvider.
 */

import { useEffect } from 'react';

export interface GlassAmbientMotionGateProps {
  /** Idle threshold in ms. Default 4000 — long enough that any input-driven
   *  animation has finished before decoration freezes. */
  readonly idleAfterMs?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Idle signal for JS-driven loops
//
// CSS decoration is handled by the attribute selector; rAF loops need the same
// signal in script. Module-level so a loop can subscribe without threading a
// context through (these live inside WebGL init callbacks and imperative
// effects, not React trees).
// ─────────────────────────────────────────────────────────────────────────────

let ambientIdle = false;
const idleListeners = new Set<() => void>();

function publishIdle(next: boolean): void {
  if (next === ambientIdle) return;
  ambientIdle = next;
  for (const cb of idleListeners) cb();
}

/** True while the user has been inactive past the gate's threshold. */
export function isAmbientMotionIdle(): boolean {
  return ambientIdle;
}

/** Subscribe to idle transitions. Returns an unsubscribe fn. */
export function subscribeAmbientMotion(cb: () => void): () => void {
  idleListeners.add(cb);
  return () => idleListeners.delete(cb);
}

/**
 * rAF loop that only runs while the user is present.
 *
 * Drop-in for the `const tick = () => { …; raf = requestAnimationFrame(tick) }`
 * pattern: a loop written that way never stops, and a never-stopping loop keeps
 * Chromium's frame pipeline awake at the display refresh rate for as long as the
 * component is mounted — the same ~16-21%-of-a-core cost as a stray CSS
 * animation, whether it repaints SVG attributes or redraws a WebGL canvas.
 *
 * The first frame ALWAYS runs, even if the user is already idle — a canvas that
 * never draws stays blank, so suspending before the first paint would be a
 * visual regression, not an optimization. Only the repeat is gated.
 *
 * The first `now` handed to `frame` excludes suspended time: consumers derive
 * phase from absolute timestamps (`Math.sin(now / period)`), and without the
 * offset a long suspension would make motion visibly JUMP on resume instead of
 * continuing where it froze. The second argument is the raw rAF timestamp for
 * comparing against `performance.now()`-stamped events (their timebase).
 *
 * Returns a stop function; call it from the effect's cleanup.
 */
export function ambientRafLoop(
  frame: (now: number, rawNow: number) => void,
): () => void {
  let raf = 0;
  let stopped = false;
  let pausedTotal = 0;
  let suspendedAt: number | undefined;

  const pump = (now: number) => {
    if (stopped) return;
    if (suspendedAt !== undefined) {
      pausedTotal += now - suspendedAt;
      suspendedAt = undefined;
    }
    frame(now - pausedTotal, now);
    // Self-suspend after painting rather than cancelling from the listener:
    // the surface is up to date, it just stops being repainted.
    if (ambientIdle) {
      raf = 0;
      suspendedAt = now;
    } else {
      raf = requestAnimationFrame(pump);
    }
  };

  const sync = () => {
    if (stopped || ambientIdle || raf) return;
    raf = requestAnimationFrame(pump);
  };

  const unsubscribe = subscribeAmbientMotion(sync);
  raf = requestAnimationFrame(pump);

  return () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    unsubscribe();
  };
}

/** Input that counts as "the user is here". Passive + capture so nothing in
 *  the app can swallow them before we see them. resize/orientationchange count
 *  too: suspended rAF loops size their buffers per frame, so a resize while
 *  idle must wake them or canvases stay stretched at stale dimensions. */
const ACTIVITY_EVENTS = [
  'pointermove',
  'pointerdown',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
  'focusin',
  'resize',
  'orientationchange',
] as const;

export function GlassAmbientMotionGate({
  idleAfterMs = 4000,
}: GlassAmbientMotionGateProps): null {
  useEffect(() => {
    const root = document.documentElement;
    let lastActivity = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idle = false;

    const setIdle = (next: boolean) => {
      if (next === idle) return;
      idle = next;
      if (next) root.dataset['userIdle'] = 'true';
      else delete root.dataset['userIdle'];
      publishIdle(next);
    };

    const arm = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(tick, delay);
    };

    function tick() {
      if (document.hidden) {
        setIdle(true);
        return;
      }
      const quietFor = Date.now() - lastActivity;
      // Activity handlers only stamp a timestamp (O(1), no timer churn on
      // every mousemove) — so re-arm for the remainder instead of idling early.
      if (quietFor >= idleAfterMs) setIdle(true);
      else arm(idleAfterMs - quietFor);
    }

    const onActivity = () => {
      lastActivity = Date.now();
      if (idle) {
        setIdle(false);
        arm(idleAfterMs);
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        setIdle(true);
        clearTimeout(timer);
      } else {
        onActivity();
        arm(idleAfterMs);
      }
    };

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onActivity, { passive: true, capture: true });
    }
    document.addEventListener('visibilitychange', onVisibility);
    arm(idleAfterMs);

    return () => {
      clearTimeout(timer);
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, onActivity, { capture: true });
      }
      document.removeEventListener('visibilitychange', onVisibility);
      delete root.dataset['userIdle'];
      // Unmounting the gate must not leave rAF loops suspended forever.
      publishIdle(false);
    };
  }, [idleAfterMs]);

  return null;
}
