import type { HTMLAttributes } from 'react';
import { cx } from '../cx.js';
import s from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent' | 'danger' | 'success';
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return <span {...rest} className={cx(s.badge, s[tone], className)} />;
}
