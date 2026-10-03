import '@sathwik/tokens/tokens.css';
import '@sathwik/ui/styles.css';
import { ThemeProvider } from '@sathwik/ui';
import { createRoot } from 'react-dom/client';
import BillingPage from './BillingPage';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme="light">
    <BillingPage accountId="acc_demo" />
  </ThemeProvider>,
);
