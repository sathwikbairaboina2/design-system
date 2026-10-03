import '@sathwik/tokens/tokens.css';
import '@sathwik/ui/styles.css';
import { ThemeProvider } from '@sathwik/ui';
import { createRoot } from 'react-dom/client';
import CatalogPage from './CatalogPage';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme="light">
    <CatalogPage />
  </ThemeProvider>,
);
