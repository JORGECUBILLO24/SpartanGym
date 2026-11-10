import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  FileText,
  RefreshCw,
  Save,
  Search,
  Wallet,
} from 'lucide-react';
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
const movimientoInicial = {
  concepto: '', monto: '', tipo: 'ingreso', metodo: 'Efectivo', categoria: 'Membresía',
};

const Finanzas = () => {
  const configuracion = useConfiguracionApp();
  const monedaActual = MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === configuracion.currency) || MONEDAS_DISPONIBLES[1];
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);
  const [nuevoMovimiento, setNuevoMovimiento] = useState(movimientoInicial);
  const [renovacion, setRenovacion] = useState(renovacionInicial);
  const [transacciones, setTransacciones] = useState([]);
  const [socios, setSocios] = useState([]);
  const [tiposMembresia, setTiposMembresia] = useState([]);
  const [busquedaSocio, setBusquedaSocio] = useState('');
  const [operacionActiva, setOperacionActiva] = useState('movimiento');
  const [filtro, setFiltro] = useState('todos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [renovando, setRenovando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [errorApi, setErrorApi] = useState('');
  const [mensajeRenovacion, setMensajeRenovacion] = useState(null);
  const [facturaMembresia, setFacturaMembresia] = useState(null);
  const [facturaModalAbierta, setFacturaModalAbierta] = useState(false);
  const [descargandoFactura, setDescargandoFactura] = useState(false);

  const ingresos = transacciones
    .filter((transaccion) => transaccion.tipo === 'ingreso')
    .reduce((total, transaccion) => total + Number(transaccion.monto || 0), 0);
  const egresos = transacciones
    .filter((transaccion) => transaccion.tipo === 'gasto')
    .reduce((total, transaccion) => total + Number(transaccion.monto || 0), 0);
  const ingresosCount = transacciones.filter((transaccion) => transaccion.tipo === 'ingreso').length;

  const cargarTransacciones = async () => {
    setTransacciones(await finanzasApi.listar());
  };

  const cargarDatosRenovacion = async () => {
    const [sociosData, tipos] = await Promise.all([sociosApi.listar(), membresiasApi.tipos()]);
    setSocios(sociosData);
    setTiposMembresia(tipos);
  };

  useEffect(() => {
    cargarTransacciones().catch(() => setErrorApi('No se pudieron cargar los movimientos. Intenta actualizar.'));
    cargarDatosRenovacion().catch(() => setMensajeRenovacion({ tipo: 'error', texto: 'No se pudieron cargar socios o membresías. Intenta actualizar.' }));
  }, []);

  const actualizarDatos = async () => {
    setActualizando(true);
    setErrorApi('');
    setMensajeRenovacion(null);
    const resultados = await Promise.allSettled([cargarTransacciones(), cargarDatosRenovacion()]);
    if (resultados.some((resultado) => resultado.status === 'rejected')) {
      if (resultados[0].status === 'rejected') setErrorApi('No se pudieron actualizar los movimientos.');
      if (resultados[1].status === 'rejected') setMensajeRenovacion({ tipo: 'error', texto: 'No se pudieron actualizar socios o membresías.' });
    }
    setActualizando(false);
  };

  const sociosFiltrados = socios.filter((socio) =>
    `${socio.nombres || ''} ${socio.apellidos || ''}`.toLowerCase().includes(busquedaSocio.toLowerCase().trim())
  );

  const transaccionesFiltradas = transacciones.filter((transaccion) =>
    filtro === 'todos' || transaccion.tipo === filtro
  );

  const resumenCategorias = useMemo(() => categoriasFinancieras.map((categoria) => {
    const movimientosCategoria = transacciones.filter((transaccion) => transaccion.categoria === categoria);
    const entradas = movimientosCategoria
      .filter((transaccion) => transaccion.tipo === 'ingreso')
      .reduce((total, transaccion) => total + Number(transaccion.monto || 0), 0);
    const salidas = movimientosCategoria
      .filter((transaccion) => transaccion.tipo === 'gasto')
      .reduce((total, transaccion) => total + Number(transaccion.monto || 0), 0);
    return { categoria, balance: entradas - salidas, movimientos: movimientosCategoria.length };
  }), [transacciones]);

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
      setMensajeRenovacion({ tipo: 'exito', texto: `Membresía renovada. Factura ${factura.numeroFactura} generada.` });
      await cargarTransacciones();
    } catch (error) {
      setMensajeRenovacion({ tipo: 'error', texto: error.message || 'No se pudo renovar la membresía.' });
    } finally {
      setRenovando(false);
    }
  };

  const handleMovimientoChange = (evento) => {
    const { name, value } = evento.target;
    setNuevoMovimiento((actual) => ({ ...actual, [name]: value }));
  };

  const guardarMovimiento = async (evento) => {
    evento.preventDefault();
    setIsSubmitting(true);
    setIsSaved(false);
    setErrorApi('');
    try {
      await finanzasApi.crear({
        tipo: nuevoMovimiento.tipo,
        concepto: nuevoMovimiento.concepto.trim(),
        monto: Number(nuevoMovimiento.monto),
        metodo: nuevoMovimiento.metodo,
        categoria: nuevoMovimiento.categoria,
      });
      await cargarTransacciones();
      setNuevoMovimiento(movimientoInicial);
      setIsSaved(true);
      window.setTimeout(() => setIsSaved(false), 1800);
    } catch {
      setErrorApi('No se pudo guardar el movimiento. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workspace-page workspace-finance-page pb-4 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Finanzas</h1>
          <p className="mt-1 text-sm text-gray-400">Balance, operaciones e historial de caja.</p>
        </div>
        <button
          type="button"
          onClick={actualizarDatos}
          disabled={actualizando}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
        >
          <RefreshCw size={15} className={actualizando ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </header>

      <section className="finance-summary" aria-label="Resumen financiero">
        <div className="finance-summary-item finance-summary-balance">
          <span>Balance neto</span>
          <strong>{formatearMonto(ingresos - egresos)}</strong>
          <small>Ingresos menos egresos</small>
        </div>
        <div className="finance-summary-item">
          <span>Ingresos</span>
          <strong className="text-emerald-300">{formatearMonto(ingresos)}</strong>
          <small>{ingresosCount} registros</small>
        </div>
        <div className="finance-summary-item">
          <span>Egresos</span>
          <strong className="text-rose-300">{formatearMonto(egresos)}</strong>
          <small>Gastos registrados</small>
        </div>
        <div className="finance-summary-item">
          <span>Movimientos</span>
          <strong>{transacciones.length}</strong>
          <small>Registros de caja</small>
        </div>
      </section>

      {errorApi && <Aviso tipo="error" texto={errorApi} />}

      <section className="finance-categories" aria-labelledby="finance-category-title">
        <h2 id="finance-category-title">Balance por categoría</h2>
        <dl className="finance-category-grid">
          {resumenCategorias.map((item) => (
            <div key={item.categoria} className="finance-category-item">
              <dt>{item.categoria}</dt>
              <dd className={item.balance > 0 ? 'text-emerald-300' : item.balance < 0 ? 'text-rose-300' : 'text-gray-200'}>
                {formatearMonto(item.balance)}
              </dd>
              <small>{item.movimientos} {item.movimientos === 1 ? 'movimiento' : 'movimientos'}</small>
            </div>
          ))}
        </dl>
      </section>

      <div className="workspace-grid finance-workspace">
        <section className="finance-operations" aria-labelledby="finance-operations-title">
          <div className="finance-panel-heading">
            <div className="flex items-center gap-2.5">
              <Wallet size={17} className="text-red-400" />
              <h2 id="finance-operations-title">Operaciones</h2>
            </div>
            <div className="finance-operation-tabs" role="group" aria-label="Tipo de operación">
              <button
                type="button"
                onClick={() => setOperacionActiva('movimiento')}
                aria-pressed={operacionActiva === 'movimiento'}
              >
                Movimiento
              </button>
              <button
                type="button"
                onClick={() => setOperacionActiva('renovacion')}
                aria-pressed={operacionActiva === 'renovacion'}
              >
                Renovar plan
              </button>
            </div>
          </div>

          {mensajeRenovacion && (mensajeRenovacion.tipo === 'error' || operacionActiva === 'renovacion') && (
            <Aviso tipo={mensajeRenovacion.tipo} texto={mensajeRenovacion.texto} />
          )}

          {operacionActiva === 'movimiento' ? (
            <form key="movimiento" onSubmit={guardarMovimiento} className="finance-operation-form">
              <div className="finance-kind-toggle" role="group" aria-label="Tipo de movimiento">
                <button
                  type="button"
                  onClick={() => setNuevoMovimiento((actual) => ({ ...actual, tipo: 'ingreso' }))}
                  aria-pressed={nuevoMovimiento.tipo === 'ingreso'}
                  className={nuevoMovimiento.tipo === 'ingreso' ? 'is-income' : ''}
                >
                  <ArrowDownLeft size={15} /> Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setNuevoMovimiento((actual) => ({ ...actual, tipo: 'gasto' }))}
                  aria-pressed={nuevoMovimiento.tipo === 'gasto'}
                  className={nuevoMovimiento.tipo === 'gasto' ? 'is-expense' : ''}
                >
                  <ArrowUpRight size={15} /> Gasto
                </button>
              </div>

              <label className="finance-field-wrap">
                <span>Concepto</span>
                <input
                  type="text"
                  name="concepto"
                  required
                  maxLength={120}
                  value={nuevoMovimiento.concepto}
                  onChange={handleMovimientoChange}
                  placeholder="Ej. Pago de luz"
                  className="finance-field"
                />
              </label>

              <div className="finance-field-row">
                <label className="finance-field-wrap">
                  <span>Monto · {monedaActual.simbolo}</span>
                  <input
                    type="number"
                    name="monto"
                    min="0.01"
                    step="0.01"
                    required
                    value={nuevoMovimiento.monto}
                    onChange={handleMovimientoChange}
                    placeholder="0.00"
                    className="finance-field"
                  />
                </label>
                <label className="finance-field-wrap">
                  <span>Categoría</span>
                  <select name="categoria" value={nuevoMovimiento.categoria} onChange={handleMovimientoChange} className="finance-field">
                    {categoriasFinancieras.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
                  </select>
                </label>
              </div>

              <fieldset className="finance-payment-fieldset">
                <legend>Método de pago</legend>
                <div className="finance-payment-options">
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setNuevoMovimiento((actual) => ({ ...actual, metodo }))}
                      aria-pressed={nuevoMovimiento.metodo === metodo}
                      className={nuevoMovimiento.metodo === metodo ? 'is-selected' : ''}
                    >
                      {metodo === 'Transferencia' ? 'Transfer.' : metodo}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button type="submit" disabled={isSubmitting} className="finance-submit-button">
                {isSaved ? <CheckCircle2 size={16} /> : isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <Save size={16} />}
                {isSubmitting ? 'Guardando…' : isSaved ? 'Movimiento guardado' : 'Guardar movimiento'}
              </button>
            </form>
          ) : (
            <form key="renovacion" onSubmit={renovarMembresia} className="finance-operation-form">
              <label className="finance-field-wrap">
                <span>Buscar socio</span>
                <span className="finance-search-field">
                  <Search size={15} aria-hidden="true" />
                  <input
                    type="search"
                    value={busquedaSocio}
                    onChange={(evento) => setBusquedaSocio(evento.target.value)}
                    placeholder="Nombre o apellido"
                    aria-label="Buscar socio por nombre"
                  />
                </span>
              </label>

              <label className="finance-field-wrap">
                <span>Socio</span>
                <select
                  required
                  value={renovacion.idSocio}
                  onChange={(evento) => setRenovacion((actual) => ({ ...actual, idSocio: evento.target.value }))}
                  className="finance-field"
                >
                  <option value="">{sociosFiltrados.length ? 'Selecciona socio' : 'No hay socios que coincidan'}</option>
                  {sociosFiltrados.map((socio) => (
                    <option key={socio.id} value={socio.id}>{socio.nombres} {socio.apellidos}</option>
                  ))}
                </select>
              </label>

              <label className="finance-field-wrap">
                <span>Plan de membresía</span>
                <select
                  required
                  value={renovacion.idTipoMembresia}
                  onChange={(evento) => setRenovacion((actual) => ({ ...actual, idTipoMembresia: evento.target.value }))}
                  className="finance-field"
                >
                  <option value="">Selecciona un plan</option>
                  {tiposMembresia.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre} · {formatearMonto(tipo.precio)}</option>
                  ))}
                </select>
              </label>

              <fieldset className="finance-payment-fieldset">
                <legend>Método de pago</legend>
                <div className="finance-payment-options">
                  {metodosPagoMembresia.map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setRenovacion((actual) => ({ ...actual, metodoPago: metodo }))}
                      aria-pressed={renovacion.metodoPago === metodo}
                      className={renovacion.metodoPago === metodo ? 'is-selected' : ''}
                    >
                      {metodo === 'Transferencia' ? 'Transfer.' : metodo}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={renovando || !renovacion.idSocio || !renovacion.idTipoMembresia}
                className="finance-submit-button"
              >
                {renovando ? <RefreshCw size={15} className="animate-spin" /> : <FileText size={16} />}
                {renovando ? 'Procesando…' : 'Renovar y facturar'}
              </button>

              {facturaMembresia && (
                <FacturaMembresiaResumen
                  factura={facturaMembresia}
                  formatearMonto={formatearMonto}
                  onAbrir={() => setFacturaModalAbierta(true)}
                />
              )}
            </form>
          )}
        </section>

        <section className="finance-history" aria-labelledby="finance-history-title">
          <div className="finance-panel-heading finance-history-heading">
            <div>
              <h2 id="finance-history-title">Movimientos</h2>
              <p>{transaccionesFiltradas.length} {transaccionesFiltradas.length === 1 ? 'registro' : 'registros'}</p>
            </div>
            <div className="finance-history-filters" role="group" aria-label="Filtrar movimientos">
              {[
                ['todos', 'Todos'],
                ['ingreso', 'Ingresos'],
                ['gasto', 'Gastos'],
              ].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor)}
                  aria-pressed={filtro === valor}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          <ul className="finance-transaction-list">
            {transaccionesFiltradas.map((transaccion) => (
              <li key={transaccion.id} className="finance-transaction-row">
                <div className="finance-transaction-description">
                  <span className={`finance-transaction-icon ${transaccion.tipo === 'ingreso' ? 'is-income' : 'is-expense'}`} aria-hidden="true">
                    {transaccion.tipo === 'ingreso' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{transaccion.concepto || 'Movimiento'}</p>
                    <p className="finance-transaction-meta">
                      {[transaccion.categoria, transaccion.metodo, formatearFecha(transaccion.fechaTransaccion)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
                <strong className={`finance-transaction-amount ${transaccion.tipo === 'ingreso' ? 'is-income' : 'is-expense'}`}>
                  {transaccion.tipo === 'ingreso' ? '+' : '−'} {formatearMonto(transaccion.monto)}
                </strong>
              </li>
            ))}
            {!transaccionesFiltradas.length && (
              <li className="finance-empty-state">
                <CreditCard size={18} />
                <p>{transacciones.length ? 'No hay movimientos para este filtro.' : 'Aún no hay movimientos registrados.'}</p>
              </li>
            )}
          </ul>
        </section>
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

const Aviso = ({ tipo, texto }) => (
  <div role={tipo === 'error' ? 'alert' : 'status'} className={`finance-notice ${tipo === 'exito' ? 'is-success' : 'is-error'}`}>
    {tipo === 'exito' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
    <span>{texto}</span>
  </div>
);

const formatearFecha = (valor) => {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('es-NI', { dateStyle: 'short', timeStyle: 'short' }).format(fecha);
};

export default Finanzas;
