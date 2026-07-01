import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  User,
} from 'lucide-react';
import { membresiasApi, operacionApi, pagosApi, sociosApi } from '../../../services/api';
import { formatearMoneda, useConfiguracionApp } from '../../../utils/configuracionApp';

const pagoVacio = {
  idSocio: '',
  idTipoMembresia: '',
  metodoPago: 'Efectivo',
};

const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];

const Pagos = () => {
  const [historialPagos, setHistorialPagos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [tiposMembresia, setTiposMembresia] = useState([]);
  const [datosPago, setDatosPago] = useState(pagoVacio);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const configuracion = useConfiguracionApp();
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);

  const cargarDatos = async () => {
    const [pagos, sociosData, tipos] = await Promise.all([
      operacionApi.pagos(),
      sociosApi.listar(),
      membresiasApi.tipos(),
    ]);
    setHistorialPagos(pagos);
    setSocios(sociosData);
    setTiposMembresia(tipos);
  };

  useEffect(() => {
    Promise.resolve()
      .then(cargarDatos)
      .catch(() => {
        setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los pagos desde la API.' });
      });
  }, []);

  const registrarPago = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      await pagosApi.renovar({
        idSocio: datosPago.idSocio,
        idTipoMembresia: Number(datosPago.idTipoMembresia),
        metodoPago: datosPago.metodoPago,
      });
      setDatosPago(pagoVacio);
      setMensaje({ tipo: 'exito', texto: 'Pago y membresia guardados en la base de datos.' });
      await cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo registrar el pago.' });
    } finally {
      setGuardando(false);
    }
  };

  const pagosFiltrados = historialPagos.filter((pago) =>
    String(pago.socio || '').toLowerCase().includes(terminoBusqueda.toLowerCase().trim())
  );

  const totalRecaudado = useMemo(
    () => historialPagos.reduce((suma, pago) => suma + Number(pago.monto || 0), 0),
    [historialPagos]
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/5 bg-[#111111] p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Flujo de Caja</h2>
          <p className="text-sm text-gray-400">Registra pagos reales y renovaciones de membresia.</p>
        </div>
        <button
          type="button"
          onClick={cargarDatos}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#050505] px-4 py-2 text-sm font-bold text-gray-300 hover:bg-white/5"
        >
          <RefreshCw size={15} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Resumen icon={DollarSign} title="Total recaudado" value={formatearMonto(totalRecaudado)} detail={`${historialPagos.length} pagos`} />
        <Resumen icon={CreditCard} title="Planes activos" value={tiposMembresia.length} detail="Catalogo BD" />
        <Resumen icon={User} title="Socios" value={socios.length} detail="Registrados" />
      </div>

      {mensaje && (
        <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
          mensaje.tipo === 'exito'
            ? 'border-green-500/20 bg-green-500/10 text-green-400'
            : 'border-red-500/20 bg-red-500/10 text-red-400'
        }`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {mensaje.texto}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-white/5 bg-[#111111] p-5 shadow-lg">
          <div className="mb-6 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3 text-white">
              <DollarSign className="text-red-500" size={20} />
              <h3 className="font-bold">Historial de Transacciones</h3>
            </div>

            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por socio..."
                value={terminoBusqueda}
                onChange={(evento) => setTerminoBusqueda(evento.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#050505] py-2 pl-9 pr-4 text-sm text-white outline-none transition-colors focus:border-red-500/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Socio</th>
                  <th className="pb-3 pr-4 font-medium">Monto</th>
                  <th className="pb-3 pr-4 font-medium">Fecha y hora</th>
                  <th className="pb-3 font-medium">Metodo</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago) => (
                  <tr key={pago.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5">
                    <td className="flex items-center gap-3 py-3.5 pr-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a0808] text-red-500">
                        <User size={14} />
                      </span>
                      <span className="font-medium text-white">{pago.socio}</span>
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-white">{formatearMonto(pago.monto)}</td>
                    <td className="py-3.5 pr-4 text-gray-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-600" />
                        {pago.fechaTransaccion ? new Date(pago.fechaTransaccion).toLocaleString('es-NI') : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-400">{pago.metodoPago}</td>
                  </tr>
                ))}
                {!pagosFiltrados.length && (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-sm font-medium text-gray-500">
                      No hay pagos para esta busqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <form onSubmit={registrarPago} className="h-fit rounded-2xl border border-white/5 bg-[#111111] p-5 shadow-lg">
          <div className="mb-5 flex items-center gap-3">
            <PlusCircle className="text-red-500" size={22} />
            <h3 className="font-black text-white">Registrar pago</h3>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-500">Socio</span>
              <select
                required
                value={datosPago.idSocio}
                onChange={(evento) => setDatosPago({ ...datosPago, idSocio: evento.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-red-600"
              >
                <option value="">Selecciona socio</option>
                {socios.map((socio) => (
                  <option key={socio.id} value={socio.id}>{socio.nombres} {socio.apellidos}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-500">Membresia</span>
              <select
                required
                value={datosPago.idTipoMembresia}
                onChange={(evento) => setDatosPago({ ...datosPago, idTipoMembresia: evento.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-red-600"
              >
                <option value="">Selecciona plan</option>
                {tiposMembresia.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nombre} - {formatearMonto(tipo.precio)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-gray-500">Metodo</span>
              <select
                value={datosPago.metodoPago}
                onChange={(evento) => setDatosPago({ ...datosPago, metodoPago: evento.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none focus:border-red-600"
              >
                {metodosPago.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-black uppercase tracking-wide text-white transition-all hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            <Save size={18} />
            {guardando ? 'Guardando...' : 'Guardar pago'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Resumen = ({ icon: Icon, title, value, detail }) => (
  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#111111] p-5">
    <div>
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</span>
      <h3 className="mt-1 text-2xl font-black text-white">{value}</h3>
      <p className="mt-2 text-xs text-gray-500">{detail}</p>
    </div>
    <div className="rounded-xl border border-red-500/10 bg-red-500/10 p-4 text-red-500">
      <Icon size={24} />
    </div>
  </div>
);

export default Pagos;
