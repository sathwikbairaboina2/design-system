import { createElement, useId, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { cx } from '../cx';
import s from './Card.module.css';

export interface CardProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  as?: ElementType;
  title?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}

export function Card({ as = 'section', title, headingLevel = 2, className, children, ...rest }: CardProps) {
  const titleId = useId();
  return createElement(
    as,
    { ...rest, className: cx(s.card, className), 'aria-labelledby': title ? titleId : rest['aria-labelledby'] },
    title ? createElement(`h${headingLevel}`, { id: titleId, className: s.title }, title) : null,
    children,
  );
}
