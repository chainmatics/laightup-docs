/**
 * @chainmatics/laightup-glass — cn
 *
 * Composable class-name utility combining clsx (conditional class names)
 * and tailwind-merge (Tailwind conflict resolution).
 *
 * Usage:
 *   cn('glass glass-card-md', isActive && 'ring-2', className)
 *   cn('px-4', variant === 'lg' && 'px-6')
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
