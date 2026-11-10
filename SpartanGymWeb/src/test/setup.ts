import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cada prueba parte de un navegador limpio: sin sesión, sin sucursal elegida, sin DOM previo.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
