import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('associates the label with the input', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInstanceOf(HTMLInputElement);
  });

  it('links the hint through aria-describedby', () => {
    render(<Input label="Email" hint="We never share it" />);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('We never share it');
  });

  it('merges a caller aria-describedby with the hint and error ids', () => {
    render(
      <>
        <p id="extra">Extra help</p>
        <Input label="Email" hint="hint" aria-describedby="extra" />
      </>,
    );
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('hint Extra help');
  });

  it('wires the error message and aria-invalid', () => {
    render(<Input label="Email" hint="hint" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('hint Enter a valid email');
  });

  it('is not invalid without an error', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
  });

  it('forwards ref and merges className', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Email" ref={ref} className="mine" />);
    expect(ref.current).toBe(screen.getByLabelText('Email'));
    expect(ref.current).toHaveClass('input', 'mine');
  });
});
