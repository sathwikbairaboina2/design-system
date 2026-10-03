import { Badge, Button, Card, Dialog, Stack, Tabs, UI_INSTANCE_ID } from '@sathwik/ui';
import s from './BillingPage.module.css';

const INVOICES = [
  { id: 'INV-1004', date: '2026-09-01', amount: '$49.00', status: 'Due' },
  { id: 'INV-1003', date: '2026-08-01', amount: '$49.00', status: 'Paid' },
  { id: 'INV-1002', date: '2026-07-01', amount: '$49.00', status: 'Paid' },
  { id: 'INV-1001', date: '2026-06-01', amount: '$19.00', status: 'Paid' },
] as const;

export default function BillingPage({ accountId }: { accountId: string }) {
  const invoices = (
    <table className={s.table}>
      <thead>
        <tr>
          <th scope="col">Invoice</th>
          <th scope="col">Date</th>
          <th scope="col">Amount</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {INVOICES.map((inv) => (
          <tr key={inv.id}>
            <td>{inv.id}</td>
            <td>{inv.date}</td>
            <td className={s.amount}>{inv.amount}</td>
            <td>
              <Badge tone={inv.status === 'Due' ? 'danger' : 'success'}>{inv.status}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <div data-testid="billing-page">
      <Card title="Billing">
        <Stack gap={4}>
          <p>Account {accountId}</p>
          <Tabs
            aria-label="Billing sections"
            items={[
              { value: 'invoices', label: 'Invoices', content: invoices },
              { value: 'methods', label: 'Payment methods', content: <p>Visa ending 4242</p> },
            ]}
          />
          <div>
            <Dialog
              trigger={<Button>Pay now</Button>}
              title="Confirm payment"
              description="INV-1004 for $49.00 will be charged to the Visa ending 4242."
            >
              <Button variant="danger">Confirm payment</Button>
            </Dialog>
          </div>
        </Stack>
      </Card>
      <span hidden data-ui-instance={UI_INSTANCE_ID} data-owner="billing" />
    </div>
  );
}
