import { useEffect, useState } from 'react';
import { Search, Calendar, Filter, CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { operacionApi } from '../../../services/api';

const opcionesFiltro = ['Todos', 'Presente', 'Ausente'];

const Asistencias = () => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [listaAsistencias, setListaAsistencias] = useState([]);
  const [errorApi, setErrorApi] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    operacionApi.asistenciasRecientes()
      .then(setListaAsistencias)
      .catch(() => setErrorApi('No se pudieron cargar las asistencias desde la API.'))
      .finally(() => setCargando(false));
  }, []);

  const fechaActual = new Intl.DateTimeFormat('es-NI', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(new Date());

  const asistenciasFiltradas = listaAsistencias.filter((asistencia) => {
    const nombreSocio = asistencia.socio || '';
    const estado = asistencia.estado || 'Presente';
    const coincideBusqueda = nombreSocio.toLowerCase().includes(busqueda.toLowerCase().trim());
    const coincideEstado = filtroEstado === 'Todos' || estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const alternarFiltro = () => {
    const siguienteIndice = (opcionesFiltro.indexOf(filtroEstado) + 1) % opcionesFiltro.length;
    setFiltroEstado(opcionesFiltro[siguienteIndice]);
  };

  return (
    <div className="workspace-page w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Control de Asistencias</h2>
          <p className="text-gray-500 text-sm">Gestiona el flujo diario de los socios</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 capitalize">
            <Calendar size={14} />
            {fechaActual}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 sm:w-64">
            <Search className="absolute left-3 top-3 text-gray-600" size={16} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar socio..."
              className="w-full rounded-xl border border-white/5 bg-[#0d0d0d] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-red-600"
            />
          </div>
          <button
            type="button"
            onClick={alternarFiltro}
            className="workspace-card-action flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#0d0d0d] px-4 py-2.5 text-sm text-gray-300 hover:text-white"
          >
            <Filter size={16} /> {filtroEstado}
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-4 sm:p-5">
        {errorApi && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
            <XCircle size={15} />
            {errorApi}
          </div>
        )}

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
              {!cargando && asistenciasFiltradas.map((asistencia) => (
                <tr key={asistencia.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3">
                    <span className="workspace-table-cell-content">
                    <span className="rounded-full bg-white/5 p-2 text-gray-400">
                      <User size={16} />
                    </span>
                    <span className="text-white font-medium">{asistencia.socio}</span>
                    </span>
                  </td>
                  <td className="py-5 text-gray-400">{asistencia.tipoMembresia || 'Registrada'}</td>
                  <td className="py-3 text-gray-400">
                    <span className="workspace-table-cell-content">
                    <Clock size={14} className="text-gray-600" /> {asistencia.fechaHora ? new Date(asistencia.fechaHora).toLocaleString('es-NI') : 'N/A'}
                    </span>
                  </td>
                  <td className="py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                      (asistencia.estado || 'Presente') === 'Presente'
                        ? 'text-green-500 bg-green-500/10'
                        : 'text-red-500 bg-red-500/10'
                    }`}>
                      {(asistencia.estado || 'Presente') === 'Presente' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {asistencia.estado || 'Presente'}
                    </span>
                  </td>
                </tr>
              ))}

              {cargando && (
                <tr><td colSpan="4" className="py-8 text-center text-sm text-gray-400">Cargando asistencias…</td></tr>
              )}
              {!cargando && asistenciasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-gray-500">
                    {errorApi ? 'No se pudieron mostrar los registros.' : 'No hay asistencias con esos filtros.'}
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
