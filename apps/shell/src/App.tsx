import { Button, EmptyState, ThemeProvider, UI_INSTANCE_ID, type Theme } from '@sathwik/ui';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { DebugPanel } from './DebugPanel';
import type { Registry } from './registry';
import { RemoteRoute } from './RemoteRoute';
import { navigate, usePath } from './router';

const NAV = [
  { path: '/', label: 'Dashboard' },
  { path: '/billing', label: 'Billing' },
  { path: '/catalog', label: 'Catalog' },
];

const noop = () => {};

function NavLink({ path, label, current }: { path: string; label: string; current: boolean }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(path);
  };
  return (
    <a href={path} onClick={onClick} aria-current={current ? 'page' : undefined}>
      {label}
    </a>
  );
}

export function App({ registry }: { registry: Registry }) {
  const path = usePath();
  const [theme, setTheme] = useState<Theme>('light');
  const debug = new URLSearchParams(window.location.search).get('mf-debug') === '1';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  let page: ReactNode;
  if (path === '/') {
    page = (
      <div className="split">
        <RemoteRoute
          remote="billing"
          module="InvoiceWidget"
          entry={registry.billing}
          props={{ invoiceId: 'INV-1004' }}
          fallbackTitle="Billing is unavailable"
        />
        <RemoteRoute
          remote="catalog"
          module="ProductPicker"
          entry={registry.catalog}
          props={{ onSelect: noop }}
          fallbackTitle="Catalog is unavailable"
        />
      </div>
    );
  } else if (path === '/billing') {
    page = (
      <RemoteRoute
        remote="billing"
        module="BillingPage"
        entry={registry.billing}
        props={{ accountId: 'acc_demo' }}
        fallbackTitle="Billing is unavailable"
      />
    );
  } else if (path === '/catalog') {
    page = <RemoteRoute remote="catalog" module="CatalogPage" entry={registry.catalog} fallbackTitle="Catalog is unavailable" />;
  } else {
    page = <EmptyState title="Not found" description={`There is no page at ${path}.`} />;
  }

  return (
    <ThemeProvider theme={theme} className="app" data-testid="theme-root">
      <header className="header">
        <p className="brand">Design system shell</p>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.path} {...n} current={path === n.path} />
          ))}
        </nav>
        <Button
          variant="secondary"
          size="sm"
          aria-pressed={theme === 'dark'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          Dark mode
        </Button>
      </header>
      <main className="main">
        {page}
        {debug ? <DebugPanel registry={registry} /> : null}
      </main>
      <span hidden data-ui-instance={UI_INSTANCE_ID} data-owner="shell" />
    </ThemeProvider>
  );
}
