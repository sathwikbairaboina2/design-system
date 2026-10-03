import { createElement, type ComponentPropsWithoutRef, type ElementType } from 'react';
import { cx } from '../cx';
import s from './Stack.module.css';

export type Gap = 0 | 1 | 2 | 3 | 4 | 6 | 8;

export interface StackProps extends ComponentPropsWithoutRef<'div'> {
  gap?: Gap;
  as?: ElementType;
}

function make(base: string) {
  return function Layout({ gap = 4, as = 'div', className, ...rest }: StackProps) {
    return createElement(as, { ...rest, className: cx(base, s[`gap-${gap}`], className) });
  };
}

/** Vertical flex column. `gap` maps to a space token class. */
export const Stack = make(s.stack);
/** Horizontal flex row that wraps. */
export const Inline = make(s.inline);
