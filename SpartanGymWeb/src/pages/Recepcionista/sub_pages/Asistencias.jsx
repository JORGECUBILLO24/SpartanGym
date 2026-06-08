import { useState } from 'react';
import { Search, Calendar, Filter, CheckCircle2, XCircle, Clock, User } from 'lucide-react';

const Asistencias = () => {
  // Datos de ejemplo
  const listaAsistencias = [
    { nombre: 'Carlos Ramírez', hora: '08:30 AM', estado: 'Presente', plan: 'Elite' },
    { nombre: 'Ana Torres', hora: '-', estado: 'Ausente', plan: 'Básica' },
    { nombre: 'Luis Mejía', hora: '09:15 AM', estado: 'Presente', plan: 'Premium' },
  ];

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Control de Asistencias</h2>
          <p className="text-gray-500 text-sm">Gestiona el flujo diario de los socios</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-600" size={16} />
            <input type="text" placeholder="Buscar socio..." className="bg-[#0d0d0d] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-red-600 outline-none w-full md:w-64" />
          </div>
          <button className="flex items-center gap-2 bg-[#0d0d0d] border border-white/5 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white transition-colors">
            <Filter size={16} /> Filtrar
          </button>
        </div>
      </div>

      {/* Tabla de Asistencias */}
      <section className="bg-[#0d0d0d] rounded-3xl border border-white/5 p-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead>
              <tr className="text-gray-500 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <th className="pb-4 font-bold">Socio</th>
                <th className="pb-4 font-bold">Plan</th>
                <th className="pb-4 font-bold">Hora de entrada</th>
                <th className="pb-4 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listaAsistencias.map((a, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-full text-gray-400">
                      <User size={16} />
                    </div>
                    <span className="text-white font-medium">{a.nombre}</span>
                  </td>
                  <td className="py-5 text-gray-400">{a.plan}</td>
                  <td className="py-5 flex items-center gap-2 text-gray-400">
                    <Clock size={14} className="text-gray-600" /> {a.hora}
                  </td>
                  <td className="py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                      a.estado === 'Presente' 
                      ? 'text-green-500 bg-green-500/10' 
                      : 'text-red-500 bg-red-500/10'
                    }`}>
                      {a.estado === 'Presente' ? <CheckCircle2 size={12} /> : <XCircle size={12} />} 
                      {a.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Asistencias;