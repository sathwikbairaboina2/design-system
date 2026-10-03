import { Button, Card, Inline, Stack, UI_INSTANCE_ID } from '@sathwik/ui';
import { useState } from 'react';
import { PRODUCTS } from './products';

export default function ProductPicker({ onSelect }: { onSelect(id: string): void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const name = PRODUCTS.find((p) => p.id === selected)?.name;
  return (
    <div data-testid="product-picker">
      <Card title="Pick a product" headingLevel={3}>
        <Stack gap={2}>
          <Inline gap={2}>
            {PRODUCTS.slice(0, 3).map((p) => (
              <Button
                key={p.id}
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelected(p.id);
                  onSelect(p.id);
                }}
              >
                {p.name}
              </Button>
            ))}
          </Inline>
          {name ? <p>Selected: {name}</p> : null}
        </Stack>
      </Card>
      <span hidden data-ui-instance={UI_INSTANCE_ID} data-owner="catalog" />
    </div>
  );
}
