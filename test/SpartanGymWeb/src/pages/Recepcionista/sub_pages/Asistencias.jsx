import { useEffect, useState } from 'react';
import { Search, Calendar, Filter, CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { operacionApi } from '../../../services/api';

const opcionesFiltro = ['Todos', 'Presente', 'Ausente'];

const Asistencias = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  const fechaActual = new Intl.DateTimeFormat('es-NI', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(new Date());

  useEffect(() => {
    operacionApi.asistenciasRecientes()
      .then(setAsistencias)
      .catch(() => setError('No se pudieron cargar las asistencias desde la base de datos.'));
  }, []);

  const asistenciasFiltradas = asistencias.map((asistencia) => ({
    ...asistencia,
    nombre: asistencia.socio,
    hora: new Date(asistencia.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    estado: 'Presente',
    plan: 'Registrado',
  })).filter((asistencia) => {
    const coincideBusqueda = asistencia.nombre.toLowerCase().includes(busqueda.toLowerCase().trim());
    const coincideEstado = filtroEstado === 'Todos' || asistencia.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const alternarFiltro = () => {
    const siguienteIndice = (opcionesFiltro.indexOf(filtroEstado) + 1) % opcionesFiltro.length;
    setFiltroEstado(opcionesFiltro[siguienteIndice]);
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Control de Asistencias</h2>
          <p className="text-gray-500 text-sm">Gestiona el flujo diario de los socios</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 capitalize">
            <Calendar size={14} />
            {fechaActual}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-600" size={16} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar socio..."
              className="bg-[#0d0d0d] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-red-600 outline-none w-full md:w-64"
            />
          </div>
          <button
            type="button"
            onClick={alternarFiltro}
            className="flex items-center gap-2 bg-[#0d0d0d] border border-white/5 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Filter size={16} /> {filtroEstado}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>}

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
              {asistenciasFiltradas.map((asistencia) => (
                <tr key={asistencia.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-full text-gray-400">
                      <User size={16} />
                    </div>
                    <span className="text-white font-medium">{asistencia.nombre}</span>
                  </td>
                  <td className="py-5 text-gray-400">{asistencia.plan}</td>
                  <td className="py-5 flex items-center gap-2 text-gray-400">
                    <Clock size={14} className="text-gray-600" /> {asistencia.hora}
                  </td>
                  <td className="py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                      asistencia.estado === 'Presente'
                        ? 'text-green-500 bg-green-500/10'
                        : 'text-red-500 bg-red-500/10'
                    }`}>
                      {asistencia.estado === 'Presente' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {asistencia.estado}
                    </span>
                  </td>
                </tr>
              ))}

              {asistenciasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-gray-500">
                    No hay asistencias con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Asistencias;
