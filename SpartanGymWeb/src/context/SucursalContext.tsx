import { createContext, useContext, useState, useEffect, type Dispatch, type ReactNode, type SetStateAction } from 'react';

interface SucursalContextValue {
  /** Id de la sucursal elegida en el selector global, o '' si se ven todas. */
  sucursalActivaId: string;
  setSucursalActivaId: Dispatch<SetStateAction<string>>;
}

const SucursalContext = createContext<SucursalContextValue | undefined>(undefined);

export const useSucursalGlobal = (): SucursalContextValue => {
  const context = useContext(SucursalContext);
  if (!context) {
    throw new Error('useSucursalGlobal debe usarse dentro de un SucursalProvider');
  }
  return context;
};

export const SucursalProvider = ({ children }: { children: ReactNode }) => {
  const [sucursalActivaId, setSucursalActivaId] = useState<string>(() => {
    return localStorage.getItem('global_sucursal_id') || '';
  });

  useEffect(() => {
    if (sucursalActivaId) {
      localStorage.setItem('global_sucursal_id', sucursalActivaId);
    } else {
      localStorage.removeItem('global_sucursal_id');
    }
  }, [sucursalActivaId]);

  return (
    <SucursalContext.Provider value={{ sucursalActivaId, setSucursalActivaId }}>
      {children}
    </SucursalContext.Provider>
  );
};
