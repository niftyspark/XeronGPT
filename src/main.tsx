import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary.tsx';

// Debugging: trap assignment to window.fetch
try {
  const originalFetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    get: () => originalFetch,
    set: (v) => {
      console.error('Attempted to set fetch!', v);
      throw new Error('Attempted to set fetch!');
    },
    configurable: false,
  });
} catch (e) {
  console.error('Could not trap window.fetch', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
