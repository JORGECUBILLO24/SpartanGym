import React, { createContext, useContext, useState, useEffect } from 'react';

const SucursalContext = createContext();

export const useSucursalGlobal = () => {
  const context = useContext(SucursalContext);
  if (!context) {
    throw new Error('useSucursalGlobal debe usarse dentro de un SucursalProvider');
  }
  return context;
};

export const SucursalProvider = ({ children }) => {
  const [sucursalActivaId, setSucursalActivaId] = useState(() => {
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
