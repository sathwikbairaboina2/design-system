import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx.js';
import s from './EmptyState.module.css';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, action, className, ...rest }: EmptyStateProps) {
  return (
    <div {...rest} role="status" className={cx(s.root, className)}>
      <p className={s.title}>{title}</p>
      <p className={s.description}>{description}</p>
      {action ? <div className={s.action}>{action}</div> : null}
    </div>
  );
}
