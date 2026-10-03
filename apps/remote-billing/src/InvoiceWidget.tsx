import { Badge, Button, Card, Stack, UI_INSTANCE_ID } from '@sathwik/ui';
import { useState } from 'react';

export default function InvoiceWidget({ invoiceId = 'INV-1004', compact = false }: { invoiceId?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="invoice-widget">
      <Card title={`Invoice ${invoiceId}`} headingLevel={3}>
        <Stack gap={2}>
          <Badge tone="danger">Due</Badge>
          {open && !compact ? <p>$49.00 due 2026-10-01, Visa ending 4242.</p> : null}
          <div>
            <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
              {open ? 'Hide details' : 'Show details'}
            </Button>
          </div>
        </Stack>
      </Card>
      <span hidden data-ui-instance={UI_INSTANCE_ID} data-owner="billing" />
    </div>
  );
}
