import { useCallback, useRef } from 'react';

/**
 * Callback ref for a body-portaled popover surface that must stay scrollable
 * when opened from inside a modal dialog.
 *
 * A modal dialog's scroll lock (react-remove-scroll, used by Radix Dialog)
 * installs a non-passive `wheel`/`touchmove` listener on `document` that cancels
 * scrolling for any event target outside the dialog's DOM subtree. Popovers
 * portal to `<body>`, so they sit outside that subtree and their own scroll
 * containers become unscrollable — geometrically overflowing, but every wheel
 * event is `preventDefault`'d.
 *
 * Stopping those events at the portaled node keeps them from reaching `document`
 * (the listener is on `document` in the bubble phase), so the popover's content
 * scrolls natively. Harmless outside a dialog: stopping a wheel event that would
 * otherwise bubble to `document` changes nothing there.
 *
 * Usage: `<GlassPopoverContent ref={useScrollLockBypass()} …>`
 */
export function useScrollLockBypass<T extends HTMLElement = HTMLDivElement>() {
  const cleanup = useRef<(() => void) | undefined>(undefined);
  return useCallback((node: T | null) => {
    cleanup.current?.();
    cleanup.current = undefined;
    if (!node) return;
    const stop = (e: Event) => e.stopPropagation();
    node.addEventListener('wheel', stop, { passive: false });
    node.addEventListener('touchmove', stop, { passive: false });
    cleanup.current = () => {
      node.removeEventListener('wheel', stop);
      node.removeEventListener('touchmove', stop);
    };
  }, []);
}
