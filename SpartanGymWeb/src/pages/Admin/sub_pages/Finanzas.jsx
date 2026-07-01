import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  Plus, Save, CheckCircle2, FileText,
  AlertCircle, RefreshCw, Search, User
} from 'lucide-react';
import TarjetaMetrica from '../../../components/TarjetaMetrica';
import {
  FacturaMembresiaModal,
  FacturaMembresiaResumen,
  descargarFacturaMembresiaPdf,
  imprimirFacturaMembresia,
} from '../../../components/FacturaMembresia';
import {
  formatearMoneda,
  MONEDAS_DISPONIBLES,
  useConfiguracionApp,
} from '../../../utils/configuracionApp';
import { finanzasApi, membresiasApi, pagosApi, sociosApi } from '../../../services/api';

const renovacionInicial = { idSocio: '', idTipoMembresia: '', metodoPago: 'Efectivo' };
const metodosPagoMembresia = ['Efectivo', 'Tarjeta', 'Transferencia'];

const categoriasFinancieras = ['Membresía', 'Suplemento', 'Servicios', 'Mantenimiento'];

const Finanzas = () => {
  // Estados para el formulario de registro
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    concepto: '',
    monto: '',
    tipo: 'ingreso',
    metodo: 'Efectivo',
    categoria: 'Membresía'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorApi, setErrorApi] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const busqueda = '';
  const configuracion = useConfiguracionApp();
  const monedaActual = MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === configuracion.currency) || MONEDAS_DISPONIBLES[1];
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);

  const [transacciones, setTransacciones] = useState([]);
  const ingresos = transacciones.filter((trx) => trx.tipo === 'ingreso').reduce((total, trx) => total + Number(trx.monto || 0), 0);
  const egresos = transacciones.filter((trx) => trx.tipo === 'gasto').reduce((total, trx) => total + Number(trx.monto || 0), 0);

  // Renovacion de membresia + factura
  const [socios, setSocios] = useState([]);
  const [tiposMembresia, setTiposMembresia] = useState([]);
  const [renovacion, setRenovacion] = useState(renovacionInicial);
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [facturaMembresia, setFacturaMembresia] = useState(null);
  const [facturaModalAbierta, setFacturaModalAbierta] = useState(false);
  const [descargandoFactura, setDescargandoFactura] = useState(false);
  const [renovando, setRenovando] = useState(false);
  const [mensajeRenovacion, setMensajeRenovacion] = useState(null);

  const cargarTransacciones = async () => {
    setTransacciones(await finanzasApi.listar());
  };

  const cargarDatosRenovacion = async () => {
    const [sociosData, tipos] = await Promise.all([sociosApi.listar(), membresiasApi.tipos()]);
    setSocios(sociosData);
    setTiposMembresia(tipos);
  };

  useEffect(() => {
    Promise.resolve()
      .then(cargarTransacciones)
      .catch(() => setErrorApi('No se pudo cargar finanzas desde la API.'));
    cargarDatosRenovacion().catch(() => setMensajeRenovacion({ tipo: 'error', texto: 'No se pudieron cargar socios o membresias desde la API.' }));
  }, []);

  const sociosFiltrados = socios.filter((socio) =>
    `${socio.nombres || ''} ${socio.apellidos || ''}`.toLowerCase().includes(busquedaSocio.toLowerCase().trim())
  );

  const renovarMembresia = async (evento) => {
    evento.preventDefault();
    setRenovando(true);
    setMensajeRenovacion(null);

    try {
      const factura = await pagosApi.renovar({
        idSocio: renovacion.idSocio,
        idTipoMembresia: Number(renovacion.idTipoMembresia),
        metodoPago: renovacion.metodoPago,
      });
      setFacturaMembresia(factura);
      setFacturaModalAbierta(true);
      setRenovacion(renovacionInicial);
      setBusquedaSocio('');
      setMensajeRenovacion({ tipo: 'exito', texto: `Membresia renovada. Factura ${factura.numeroFactura} generada.` });
      await cargarTransacciones();
    } catch (error) {
      setMensajeRenovacion({ tipo: 'error', texto: error.message || 'No se pudo renovar la membresia.' });
    } finally {
      setRenovando(false);
    }
  };

  const handleChange = (e) => {
    setNuevoMovimiento({ ...nuevoMovimiento, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorApi('');
    
    try {
      await finanzasApi.crear({
        tipo: nuevoMovimiento.tipo,
        concepto: nuevoMovimiento.concepto,
        monto: Number(nuevoMovimiento.monto),
        metodo: nuevoMovimiento.metodo,
        categoria: nuevoMovimiento.categoria,
      });
      await cargarTransacciones();
      setIsSaved(true);
      setTimeout(() => {
        setNuevoMovimiento({ concepto: '', monto: '', tipo: 'ingreso', metodo: 'Efectivo', categoria: 'Membresía' });
        setIsSaved(false);
      }, 2000);
    } catch {
      setErrorApi('No se pudo guardar el movimiento en la API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const transaccionesFiltradas = transacciones.filter(t => {
    const coincideTipo = filtro === 'todos' || t.tipo === filtro;
    return coincideTipo && (t.concepto.toLowerCase().includes(busqueda.toLowerCase()) || t.usuario.toLowerCase().includes(busqueda.toLowerCase()));
  });

  const resumenCategorias = useMemo(() => (
    categoriasFinancieras.map((categoria) => {
      const movimientos = transacciones.filter((transaccion) => transaccion.categoria === categoria);
      const total = movimientos.reduce((suma, transaccion) => suma + transaccion.monto, 0);

      return { categoria, total, cantidad: movimientos.length };
    })
  ), [transacciones]);

  const transaccionesPorCategoria = categoriasFinancieras
    .map((categoria) => ({
      categoria,
      movimientos: transaccionesFiltradas.filter((transaccion) => transaccion.categoria === categoria),
    }))
    .filter((grupo) => grupo.movimientos.length > 0);

  return (
    <div className="flex flex-col gap-6 text-white min-h-screen pb-10">
      
      {/* MÉTRICAS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaMetrica titulo="Balance" valor={formatearMonto(ingresos - egresos)} icono={DollarSign} color="text-gray-400" detalle="Neto" />
        <TarjetaMetrica titulo="Ingresos" valor={formatearMonto(ingresos)} icono={TrendingUp} color="text-green-500" detalle={`${transacciones.filter((trx) => trx.tipo === 'ingreso').length} Trx`} />
        <TarjetaMetrica titulo="Egresos" valor={formatearMonto(egresos)} icono={TrendingDown} color="text-red-500" detalle="Gastos" />
        <TarjetaMetrica titulo="Movimientos" valor={transacciones.length} icono={CreditCard} color="text-orange-500" detalle="Registros" />
      </div>
      {errorApi && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
          {errorApi}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#090909] p-4 shadow-2xl sm:grid-cols-2 xl:grid-cols-4">
        {resumenCategorias.map((item) => (
          <div key={item.categoria} className="rounded-xl border border-white/5 bg-[#111]/60 p-4 transition-all hover:-translate-y-0.5 hover:border-white/15">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.categoria}</p>
            <h3 className="mt-1 text-xl font-black text-white">{formatearMonto(item.total)}</h3>
            <p className="mt-1 text-[10px] font-bold text-gray-500">{item.cantidad} movimientos</p>
          </div>
        ))}
      </div>

      {/* RENOVAR MEMBRESÍA + FACTURA */}
      <section className="rounded-2xl border border-white/10 bg-[#090909] p-6 shadow-2xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-600/10 p-2 text-red-500">
              <User size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Renovar Membresía</h4>
              <p className="text-[11px] text-gray-500">Busca al socio, elige el plan y genera la factura.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={cargarDatosRenovacion}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase text-gray-300 transition-colors hover:bg-white/10"
          >
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>

        {mensajeRenovacion && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
            mensajeRenovacion.tipo === 'exito'
              ? 'border-green-500/20 bg-green-500/10 text-green-400'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}>
            {mensajeRenovacion.tipo === 'exito' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {mensajeRenovacion.texto}
          </div>
        )}

        {facturaMembresia && (
          <div className="mb-4">
            <FacturaMembresiaResumen
              factura={facturaMembresia}
              formatearMonto={formatearMonto}
              onAbrir={() => setFacturaModalAbierta(true)}
            />
          </div>
        )}

        <form onSubmit={renovarMembresia} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Buscar socio por nombre</label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 text-gray-600" size={14} />
              <input
                type="text"
                value={busquedaSocio}
                onChange={(e) => setBusquedaSocio(e.target.value)}
                placeholder="Escribe el nombre del socio..."
                className="w-full bg-[#111] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-red-600 transition-all text-white"
              />
            </div>
            <select
              required
              value={renovacion.idSocio}
              onChange={(e) => setRenovacion({ ...renovacion, idSocio: e.target.value })}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-2 px-3 text-xs outline-none focus:border-red-600 cursor-pointer text-white"
              size={5}
            >
              {sociosFiltrados.length === 0 && <option value="" disabled>No hay socios que coincidan</option>}
              {sociosFiltrados.map((socio) => (
                <option key={socio.id} value={socio.id}>{socio.nombres} {socio.apellidos}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Tipo de membresía</label>
              <select
                required
                value={renovacion.idTipoMembresia}
                onChange={(e) => setRenovacion({ ...renovacion, idTipoMembresia: e.target.value })}
                className="w-full bg-[#111] border border-white/5 rounded-xl py-2 px-3 text-xs outline-none focus:border-red-600 cursor-pointer text-white"
              >
                <option value="">Selecciona plan</option>
                {tiposMembresia.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nombre} - {formatearMonto(tipo.precio)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Método de pago</label>
              <div className="flex gap-2">
                {metodosPagoMembresia.map((metodo) => (
                  <button
                    key={metodo}
                    type="button"
                    onClick={() => setRenovacion({ ...renovacion, metodoPago: metodo })}
                    className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                      renovacion.metodoPago === metodo ? 'border-red-600 bg-red-600/10 text-white' : 'border-white/5 bg-[#111] text-gray-500'
                    }`}
                  >
                    {metodo}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={renovando || !renovacion.idSocio || !renovacion.idTipoMembresia}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-900/20 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={16} />
              {renovando ? 'Procesando...' : 'Renovar y generar factura'}
            </button>
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: TABLA DE HISTORIAL */}
        <div className="lg:col-span-2 bg-[#090909] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-base font-bold">Historial de Movimientos</h4>
            <div className="flex bg-[#111] p-1 rounded-xl border border-white/5">
              <button onClick={() => setFiltro('todos')} className={`text-[10px] px-3 py-1.5 rounded-lg font-bold ${filtro === 'todos' ? 'bg-red-600' : 'text-gray-500'}`}>TODOS</button>
              <button onClick={() => setFiltro('ingreso')} className={`text-[10px] px-3 py-1.5 rounded-lg font-bold ${filtro === 'ingreso' ? 'bg-green-600/20 text-green-500' : 'text-gray-500'}`}>INGRESOS</button>
              <button onClick={() => setFiltro('gasto')} className={`text-[10px] px-3 py-1.5 rounded-lg font-bold ${filtro === 'gasto' ? 'bg-red-500/20 text-red-500' : 'text-gray-500'}`}>GASTOS</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                  <th className="p-4">Detalle</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-white/5">
                {transaccionesPorCategoria.map((grupo) => (
                  <Fragment key={grupo.categoria}>
                    <tr className="bg-white/[0.03]">
                      <td colSpan="4" className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">{grupo.categoria}</span>
                          <span className="text-[10px] font-bold text-gray-500">{grupo.movimientos.length} movimientos</span>
                        </div>
                      </td>
                    </tr>
                    {grupo.movimientos.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="p-4">
                          <p className="font-bold text-white break-words max-w-[180px]">{t.concepto}</p>
                          <span className="text-[10px] text-gray-500">{t.fechaTransaccion ? new Date(t.fechaTransaccion).toLocaleString('es-NI') : 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-bold text-gray-400">{t.metodo}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-red-500/10 rounded text-[9px] font-bold text-red-500">{t.categoria}</span>
                        </td>
                        <td className={`p-4 text-right font-black ${t.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.tipo === 'ingreso' ? '+' : '-'} {formatearMonto(t.monto)}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
                {!transaccionesFiltradas.length && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-xs font-medium text-gray-500">
                      No hay movimientos para el filtro seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: SUB-PANTALLA REGISTRAR MOVIMIENTO */}
        <div className="bg-[#090909] border border-white/10 rounded-2xl p-6 shadow-2xl h-fit sticky top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-600/10 rounded-lg text-red-600">
              <Plus size={20} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider">Registrar Movimiento</h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* TIPO DE MOVIMIENTO (Toggle) */}
            <div className="flex p-1 bg-[#111] rounded-xl border border-white/5">
              <button 
                type="button" 
                onClick={() => setNuevoMovimiento({...nuevoMovimiento, tipo: 'ingreso'})}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${nuevoMovimiento.tipo === 'ingreso' ? 'bg-green-600 text-white' : 'text-gray-500'}`}
              >
                INGRESO
              </button>
              <button 
                type="button" 
                onClick={() => setNuevoMovimiento({...nuevoMovimiento, tipo: 'gasto'})}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${nuevoMovimiento.tipo === 'gasto' ? 'bg-red-600 text-white' : 'text-gray-500'}`}
              >
                GASTO
              </button>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Concepto del movimiento</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 text-gray-600" size={14} />
                <input 
                  type="text" name="concepto" required value={nuevoMovimiento.concepto} onChange={handleChange}
                  placeholder="Ej. Pago de luz, Venta de Proteína..."
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-red-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Monto ({monedaActual.simbolo})</label>
                <input 
                  type="number" name="monto" required value={nuevoMovimiento.monto} onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-2 px-4 text-xs outline-none focus:border-red-600 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Categoría</label>
                <select 
                  name="categoria" value={nuevoMovimiento.categoria} onChange={handleChange}
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-2 px-3 text-xs outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="Membresía">Membresía</option>
                  <option value="Suplemento">Suplemento</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Método de Pago</label>
              <div className="flex gap-2">
                {['Efectivo', 'Tarjeta', 'Transf.'].map((metodo) => (
                  <button
                    key={metodo} type="button"
                    onClick={() => setNuevoMovimiento({...nuevoMovimiento, metodo})}
                    className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${nuevoMovimiento.metodo === metodo ? 'border-red-600 bg-red-600/10 text-white' : 'border-white/5 bg-[#111] text-gray-500'}`}
                  >
                    {metodo}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" disabled={isSubmitting || isSaved}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all mt-4 flex items-center justify-center gap-2
                ${isSaved ? 'bg-green-600' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20'}
                ${isSubmitting ? 'opacity-50' : ''}
              `}
            >
              {isSubmitting ? 'Procesando...' : isSaved ? <><CheckCircle2 size={16}/> Guardado</> : <><Save size={16}/> Guardar Registro</>}
            </button>
          </form>
        </div>

      </div>

      {facturaMembresia && facturaModalAbierta && (
        <FacturaMembresiaModal
          factura={facturaMembresia}
          configuracion={configuracion}
          formatearMonto={formatearMonto}
          descargando={descargandoFactura}
          onClose={() => setFacturaModalAbierta(false)}
          onPrint={() => imprimirFacturaMembresia(facturaMembresia, configuracion, formatearMonto)}
          onDownload={async () => {
            setDescargandoFactura(true);
            try {
              await descargarFacturaMembresiaPdf(facturaMembresia, configuracion, formatearMonto);
            } finally {
              setDescargandoFactura(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default Finanzas;
