import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode, Ref } from 'react';
import s from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  'aria-label': string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function Tabs({ items, defaultValue, 'aria-label': ariaLabel, className, ref }: TabsProps) {
  return (
    <RadixTabs.Root ref={ref} className={className} defaultValue={defaultValue ?? items[0]?.value}>
      <RadixTabs.List className={s.list} aria-label={ariaLabel}>
        {items.map((item) => (
          <RadixTabs.Trigger key={item.value} value={item.value} className={s.tab}>
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className={s.panel}>
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
