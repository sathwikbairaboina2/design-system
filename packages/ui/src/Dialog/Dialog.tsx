import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '../Button/Button';
import { useTheme } from '../ThemeProvider/ThemeProvider';
import s from './Dialog.module.css';

export interface DialogProps {
  trigger: ReactElement;
  title: string;
  description?: string;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ trigger, title, description, children, open, defaultOpen, onOpenChange }: DialogProps) {
  // Portal into the ThemeProvider root so dark-theme variables still apply inside the dialog.
  const { container } = useTheme();
  return (
    <RadixDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal container={container ?? undefined}>
        <RadixDialog.Overlay className={s.overlay} />
        <RadixDialog.Content className={s.content} {...(description ? {} : { "aria-describedby": undefined })}>
          <RadixDialog.Title className={s.title}>{title}</RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className={s.description}>{description}</RadixDialog.Description>
          ) : null}
          {children}
          <div className={s.footer}>
            <RadixDialog.Close asChild>
              <Button variant="secondary">Close</Button>
            </RadixDialog.Close>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
