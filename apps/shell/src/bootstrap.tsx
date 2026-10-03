import '@sathwik/tokens/tokens.css';
import '@sathwik/ui/styles.css';
import './global.css';
import { registerRemotes } from '@module-federation/enhanced/runtime';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { parseRegistry } from './registry';

async function main() {
  const response = await fetch('/remotes.json');
  if (!response.ok) throw new Error(`/remotes.json responded ${response.status}`);
  const registry = parseRegistry(await response.json());
  registerRemotes(Object.entries(registry).map(([name, r]) => ({ name, entry: r.entry })));
  createRoot(document.getElementById('root')!).render(<App registry={registry} />);
}

main().catch((e) => {
  document.body.textContent = `Shell failed to start: ${e instanceof Error ? e.message : String(e)}`;
});
