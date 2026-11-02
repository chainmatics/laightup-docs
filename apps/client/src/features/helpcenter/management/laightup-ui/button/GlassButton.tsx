import React, { useRef, useEffect } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import gsap from 'gsap';
import { cn } from '../utils/cn';
import {
  isAmbientMotionIdle,
  subscribeAmbientMotion,
} from '../providers/GlassAmbientMotionGate';
import './GlassButton.css';

const buttonVariants = cva(
  'glass-btn-base relative inline-flex items-center justify-center select-none outline-none overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'glass-btn-primary',
        secondary: 'glass-btn-secondary',
        gradient: 'glass-btn-gradient',
        ai: 'glass-btn-ai',
        ghost: 'glass-btn-ghost',
        outline: 'glass-btn-outline',
        overlay: 'glass-btn-overlay',
        destructive: 'glass-btn-destructive',
      },
      size: {
        xs: 'h-8 px-3.5 text-[13px] gap-1.5 rounded-lg',
        sm: 'h-8 px-3.5 text-sm gap-1.5 rounded-lg',
        md: 'h-10 px-5 text-sm gap-2 rounded-[10px]',
        // The 36px toolbar band: matches GlassInput md, GlassFilterPill, GlassSelect md.
        toolbar: 'h-9 px-4 text-sm gap-2 rounded-[10px]',
        lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
      },
      /**
       * Visual weight of the fill. The default `soft` keeps the lib's
       * historical translucent chrome (~0.55 alpha on primary, lower on
       * others) so the button reads as glass-tinted, not as a flat tile.
       * `bold` pushes alpha up to ~0.95 + adds an outer accent glow —
       * for the ONE primary CTA per section that should genuinely shout
       * (per /laightup-ci dual-accent: "one cyan thing per section").
       * Apply BOLD sparingly; the soft default is the right answer for
       * almost every callsite.
       */
      prominence: {
        soft: '',
        bold: 'glass-btn--bold',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      prominence: 'soft',
    },
  },
);


export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  className?: string;
}

export const GlassButton = React.forwardRef<
  HTMLButtonElement,
  GlassButtonProps
>(
  (
    {
      asChild = false,
      variant = 'primary',
      size = 'md',
      prominence = 'soft',
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const internalRef = useRef<HTMLButtonElement>(null);
    const combinedRef = (ref ?? internalRef) as React.RefObject<HTMLButtonElement>;
    const ctxRef = useRef<gsap.Context | null>(null);

    useEffect(() => {
      if (variant !== 'ai' || disabled) return;
      const el = combinedRef.current;
      if (!el) return;

      ctxRef.current = gsap.context(() => {
        const mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', () => {
          const tween = gsap.to(el, {
            backgroundPosition: '100% 50%',
            duration: 5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
          // An endless sweep is ambient decoration: pause it while nobody is
          // there. GSAP writes an inline style every frame, which repaints the
          // button — and inside a backdrop-filter surface that repaints the
          // whole surface.
          const sync = () => {
            if (isAmbientMotionIdle()) tween.pause();
            else tween.resume();
          };
          const unsubscribe = subscribeAmbientMotion(sync);
          sync();
          // Returned cleanup runs on every un-match AND on revert — a re-match
          // would otherwise stack a fresh subscriber per reduced-motion toggle.
          return unsubscribe;
        });
      }, el);

      return () => {
        ctxRef.current?.revert();
      };
    }, [variant, combinedRef, disabled]);

    return (
      <Comp
        ref={combinedRef as React.Ref<HTMLButtonElement>}
        className={cn(buttonVariants({ variant, size, prominence }), className)}
        disabled={disabled}
        {...rest}
      >
        {children}
      </Comp>
    );
  },
);

GlassButton.displayName = 'GlassButton';

export { buttonVariants };
