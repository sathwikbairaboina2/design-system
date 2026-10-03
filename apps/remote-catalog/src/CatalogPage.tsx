import { Badge, Card, EmptyState, Input, Stack, UI_INSTANCE_ID } from '@sathwik/ui';
import { useState } from 'react';
import s from './CatalogPage.module.css';
import { PRODUCTS, type Product } from './products';

const TONE: Record<Product['stock'], 'success' | 'accent' | 'danger'> = { 'in-stock': 'success', low: 'accent', out: 'danger' };
const LABEL: Record<Product['stock'], string> = { 'in-stock': 'In stock', low: 'Low stock', out: 'Sold out' };

export default function CatalogPage() {
  const [query, setQuery] = useState('');
  const shown = PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div data-testid="catalog-page">
      <Stack gap={4}>
        <h1>Catalog</h1>
        <Input label="Filter products" value={query} onChange={(e) => setQuery(e.target.value)} />
        {shown.length === 0 ? (
          <EmptyState title="No products match" description="Try a different search." />
        ) : (
          <div className={s.grid}>
            {shown.map((p) => (
              <Card key={p.id} title={p.name} headingLevel={3} data-testid="product-card">
                <Stack gap={2}>
                  <p className={s.price}>{p.price}</p>
                  <div>
                    <Badge tone={TONE[p.stock]}>{LABEL[p.stock]}</Badge>
                  </div>
                </Stack>
              </Card>
            ))}
          </div>
        )}
      </Stack>
      <span hidden data-ui-instance={UI_INSTANCE_ID} data-owner="catalog" />
    </div>
  );
}
