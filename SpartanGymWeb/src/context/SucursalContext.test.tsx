import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SucursalProvider, useSucursalGlobal } from './SucursalContext';

const envoltorio = ({ children }: { children: ReactNode }) => <SucursalProvider>{children}</SucursalProvider>;

describe('SucursalContext', () => {
  it('arranca sin sucursal elegida', () => {
    const { result } = renderHook(() => useSucursalGlobal(), { wrapper: envoltorio });

    expect(result.current.sucursalActivaId).toBe('');
  });

  it('arranca con la sucursal que quedó guardada', () => {
    localStorage.setItem('global_sucursal_id', 'suc-1');

    const { result } = renderHook(() => useSucursalGlobal(), { wrapper: envoltorio });

    expect(result.current.sucursalActivaId).toBe('suc-1');
  });

  it('elegir una sucursal la guarda y dejarla vacía la borra (api.ts la manda en X-Sucursal-Id)', () => {
    const { result } = renderHook(() => useSucursalGlobal(), { wrapper: envoltorio });

    act(() => result.current.setSucursalActivaId('suc-2'));
    expect(localStorage.getItem('global_sucursal_id')).toBe('suc-2');
    expect(result.current.sucursalActivaId).toBe('suc-2');

    act(() => result.current.setSucursalActivaId(''));
    expect(localStorage.getItem('global_sucursal_id')).toBeNull();
  });

  it('usar el hook fuera del proveedor falla con un mensaje claro', () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useSucursalGlobal())).toThrow('SucursalProvider');

    consola.mockRestore();
  });
});
