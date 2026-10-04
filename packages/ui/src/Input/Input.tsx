import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cx } from '../cx.js';
import s from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null, rest['aria-describedby']].filter(Boolean).join(' ') || undefined;
  return (
    <div className={s.field}>
      <label htmlFor={inputId} className={s.label}>
        {label}
      </label>
      <input
        {...rest}
        ref={ref}
        id={inputId}
        className={cx(s.input, error && s.invalid, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint ? (
        <p id={hintId} className={s.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={s.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
});
