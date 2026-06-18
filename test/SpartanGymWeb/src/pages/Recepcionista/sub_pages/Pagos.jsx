import { useState } from 'react';
import {
  DollarSign, FileText, Search, PlusCircle,
  CheckCircle2, Clock, CreditCard, ArrowUpRight,
  TrendingUp, User, Calendar, Download, Filter, X, Save
} from 'lucide-react';

const pagosIniciales = [
  { id: 1, socio: 'Carlos Andrés Ramírez', membresia: 'Spartan Anual', monto: '$250.00', fecha: 'Hoy, 09:09 AM', metodo: 'Tarjeta de Crédito', estado: 'Completado' },
  { id: 2, socio: 'Juan Pérez', membresia: 'Premium (3 Meses)', monto: '$80.00', fecha: '12/05/2026', metodo: 'Transferencia', estado: 'Completado' },
  { id: 3, socio: 'María Gómez', membresia: 'Básica (1 Mes)', monto: '$30.00', fecha: '12/05/2026', metodo: 'Efectivo', estado: 'Completado' },
  { id: 4, socio: 'Ana Torres', membresia: 'Elite (6 Meses)', monto: '$150.00', fecha: '11/05/2026', metodo: 'Tarjeta de Débito', estado: 'Completado' },
  { id: 5, socio: 'Luis Hernández', membresia: 'Básica (1 Mes)', monto: '$30.00', fecha: '10/05/2026', metodo: 'Efectivo', estado: 'Pendiente' },
];

const pagoVacio = {
  socio: '',
  membresia: '',
  monto: '',
  metodo: 'Efectivo',
  estado: 'Completado',
};

const metodosPago = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia'];
const estadosPago = ['Completado', 'Pendiente'];

const Pagos = () => {
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [reporteDescargado, setReporteDescargado] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [historialPagos, setHistorialPagos] = useState(pagosIniciales);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [datosPago, setDatosPago] = useState(pagoVacio);
  const [pagoGuardado, setPagoGuardado] = useState(false);

  const generarReporte = () => {
    setGenerandoReporte(true);
    setTimeout(() => {
      setGenerandoReporte(false);
      setReporteDescargado(true);
      setTimeout(() => setReporteDescargado(false), 3000);
    }, 2000);
  };

  const actualizarCampoPago = (evento) => {
    setDatosPago({ ...datosPago, [evento.target.name]: evento.target.value });
  };

  const registrarPago = (evento) => {
    evento.preventDefault();

    const nuevoPago = {
      id: Date.now(),
      socio: datosPago.socio.trim(),
      membresia: datosPago.membresia.trim(),
      monto: `$${Number(datosPago.monto).toFixed(2)}`,
      fecha: 'Ahora mismo',
      metodo: datosPago.metodo,
      estado: datosPago.estado,
    };

    setHistorialPagos([nuevoPago, ...historialPagos]);
    setPagoGuardado(true);

    setTimeout(() => {
      setDatosPago(pagoVacio);
      setPagoGuardado(false);
      setModalPagoAbierto(false);
    }, 900);
  };

  const pagosFiltrados = historialPagos.filter((pago) =>
    pago.socio.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/5 bg-[#111111] p-4 transition-all duration-300 hover:border-white/10 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Flujo de Caja</h2>
          <p className="text-sm text-gray-400">Monitorea los ingresos, transacciones y estados de cuenta.</p>
        </div>

        <div className="relative self-end sm:self-auto">
          <button
            onClick={generarReporte}
            disabled={generandoReporte}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold shadow-lg transition-all duration-300
              ${reporteDescargado
                ? 'border-green-500 bg-green-600 text-white shadow-green-900/20'
                : 'border-white/10 bg-[#111111] text-white hover:-translate-y-0.5 hover:border-red-600/50 hover:text-red-500'
              } ${generandoReporte ? 'cursor-wait opacity-50' : ''}`}
          >
            {generandoReporte ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </>
            ) : reporteDescargado ? (
              <>
                <CheckCircle2 size={16} /> ¡Reporte Descargado!
              </>
            ) : (
              <>
                <FileText size={16} className="text-red-500" />
                Generar Reporte
                <Download size={14} className="ml-1 opacity-60" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#111111] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Recaudado (Mes)</span>
            <h3 className="mt-1 text-3xl font-black text-white">$1,840.00</h3>
            <span className="mt-2 flex items-center gap-1 text-xs font-medium text-green-500">
              <TrendingUp size={12} /> +12.5% vs mes anterior
            </span>
          </div>
          <div className="rounded-xl border border-green-500/10 bg-green-500/10 p-4 text-green-500">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#111111] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Método Más Utilizado</span>
            <h3 className="mt-1 text-2xl font-bold text-white">Tarjetas</h3>
            <p className="mt-2 text-xs text-gray-500">60% de las transacciones</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#2a0808] p-4 text-red-500">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#111111] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pagos por Registrar</span>
            <h3 className="mt-1 text-3xl font-black text-orange-400">
              {historialPagos.filter((pago) => pago.estado === 'Pendiente').length}
            </h3>
            <span className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} /> Requiere validación de caja
            </span>
          </div>
          <div className="rounded-xl border border-orange-400/10 bg-orange-400/10 p-4 text-orange-400">
            <Clock size={24} />
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-white/5 bg-[#111111] p-5 shadow-lg transition-all duration-300 hover:border-white/10 lg:p-6">
        <div className="mb-6 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3 text-white">
            <div className="text-red-500"><ArrowUpRight size={20} /></div>
            <h3 className="font-bold">Historial de Transacciones</h3>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por socio..."
                value={terminoBusqueda}
                onChange={(evento) => setTerminoBusqueda(evento.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#050505] py-2 pl-9 pr-4 text-sm text-white outline-none transition-colors focus:border-red-500/50"
              />
            </div>

            <button className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#050505] px-4 py-2 text-sm font-medium text-gray-400 transition-all duration-300 hover:bg-white/5 hover:text-white">
              <Filter size={14} /> Filtros
            </button>

            <button
              onClick={() => setModalPagoAbierto(true)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#e50914] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700"
            >
              <PlusCircle size={16} /> Registrar Pago
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500">
                <th className="pb-3 pr-4 font-medium">Socio</th>
                <th className="pb-3 pr-4 font-medium">Concepto / Membresía</th>
                <th className="pb-3 pr-4 font-medium">Monto</th>
                <th className="pb-3 pr-4 font-medium">Fecha y Hora</th>
                <th className="pb-3 pr-4 font-medium">Método</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.map((pago) => (
                <tr key={pago.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5">
                  <td className="flex items-center gap-3 py-3.5 pr-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a0808] text-red-500">
                      <User size={14} />
                    </div>
                    <span className="font-medium text-white">{pago.socio}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-300">{pago.membresia}</td>
                  <td className="py-3.5 pr-4 font-bold text-white">{pago.monto}</td>
                  <td className="py-3.5 pr-4 text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-600" />
                      {pago.fecha}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-400">
                    <span className="rounded-lg border border-white/5 bg-[#050505] px-2.5 py-1 text-xs">
                      {pago.metodo}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {pago.estado === 'Completado' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-500">
                        <CheckCircle2 size={12} /> {pago.estado}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/20 bg-orange-400/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
                        <Clock size={12} /> {pago.estado}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalPagoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="modal-pago w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0e] shadow-2xl shadow-black/70">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Nueva transacción</p>
                <h3 className="mt-1 text-lg font-black text-white">Registrar Pago</h3>
              </div>
              <button
                onClick={() => setModalPagoAbierto(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Cerrar registro de pago"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={registrarPago} className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Socio</label>
                  <input
                    type="text"
                    name="socio"
                    required
                    value={datosPago.socio}
                    onChange={actualizarCampoPago}
                    placeholder="Nombre del socio"
                    className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Monto</label>
                  <input
                    type="number"
                    name="monto"
                    required
                    min="0"
                    step="0.01"
                    value={datosPago.monto}
                    onChange={actualizarCampoPago}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Membresía / Concepto</label>
                <input
                  type="text"
                  name="membresia"
                  required
                  value={datosPago.membresia}
                  onChange={actualizarCampoPago}
                  placeholder="Ej. Premium (3 Meses)"
                  className="w-full rounded-xl border border-white/10 bg-[#151515] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-red-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {metodosPago.map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setDatosPago({ ...datosPago, metodo })}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-300 ${
                        datosPago.metodo === metodo
                          ? 'border-red-600 bg-red-600/15 text-white'
                          : 'border-white/10 bg-[#151515] text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {metodo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  {estadosPago.map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      onClick={() => setDatosPago({ ...datosPago, estado })}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-300 ${
                        datosPago.estado === estado
                          ? estado === 'Completado'
                            ? 'border-green-500/60 bg-green-500/10 text-green-400'
                            : 'border-orange-400/60 bg-orange-400/10 text-orange-300'
                          : 'border-white/10 bg-[#151515] text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={pagoGuardado}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black uppercase tracking-wide text-white transition-all duration-300 ${
                  pagoGuardado ? 'bg-green-600' : 'bg-red-600 shadow-lg shadow-red-900/25 hover:-translate-y-0.5 hover:bg-red-700'
                }`}
              >
                {pagoGuardado ? (
                  <>
                    <CheckCircle2 size={18} /> Pago registrado
                  </>
                ) : (
                  <>
                    <Save size={18} /> Guardar pago
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
