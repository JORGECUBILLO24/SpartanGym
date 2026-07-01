import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Minus,
  Package,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  User,
  UserRound,
  X,
} from 'lucide-react';
import { formatearMoneda, useConfiguracionApp } from '../utils/configuracionApp';
import { obtenerLogosApp } from '../utils/logosApp';
import { inventarioApi, sociosApi, sucursalesApi, ventasApi } from '../services/api';

const ventaInicial = {
  clienteEventual: false,
  socioId: '',
  clienteNombre: '',
  clienteDocumento: '',
  sucursalId: '',
  metodoPago: 'Efectivo',
  monedaPago: '',
  tipoCambio: '',
  montoRecibido: '',
  observaciones: '',
};

const metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];

const VentaProductosCompartida = ({
  subtitulo = 'Ventas',
  titulo = 'Vender productos',
  descripcion = 'Registra productos vendidos, descuenta stock y genera una factura sincronizada con caja.',
}) => {
  const configuracion = useConfiguracionApp();
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);
  const formatearMontoConMoneda = (valor, moneda) => formatearMoneda(valor, moneda || configuracion.currency);
  const [productos, setProductos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [formulario, setFormulario] = useState(ventaInicial);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [factura, setFactura] = useState(null);
  const [facturaModalAbierta, setFacturaModalAbierta] = useState(false);
  const [descargandoFactura, setDescargandoFactura] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    const [productosApi, sociosApiData, sucursalesApiData, ventasApiData] = await Promise.all([
      inventarioApi.listar(),
      sociosApi.listar(),
      sucursalesApi.listar(),
      ventasApi.listarProductos(),
    ]);
    setProductos(productosApi);
    setSocios(sociosApiData);
    setSucursales(sucursalesApiData);
    setVentas(ventasApiData);

    setFormulario((actual) => ({
      ...actual,
      sucursalId: actual.sucursalId || sucursalesApiData[0]?.id || '',
      monedaPago: actual.monedaPago || configuracion.currency || 'USD',
    }));
  }, [configuracion.currency]);

  useEffect(() => {
    Promise.resolve()
      .then(cargarDatos)
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar productos, socios o sucursales desde la API.' }));
  }, [cargarDatos]);

  const productosFiltrados = productos.filter((producto) => {
    const texto = `${producto.nombre || ''} ${producto.categoria || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase().trim());
  });

  const totalCarrito = useMemo(
    () => carrito.reduce((total, item) => total + Number(item.producto.precio || 0) * item.cantidad, 0),
    [carrito]
  );

  const impuestoEstimado = totalCarrito * (Number(configuracion.taxRate || 0) / 100);
  const totalEstimado = totalCarrito + impuestoEstimado;
  const monedaVenta = String(configuracion.currency || 'USD').toUpperCase();
  const monedasPago = Array.from(new Set([monedaVenta, 'USD', 'NIO']));
  const esEfectivo = formulario.metodoPago === 'Efectivo';
  const monedaPagoActual = String(formulario.monedaPago || monedaVenta).toUpperCase();
  const requiereTipoCambio = esEfectivo && monedaPagoActual !== monedaVenta;
  const tipoCambioNumerico = requiereTipoCambio ? Number(formulario.tipoCambio || 0) : 1;
  const montoRecibidoNumerico = Number(formulario.montoRecibido || 0);
  const montoConvertido = esEfectivo ? montoRecibidoNumerico * tipoCambioNumerico : totalEstimado;
  const cambioEstimado = esEfectivo ? montoConvertido - totalEstimado : 0;

  const actualizarCampo = (evento) => {
    const { name, value, type, checked } = evento.target;
    const nuevoValor = type === 'checkbox' ? checked : value;
    setFormulario((actual) => ({
      ...actual,
      [name]: nuevoValor,
      ...(name === 'clienteEventual' ? { socioId: '', clienteNombre: '', clienteDocumento: '' } : {}),
      ...(name === 'metodoPago' && value !== 'Efectivo' ? { monedaPago: '', tipoCambio: '', montoRecibido: '' } : {}),
      ...(name === 'metodoPago' && value === 'Efectivo' ? { monedaPago: actual.monedaPago || monedaVenta } : {}),
      ...(name === 'monedaPago' && value === monedaVenta ? { tipoCambio: '' } : {}),
    }));
    setMensaje(null);
  };

  const agregarProducto = (producto) => {
    if (Number(producto.stock || 0) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Este producto no tiene stock disponible.' });
      return;
    }

    setCarrito((actual) => {
      const existe = actual.find((item) => item.producto.id === producto.id);
      if (!existe) return [...actual, { producto, cantidad: 1 }];
      if (existe.cantidad >= Number(producto.stock || 0)) return actual;
      return actual.map((item) =>
        item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      );
    });
  };

  const cambiarCantidad = (productoId, delta) => {
    setCarrito((actual) =>
      actual
        .map((item) => {
          if (item.producto.id !== productoId) return item;
          const nuevaCantidad = Math.max(0, Math.min(item.cantidad + delta, Number(item.producto.stock || 0)));
          return { ...item, cantidad: nuevaCantidad };
        })
        .filter((item) => item.cantidad > 0)
    );
  };

  const registrarVenta = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const venta = await ventasApi.venderProducto({
        clienteEventual: formulario.clienteEventual,
        socioId: formulario.clienteEventual ? null : formulario.socioId,
        sucursalId: formulario.sucursalId,
        clienteNombre: formulario.clienteEventual ? formulario.clienteNombre : null,
        clienteDocumento: formulario.clienteDocumento,
        metodoPago: formulario.metodoPago,
        monedaVenta,
        monedaPago: esEfectivo ? monedaPagoActual : null,
        tipoCambio: esEfectivo ? (requiereTipoCambio ? Number(formulario.tipoCambio) : 1) : null,
        montoRecibido: esEfectivo ? Number(formulario.montoRecibido) : null,
        observaciones: formulario.observaciones,
        detalles: carrito.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
        })),
      });

      setFactura(venta);
      setFacturaModalAbierta(true);
      setFormulario((actual) => ({
        ...ventaInicial,
        sucursalId: actual.sucursalId,
        monedaPago: monedaVenta,
      }));
      setCarrito([]);
      setMensaje({ tipo: 'exito', texto: `Factura ${venta.numeroFactura} generada correctamente.` });
      await cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo registrar la venta.' });
    } finally {
      setGuardando(false);
    }
  };

  const socioSeleccionado = socios.find((socio) => socio.id === formulario.socioId);
  const ventaDeshabilitada =
    guardando ||
    !carrito.length ||
    !formulario.sucursalId ||
    (!formulario.clienteEventual && !formulario.socioId) ||
    (esEfectivo && (!formulario.montoRecibido || montoRecibidoNumerico <= 0)) ||
    (requiereTipoCambio && (!formulario.tipoCambio || tipoCambioNumerico <= 0)) ||
    (esEfectivo && cambioEstimado < 0);

  return (
    <div className="pagina-stack flex flex-col gap-6 text-white">
      <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">{subtitulo}</p>
            <h1 className="mt-1 text-2xl font-black text-white">{titulo}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">{descripcion}</p>
          </div>
          <button
            type="button"
            onClick={cargarDatos}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase text-gray-300 transition-colors hover:bg-white/10"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>

        {mensaje && <MensajeVenta tipo={mensaje.tipo} texto={mensaje.texto} />}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-red-500" size={20} />
                  <h2 className="font-black text-white">Productos disponibles</h2>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 text-gray-500" size={15} />
                  <input
                    value={busqueda}
                    onChange={(evento) => setBusqueda(evento.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full rounded-xl border border-white/10 bg-[#050505] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {productosFiltrados.map((producto) => (
                  <article key={producto.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111]">
                          {producto.imagenUrl ? (
                            <img src={producto.imagenUrl} alt={producto.nombre} className="h-full w-full object-cover" />
                          ) : (
                            <Package size={18} className="text-gray-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-black text-white">{producto.nombre}</h3>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">{producto.categoria}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                        Number(producto.stock || 0) > 5
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {producto.stock} unid.
                      </span>
                    </div>
                    <p className="text-lg font-black text-white">{formatearMonto(producto.precio)}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">{producto.sucursal?.nombre || producto.sucursal || 'Sin sucursal'}</p>
                    <button
                      type="button"
                      onClick={() => agregarProducto(producto)}
                      disabled={Number(producto.stock || 0) <= 0}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
                    >
                      <Plus size={14} />
                      Agregar
                    </button>
                  </article>
                ))}
                {!productosFiltrados.length && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-gray-500 md:col-span-2 2xl:col-span-3">
                    No hay productos cargados desde la API.
                  </div>
                )}
              </div>
            </div>

            {factura && (
              <FacturaGeneradaResumen
                factura={factura}
                formatearMonto={formatearMonto}
                onAbrir={() => setFacturaModalAbierta(true)}
              />
            )}
          </div>

          <form onSubmit={registrarVenta} className="h-fit rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <Receipt className="text-red-500" size={22} />
              <h2 className="font-black text-white">Factura</h2>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-2">
              <button
                type="button"
                onClick={() => setFormulario((actual) => ({ ...actual, clienteEventual: false, clienteNombre: '', clienteDocumento: '' }))}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase ${
                  !formulario.clienteEventual ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <User size={14} />
                Socio
              </button>
              <button
                type="button"
                onClick={() => setFormulario((actual) => ({ ...actual, clienteEventual: true, socioId: '' }))}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase ${
                  formulario.clienteEventual ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <UserRound size={14} />
                Eventual
              </button>
            </div>

            <div className="space-y-4">
              <CampoSelect
                etiqueta="Sucursal"
                name="sucursalId"
                value={formulario.sucursalId}
                onChange={actualizarCampo}
                required
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </CampoSelect>

              {formulario.clienteEventual ? (
                <>
                  <CampoTexto
                    etiqueta="Cliente eventual"
                    name="clienteNombre"
                    value={formulario.clienteNombre}
                    onChange={actualizarCampo}
                    placeholder="Nombre del cliente"
                    required
                  />
                  <CampoTexto
                    etiqueta="Documento / referencia"
                    name="clienteDocumento"
                    value={formulario.clienteDocumento}
                    onChange={actualizarCampo}
                    placeholder="Opcional"
                  />
                </>
              ) : (
                <CampoSelect
                  etiqueta="Socio registrado"
                  name="socioId"
                  value={formulario.socioId}
                  onChange={actualizarCampo}
                  required
                >
                  <option value="">Selecciona socio</option>
                  {socios.map((socio) => (
                    <option key={socio.id} value={socio.id}>{socio.nombres} {socio.apellidos}</option>
                  ))}
                </CampoSelect>
              )}

              <CampoSelect etiqueta="Metodo de pago" name="metodoPago" value={formulario.metodoPago} onChange={actualizarCampo}>
                {metodosPago.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
              </CampoSelect>

              {esEfectivo && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="mb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Pago en efectivo</p>
                    <p className="mt-1 text-[11px] text-gray-500">La factura se vende en {monedaVenta}; usa tipo de cambio solo si el cliente paga en otra moneda.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CampoSelect etiqueta="Moneda recibida" name="monedaPago" value={formulario.monedaPago || monedaVenta} onChange={actualizarCampo}>
                      {monedasPago.map((moneda) => <option key={moneda} value={moneda}>{moneda}</option>)}
                    </CampoSelect>
                    {requiereTipoCambio && (
                      <CampoTexto
                        etiqueta={`Tipo de cambio (${monedaVenta} por 1 ${monedaPagoActual})`}
                        name="tipoCambio"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={formulario.tipoCambio}
                        onChange={actualizarCampo}
                        placeholder="Ej. 36.50"
                        required
                      />
                    )}
                    <CampoTexto
                      etiqueta={`Monto recibido (${monedaPagoActual})`}
                      name="montoRecibido"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formulario.montoRecibido}
                      onChange={actualizarCampo}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              )}

              <CampoTexto
                etiqueta="Observaciones"
                name="observaciones"
                value={formulario.observaciones}
                onChange={actualizarCampo}
                placeholder="Opcional"
              />
            </div>

            <div className="my-5 border-t border-white/10 pt-5">
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Carrito</h3>
              <div className="space-y-3">
                {carrito.map((item) => (
                  <div key={item.producto.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-black text-white">{item.producto.nombre}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatearMonto(item.producto.precio)} c/u</p>
                      </div>
                      <button type="button" onClick={() => cambiarCantidad(item.producto.id, -item.cantidad)} className="text-gray-500 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-xl border border-white/10 bg-black/30">
                        <button type="button" onClick={() => cambiarCantidad(item.producto.id, -1)} className="p-2 text-gray-400 hover:text-white">
                          <Minus size={13} />
                        </button>
                        <span className="px-3 text-sm font-black text-white">{item.cantidad}</span>
                        <button type="button" onClick={() => cambiarCantidad(item.producto.id, 1)} className="p-2 text-gray-400 hover:text-white">
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="text-sm font-black text-white">
                        {formatearMonto(Number(item.producto.precio || 0) * item.cantidad)}
                      </span>
                    </div>
                  </div>
                ))}
                {!carrito.length && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-gray-500">
                    Agrega productos para generar la factura.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
              <LineaTotal etiqueta="Cliente" valor={formulario.clienteEventual ? (formulario.clienteNombre || 'Eventual') : (socioSeleccionado ? `${socioSeleccionado.nombres} ${socioSeleccionado.apellidos}` : 'Socio')} />
              <LineaTotal etiqueta="Subtotal" valor={formatearMonto(totalCarrito)} />
              <LineaTotal etiqueta={`Impuesto ${configuracion.taxRate || 0}%`} valor={formatearMonto(impuestoEstimado)} />
              {esEfectivo && (
                <>
                  <LineaTotal etiqueta={`Recibido (${monedaPagoActual})`} valor={formatearMontoConMoneda(montoRecibidoNumerico, monedaPagoActual)} />
                  {requiereTipoCambio && <LineaTotal etiqueta={`Equivalente (${monedaVenta})`} valor={formatearMonto(montoConvertido)} />}
                  <LineaTotal etiqueta="Cambio estimado" valor={formatearMonto(Math.max(cambioEstimado, 0))} />
                </>
              )}
              <LineaTotal etiqueta="Total" valor={formatearMonto(totalEstimado)} fuerte />
            </div>

            <button
              type="submit"
              disabled={ventaDeshabilitada}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black uppercase text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
            >
              <FileText size={17} />
              {guardando ? 'Facturando...' : 'Generar factura'}
            </button>
          </form>
        </div>
      </section>

      <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">API</p>
            <h2 className="text-lg font-black text-white">Facturas recientes</h2>
          </div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-gray-400">{ventas.length} facturas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500">
                <th className="pb-3 pr-4">Factura</th>
                <th className="pb-3 pr-4">Cliente</th>
                <th className="pb-3 pr-4">Sucursal</th>
                <th className="pb-3 pr-4">Metodo</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-white/[0.03]">
                  <td className="py-3 pr-4 font-mono text-xs font-black text-white">{venta.numeroFactura}</td>
                  <td className="py-3 pr-4 text-gray-400">
                    {venta.clienteNombre}
                    {venta.clienteEventual && <span className="ml-2 rounded-full bg-orange-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-orange-400">Eventual</span>}
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{venta.sucursal}</td>
                  <td className="py-3 pr-4 text-gray-400">{venta.metodoPago}{venta.monedaPago ? ` (${venta.monedaPago})` : ''}</td>
                  <td className="py-3 text-right font-black text-white">{formatearMonto(venta.total)}</td>
                </tr>
              ))}
              {!ventas.length && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-sm text-gray-500">No hay facturas de productos registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {factura && facturaModalAbierta && (
        <FacturaComercialModal
          factura={factura}
          configuracion={configuracion}
          formatearMonto={formatearMonto}
          formatearMontoConMoneda={formatearMontoConMoneda}
          descargando={descargandoFactura}
          onClose={() => setFacturaModalAbierta(false)}
          onPrint={() => imprimirFacturaComercial(factura, configuracion, formatearMonto, formatearMontoConMoneda)}
          onDownload={async () => {
            setDescargandoFactura(true);
            try {
              await descargarFacturaPdf(factura, configuracion, formatearMonto, formatearMontoConMoneda);
            } finally {
              setDescargandoFactura(false);
            }
          }}
        />
      )}
    </div>
  );
};

const CampoTexto = ({ etiqueta, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{etiqueta}</span>
    <input
      {...props}
      className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-red-600"
    />
  </label>
);

const CampoSelect = ({ etiqueta, children, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{etiqueta}</span>
    <select
      {...props}
      className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-red-600"
    >
      {children}
    </select>
  </label>
);

const MensajeVenta = ({ tipo, texto }) => (
  <div className={`mb-5 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
    tipo === 'exito'
      ? 'border-green-500/20 bg-green-500/10 text-green-400'
      : 'border-red-500/20 bg-red-500/10 text-red-400'
  }`}>
    {tipo === 'exito' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
    {texto}
  </div>
);

const LineaTotal = ({ etiqueta, valor, fuerte = false }) => (
  <div className={`flex items-center justify-between gap-3 ${fuerte ? 'border-t border-white/10 pt-2 text-base font-black text-white' : 'text-gray-400'}`}>
    <span>{etiqueta}</span>
    <span className={fuerte ? 'text-white' : 'font-bold text-gray-200'}>{valor}</span>
  </div>
);

const obtenerNumero = (valor, respaldo = 0) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
};

const obtenerFechaFactura = (factura) => {
  const fecha = factura?.fechaCreacion ? new Date(factura.fechaCreacion) : new Date();
  return Number.isNaN(fecha.getTime()) ? new Date() : fecha;
};

const formatearFechaFactura = (factura) =>
  new Intl.DateTimeFormat('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(obtenerFechaFactura(factura));

const crearSlugFactura = (valor) =>
  String(valor || 'factura')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'factura';

const escaparHtml = (valor) =>
  String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const crearDetallesPago = (factura, configuracion, formatearMonto, formatearMontoConMoneda) => {
  const monedaVenta = String(configuracion.currency || 'USD').toUpperCase();
  const metodoPago = factura.metodoPago || 'No especificado';
  const esEfectivoFactura = metodoPago.toLowerCase() === 'efectivo';
  const monedaPago = String(factura.monedaPago || monedaVenta).toUpperCase();
  const tipoCambio = obtenerNumero(factura.tipoCambio, 1);
  const montoRecibido = obtenerNumero(factura.montoRecibido);
  const montoConvertido = obtenerNumero(factura.montoRecibidoConvertido, montoRecibido * tipoCambio);

  const detalles = [
    ['Metodo de pago', metodoPago],
    ['Moneda de venta', monedaVenta],
  ];

  if (esEfectivoFactura && factura.montoRecibido != null) {
    detalles.push(
      [`Efectivo recibido (${monedaPago})`, formatearMontoConMoneda(montoRecibido, monedaPago)],
      ['Tipo de cambio', `1 ${monedaPago} = ${tipoCambio.toFixed(4)} ${monedaVenta}`],
      [`Equivalente (${monedaVenta})`, formatearMonto(montoConvertido)],
      ['Dinero devuelto', formatearMonto(factura.cambio)]
    );
  } else {
    detalles.push(['Estado de pago', 'Pagado']);
  }

  if (factura.observaciones) {
    detalles.push(['Observaciones', factura.observaciones]);
  }

  return detalles;
};

const cargarImagenComoPng = (urlImagen) =>
  new Promise((resolver) => {
    if (!urlImagen || typeof document === 'undefined') {
      resolver(null);
      return;
    }

    const imagen = new Image();
    imagen.crossOrigin = 'anonymous';
    imagen.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = imagen.naturalWidth || imagen.width;
        canvas.height = imagen.naturalHeight || imagen.height;
        const contexto = canvas.getContext('2d');
        contexto.drawImage(imagen, 0, 0);
        resolver({
          dataUrl: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        resolver(null);
      }
    };
    imagen.onerror = () => resolver(null);
    imagen.src = urlImagen;
  });

const agregarImagenContenida = (pdf, imagen, x, y, anchoMaximo, altoMaximo) => {
  if (!imagen?.width || !imagen?.height) return;

  const proporcion = imagen.width / imagen.height;
  let ancho = anchoMaximo;
  let alto = ancho / proporcion;

  if (alto > altoMaximo) {
    alto = altoMaximo;
    ancho = alto * proporcion;
  }

  pdf.addImage(
    imagen.dataUrl,
    'PNG',
    x + (anchoMaximo - ancho) / 2,
    y + (altoMaximo - alto) / 2,
    ancho,
    alto,
    undefined,
    'FAST'
  );
};

const dibujarPieFacturaPdf = (pdf) => {
  const paginas = pdf.getNumberOfPages();
  const anchoPagina = pdf.internal.pageSize.getWidth();
  const altoPagina = pdf.internal.pageSize.getHeight();

  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    pdf.setPage(pagina);
    pdf.setDrawColor(220, 220, 220);
    pdf.line(42, altoPagina - 42, anchoPagina - 42, altoPagina - 42);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(110, 110, 110);
    pdf.text(`Pagina ${pagina} de ${paginas}`, anchoPagina - 42, altoPagina - 26, { align: 'right' });
  }
};

const asegurarEspacioFacturaPdf = (pdf, y, altoNecesario) => {
  const altoPagina = pdf.internal.pageSize.getHeight();
  if (y + altoNecesario <= altoPagina - 62) return y;

  pdf.addPage();
  return 54;
};

const dibujarEncabezadoTablaFacturaPdf = (pdf, y, margen, anchoPagina) => {
  const anchoTabla = anchoPagina - margen * 2;
  pdf.setFillColor(18, 18, 18);
  pdf.rect(margen, y, anchoTabla, 28, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('PRODUCTO', margen + 12, y + 18);
  pdf.text('CANT.', margen + 300, y + 18);
  pdf.text('UNITARIO', margen + 390, y + 18, { align: 'right' });
  pdf.text('TOTAL', anchoPagina - margen - 12, y + 18, { align: 'right' });
  return y + 28;
};

const descargarFacturaPdf = async (factura, configuracion, formatearMonto, formatearMontoConMoneda) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const anchoPagina = pdf.internal.pageSize.getWidth();
  const margen = 42;
  const anchoTabla = anchoPagina - margen * 2;
  const detalles = factura.detalles || [];
  const detallesPago = crearDetallesPago(factura, configuracion, formatearMonto, formatearMontoConMoneda);
  const logos = obtenerLogosApp(configuracion);
  const logo = await cargarImagenComoPng(logos.principal);
  let y = 40;

  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(1.4);
  pdf.line(margen, y, anchoPagina - margen, y);
  y += 14;

  if (logo) {
    agregarImagenContenida(pdf, logo, margen, y, 120, 58);
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(18, 18, 18);
    pdf.text(configuracion.gymName || 'Spartan Gym', margen, y + 30);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(18, 18, 18);
  pdf.text('FACTURA COMERCIAL', anchoPagina - margen, y + 16, { align: 'right' });
  pdf.setFontSize(10);
  pdf.setTextColor(90, 90, 90);
  pdf.text(factura.numeroFactura || 'Sin numero', anchoPagina - margen, y + 36, { align: 'right' });
  pdf.text(formatearFechaFactura(factura), anchoPagina - margen, y + 52, { align: 'right' });

  y += 82;
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margen, y, anchoPagina - margen, y);
  y += 26;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(18, 18, 18);
  pdf.text(configuracion.gymName || 'Spartan Gym', margen, y);
  pdf.text('Facturar a', margen + 285, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 75, 75);
  pdf.text(configuracion.email || 'admin@spartangym.com', margen, y + 16);
  pdf.text(configuracion.phone || '+505 0000 0000', margen, y + 31);
  pdf.text(factura.sucursal || 'Sin sucursal', margen, y + 46, { maxWidth: 220 });
  pdf.text(factura.clienteNombre || 'Cliente', margen + 285, y + 16, { maxWidth: 220 });
  pdf.text(factura.clienteDocumento ? `Documento: ${factura.clienteDocumento}` : 'Documento: No indicado', margen + 285, y + 31);
  pdf.text(factura.clienteEventual ? 'Tipo: Cliente eventual' : 'Tipo: Socio registrado', margen + 285, y + 46);

  y += 78;
  y = dibujarEncabezadoTablaFacturaPdf(pdf, y, margen, anchoPagina);

  detalles.forEach((detalle, indice) => {
    const producto = String(detalle.productoNombre || 'Producto');
    const lineasProducto = pdf.splitTextToSize(producto, 250);
    const altoFila = Math.max(34, lineasProducto.length * 11 + 18);

    if (y + altoFila > pdf.internal.pageSize.getHeight() - 62) {
      pdf.addPage();
      y = dibujarEncabezadoTablaFacturaPdf(pdf, 54, margen, anchoPagina);
    }

    pdf.setFillColor(indice % 2 === 0 ? 255 : 248, indice % 2 === 0 ? 255 : 248, indice % 2 === 0 ? 255 : 248);
    pdf.rect(margen, y, anchoTabla, altoFila, 'F');
    pdf.setDrawColor(232, 232, 232);
    pdf.line(margen, y + altoFila, anchoPagina - margen, y + altoFila);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(30, 30, 30);
    pdf.text(lineasProducto, margen + 12, y + 18);
    pdf.text(String(detalle.cantidad || 0), margen + 300, y + 18);
    pdf.text(formatearMonto(detalle.precioUnitario), margen + 390, y + 18, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatearMonto(detalle.totalLinea), anchoPagina - margen - 12, y + 18, { align: 'right' });
    y += altoFila;
  });

  y += 24;
  y = asegurarEspacioFacturaPdf(pdf, y, 190);

  const xTotales = anchoPagina - margen - 210;
  pdf.setFillColor(248, 248, 248);
  pdf.roundedRect(xTotales, y, 210, 112, 6, 6, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text('Subtotal', xTotales + 14, y + 24);
  pdf.text(formatearMonto(factura.subtotal), xTotales + 196, y + 24, { align: 'right' });
  pdf.text('Impuesto', xTotales + 14, y + 48);
  pdf.text(formatearMonto(factura.impuesto), xTotales + 196, y + 48, { align: 'right' });
  pdf.setDrawColor(220, 220, 220);
  pdf.line(xTotales + 14, y + 64, xTotales + 196, y + 64);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(18, 18, 18);
  pdf.text('Total', xTotales + 14, y + 90);
  pdf.text(formatearMonto(factura.total), xTotales + 196, y + 90, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(18, 18, 18);
  pdf.text('Detalles de pago', margen, y + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 75, 75);
  detallesPago.forEach(([etiqueta, valor], indice) => {
    const filaY = y + 24 + indice * 16;
    pdf.text(`${etiqueta}:`, margen, filaY);
    pdf.text(String(valor ?? ''), margen + 122, filaY, { maxWidth: 170 });
  });

  y += 142;
  y = asegurarEspacioFacturaPdf(pdf, y, 44);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(110, 110, 110);
  pdf.text('Gracias por su compra. Documento generado desde Spartan Gym App.', margen, y, {
    maxWidth: anchoTabla,
  });

  dibujarPieFacturaPdf(pdf);
  pdf.save(`${crearSlugFactura(factura.numeroFactura)}.pdf`);
};

const crearHtmlFactura = (factura, configuracion, formatearMonto, formatearMontoConMoneda) => {
  const detallesPago = crearDetallesPago(factura, configuracion, formatearMonto, formatearMontoConMoneda);
  const logos = obtenerLogosApp(configuracion);
  const filasProductos = (factura.detalles || [])
    .map(
      (detalle) => `
        <tr>
          <td>${escaparHtml(detalle.productoNombre)}</td>
          <td class="center">${escaparHtml(detalle.cantidad)}</td>
          <td class="right">${escaparHtml(formatearMonto(detalle.precioUnitario))}</td>
          <td class="right strong">${escaparHtml(formatearMonto(detalle.totalLinea))}</td>
        </tr>
      `
    )
    .join('');
  const filasPago = detallesPago
    .map(
      ([etiqueta, valor]) => `
        <div class="pay-row">
          <span>${escaparHtml(etiqueta)}</span>
          <strong>${escaparHtml(valor)}</strong>
        </div>
      `
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escaparHtml(factura.numeroFactura || 'Factura')}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; background: #f2f2f2; color: #151515; font-family: Arial, Helvetica, sans-serif; }
          .sheet { width: 816px; min-height: 1056px; margin: 24px auto; background: #fff; padding: 42px; box-shadow: 0 18px 45px rgba(0,0,0,.12); }
          .top-line { height: 4px; background: #151515; margin-bottom: 22px; }
          header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #ddd; padding-bottom: 22px; }
          .brand { display: flex; gap: 18px; align-items: flex-start; }
          .logo { width: 132px; height: 72px; object-fit: contain; border: 1px solid #eee; padding: 8px; }
          h1, h2, p { margin: 0; }
          h1 { font-size: 26px; letter-spacing: .04em; }
          h2 { font-size: 18px; }
          .muted { color: #666; font-size: 12px; line-height: 1.55; }
          .right { text-align: right; }
          .center { text-align: center; }
          .strong { font-weight: 800; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin: 28px 0; }
          .label { color: #777; font-size: 10px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #151515; color: #fff; font-size: 11px; padding: 11px; text-align: left; text-transform: uppercase; }
          td { border-bottom: 1px solid #e8e8e8; padding: 12px 11px; font-size: 13px; }
          .bottom { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 28px; margin-top: 30px; align-items: start; }
          .box { background: #f7f7f7; border: 1px solid #e2e2e2; padding: 16px; }
          .pay-row, .total-row { display: flex; justify-content: space-between; gap: 18px; padding: 6px 0; font-size: 13px; }
          .total-row.final { border-top: 1px solid #ccc; margin-top: 8px; padding-top: 13px; font-size: 18px; font-weight: 900; }
          footer { margin-top: 42px; border-top: 1px solid #ddd; padding-top: 16px; color: #777; font-size: 12px; }
          @media print {
            body { background: #fff; }
            .sheet { width: auto; min-height: auto; margin: 0; padding: 28px; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <div class="top-line"></div>
          <header>
            <div class="brand">
              <img class="logo" src="${escaparHtml(logos.principal)}" alt="${escaparHtml(configuracion.gymName || 'Spartan Gym')}" />
              <div>
                <h2>${escaparHtml(configuracion.gymName || 'Spartan Gym')}</h2>
                <p class="muted">${escaparHtml(configuracion.email || 'admin@spartangym.com')}</p>
                <p class="muted">${escaparHtml(configuracion.phone || '+505 0000 0000')}</p>
                <p class="muted">${escaparHtml(factura.sucursal || 'Sin sucursal')}</p>
              </div>
            </div>
            <div class="right">
              <h1>FACTURA COMERCIAL</h1>
              <p class="muted strong">${escaparHtml(factura.numeroFactura || 'Sin numero')}</p>
              <p class="muted">${escaparHtml(formatearFechaFactura(factura))}</p>
            </div>
          </header>

          <section class="grid">
            <div>
              <p class="label">Cliente</p>
              <h2>${escaparHtml(factura.clienteNombre || 'Cliente')}</h2>
              <p class="muted">${escaparHtml(factura.clienteEventual ? 'Cliente eventual' : 'Socio registrado')}</p>
              <p class="muted">${escaparHtml(factura.clienteDocumento ? `Documento: ${factura.clienteDocumento}` : 'Documento: No indicado')}</p>
            </div>
            <div>
              <p class="label">Venta</p>
              <p class="muted"><strong>Vendedor:</strong> ${escaparHtml(factura.vendedor || 'Sistema')}</p>
              <p class="muted"><strong>Sucursal:</strong> ${escaparHtml(factura.sucursal || 'Sin sucursal')}</p>
              <p class="muted"><strong>Metodo:</strong> ${escaparHtml(factura.metodoPago || 'No especificado')}</p>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="center">Cant.</th>
                <th class="right">Unitario</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>${filasProductos}</tbody>
          </table>

          <section class="bottom">
            <div class="box">
              <p class="label">Detalles de pago</p>
              ${filasPago}
            </div>
            <div class="box">
              <div class="total-row"><span>Subtotal</span><strong>${escaparHtml(formatearMonto(factura.subtotal))}</strong></div>
              <div class="total-row"><span>Impuesto</span><strong>${escaparHtml(formatearMonto(factura.impuesto))}</strong></div>
              <div class="total-row final"><span>Total</span><strong>${escaparHtml(formatearMonto(factura.total))}</strong></div>
            </div>
          </section>

          <footer>Gracias por su compra. Documento generado desde Spartan Gym App.</footer>
        </main>
      </body>
    </html>
  `;
};

const imprimirFacturaComercial = (factura, configuracion, formatearMonto, formatearMontoConMoneda) => {
  const ventana = window.open('', '_blank', 'width=920,height=1080');
  if (!ventana) return;

  ventana.document.open();
  ventana.document.write(crearHtmlFactura(factura, configuracion, formatearMonto, formatearMontoConMoneda));
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 450);
};

const FacturaGeneradaResumen = ({ factura, formatearMonto, onAbrir }) => (
  <section className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-green-400">Factura generada</p>
        <h2 className="mt-1 font-mono text-lg font-black text-white">{factura.numeroFactura}</h2>
        <p className="mt-1 text-sm text-gray-300">
          {factura.clienteNombre} - {formatearMonto(factura.total)}
        </p>
      </div>
      <button
        type="button"
        onClick={onAbrir}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black uppercase text-[#111] transition-colors hover:bg-gray-200 sm:w-auto"
      >
        <Receipt size={15} />
        Ver factura comercial
      </button>
    </div>
  </section>
);

const FacturaComercialModal = ({
  factura,
  configuracion,
  formatearMonto,
  formatearMontoConMoneda,
  descargando,
  onClose,
  onPrint,
  onDownload,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
    onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget) onClose();
    }}
  >
    <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
      <header className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Documento comercial</p>
          <h2 className="mt-1 font-mono text-lg font-black text-white">{factura.numeroFactura}</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase text-white transition-colors hover:bg-white/10"
          >
            <Printer size={15} />
            Imprimir
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={descargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:bg-white/10 disabled:text-gray-500"
          >
            <Download size={15} />
            {descargando ? 'Generando...' : 'Descargar PDF'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar factura"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="overflow-y-auto bg-neutral-200 p-3 sm:p-6">
        <FacturaComercialVista
          factura={factura}
          configuracion={configuracion}
          formatearMonto={formatearMonto}
          formatearMontoConMoneda={formatearMontoConMoneda}
        />
      </div>
    </section>
  </div>
);

const FacturaComercialVista = ({ factura, configuracion, formatearMonto, formatearMontoConMoneda }) => {
  const logos = obtenerLogosApp(configuracion);
  const detallesPago = crearDetallesPago(factura, configuracion, formatearMonto, formatearMontoConMoneda);

  return (
    <article className="mx-auto min-h-[980px] w-full max-w-[840px] bg-white p-5 text-neutral-950 shadow-2xl sm:p-9">
      <div className="mb-7 h-1 w-full bg-neutral-950" />
      <header className="flex flex-col gap-6 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-36 items-center justify-center border border-neutral-200 p-2">
            <img src={logos.principal} alt={configuracion.gymName || 'Spartan Gym'} className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-950">{configuracion.gymName || 'Spartan Gym'}</h2>
            <p className="mt-1 text-sm text-neutral-600">{configuracion.email || 'admin@spartangym.com'}</p>
            <p className="text-sm text-neutral-600">{configuracion.phone || '+505 0000 0000'}</p>
            <p className="text-sm text-neutral-600">{factura.sucursal || 'Sin sucursal'}</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <h1 className="text-2xl font-black uppercase tracking-wider text-neutral-950">Factura comercial</h1>
          <p className="mt-2 font-mono text-sm font-black text-neutral-700">{factura.numeroFactura || 'Sin numero'}</p>
          <p className="mt-1 text-sm text-neutral-600">{formatearFechaFactura(factura)}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 border-b border-neutral-200 py-7 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Cliente</p>
          <h3 className="mt-2 text-lg font-black text-neutral-950">{factura.clienteNombre || 'Cliente'}</h3>
          <p className="mt-1 text-sm text-neutral-600">{factura.clienteEventual ? 'Cliente eventual' : 'Socio registrado'}</p>
          <p className="text-sm text-neutral-600">
            {factura.clienteDocumento ? `Documento: ${factura.clienteDocumento}` : 'Documento: No indicado'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Datos de venta</p>
          <div className="mt-2 space-y-1 text-sm text-neutral-700">
            <p><span className="font-bold text-neutral-950">Vendedor:</span> {factura.vendedor || 'Sistema'}</p>
            <p><span className="font-bold text-neutral-950">Sucursal:</span> {factura.sucursal || 'Sin sucursal'}</p>
            <p><span className="font-bold text-neutral-950">Metodo:</span> {factura.metodoPago || 'No especificado'}</p>
          </div>
        </div>
      </section>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-950 text-left text-[11px] uppercase text-white">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-center">Cant.</th>
              <th className="px-4 py-3 text-right">Unitario</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(factura.detalles || []).map((detalle, indice) => (
              <tr key={detalle.id || `${detalle.productoNombre}-${indice}`} className="border-b border-neutral-200">
                <td className="px-4 py-4 font-bold text-neutral-950">{detalle.productoNombre}</td>
                <td className="px-4 py-4 text-center text-neutral-700">{detalle.cantidad}</td>
                <td className="px-4 py-4 text-right text-neutral-700">{formatearMonto(detalle.precioUnitario)}</td>
                <td className="px-4 py-4 text-right font-black text-neutral-950">{formatearMonto(detalle.totalLinea)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="border border-neutral-200 bg-neutral-50 p-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Detalles de pago</p>
          <div className="space-y-2">
            {detallesPago.map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex items-start justify-between gap-5 text-sm">
                <span className="text-neutral-600">{etiqueta}</span>
                <strong className="max-w-[55%] text-right text-neutral-950">{valor}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-neutral-200 bg-neutral-50 p-5">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-neutral-600">Subtotal</span>
              <strong>{formatearMonto(factura.subtotal)}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-600">Impuesto</span>
              <strong>{formatearMonto(factura.impuesto)}</strong>
            </div>
            <div className="flex justify-between gap-4 border-t border-neutral-300 pt-4 text-xl font-black">
              <span>Total</span>
              <strong>{formatearMonto(factura.total)}</strong>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-10 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
        Gracias por su compra. Documento generado desde Spartan Gym App.
      </footer>
    </article>
  );
};

export default VentaProductosCompartida;
