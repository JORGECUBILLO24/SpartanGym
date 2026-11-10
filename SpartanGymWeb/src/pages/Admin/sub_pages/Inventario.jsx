import { useEffect, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, DollarSign, Edit, Image as ImageIcon,
  Layers, Package, Plus, Save, Search, Tag, Trash2, X,
} from 'lucide-react';
import TarjetaMetrica from '../../../components/TarjetaMetrica';
import {
  formatearMoneda,
  MONEDAS_DISPONIBLES,
  useConfiguracionApp,
} from '../../../utils/configuracionApp';
import { inventarioApi, sucursalesApi } from '../../../services/api';
import { prepararImagen } from '../../../utils/imagen';

const crearProductoInicial = (sucursalId = '') => ({
  nombre: '', categoria: 'Suplementos', precio: '', stock: '', sucursalId, imagenUrl: '',
});

const obtenerIdCorto = (id = '') => {
  const texto = String(id || '').trim();
  return texto ? texto.split('-')[0].toUpperCase() : 'SIN ID';
};

const Inventario = () => {
  const configuracion = useConfiguracionApp();
  const monedaActual = MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === configuracion.currency) || MONEDAS_DISPONIBLES[1];
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);
  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState(() => crearProductoInicial());
  const [productoEditandoId, setProductoEditandoId] = useState('');
  const [vista, setVista] = useState('lista');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorApi, setErrorApi] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const cargarDatos = async () => {
    const [productosApi, sucursalesApiData] = await Promise.all([
      inventarioApi.listar(),
      sucursalesApi.listar(),
    ]);
    setProductos(productosApi);
    setSucursales(sucursalesApiData);
    setNuevoProducto((actual) => ({
      ...actual,
      sucursalId: actual.sucursalId || sucursalesApiData[0]?.id || '',
    }));
  };

  useEffect(() => {
    Promise.resolve().then(cargarDatos).catch(() => setErrorApi('No se pudo cargar el inventario desde la API.'));
  }, []);

  const abrirNuevoProducto = () => {
    setNuevoProducto(crearProductoInicial(sucursales[0]?.id || ''));
    setProductoEditandoId('');
    setIsSaved(false);
    setErrorApi('');
    setVista('editor');
  };

  const editarProducto = (producto) => {
    setProductoEditandoId(producto.id);
    setIsSaved(false);
    setErrorApi('');
    setNuevoProducto({
      nombre: producto.nombre || '',
      categoria: producto.categoria || 'Suplementos',
      precio: producto.precio ?? '',
      stock: producto.stock ?? '',
      sucursalId: producto.sucursal?.id || producto.sucursalId || '',
      imagenUrl: producto.imagenUrl || '',
    });
    setVista('editor');
  };

  const volverAlCatalogo = () => {
    setVista('lista');
    setProductoEditandoId('');
    setIsSaved(false);
    setErrorApi('');
    setNuevoProducto(crearProductoInicial(sucursales[0]?.id || ''));
  };

  const handleChange = (evento) => {
    const { name, value } = evento.target;
    setNuevoProducto((actual) => ({ ...actual, [name]: value }));
  };

  const handleImagenChange = async (evento) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setErrorApi('');
    try {
      const imagenUrl = await prepararImagen(archivo, { maxLado: 720, calidad: 0.86, maxBytesEntrada: 3 * 1024 * 1024 });
      setNuevoProducto((actual) => ({ ...actual, imagenUrl }));
    } catch (error) {
      setErrorApi(error.message || 'No se pudo cargar la imagen.');
    } finally {
      evento.target.value = '';
    }
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setIsSubmitting(true);
    setErrorApi('');
    try {
      const payload = {
        nombre: nuevoProducto.nombre.trim(),
        categoria: nuevoProducto.categoria,
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock),
        imagenUrl: nuevoProducto.imagenUrl,
        sucursalId: nuevoProducto.sucursalId || null,
      };
      await (productoEditandoId
        ? inventarioApi.actualizar(productoEditandoId, payload)
        : inventarioApi.crear(payload));
      await cargarDatos();
      setIsSaved(true);
      window.setTimeout(() => {
        setVista('lista');
        setProductoEditandoId('');
        setNuevoProducto(crearProductoInicial(sucursales[0]?.id || ''));
        setIsSaved(false);
      }, 900);
    } catch {
      setErrorApi(productoEditandoId ? 'No se pudo actualizar el producto en la API.' : 'No se pudo guardar el producto en la API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarProducto = async (id) => {
    setErrorApi('');
    try {
      await inventarioApi.eliminar(id);
      await cargarDatos();
    } catch {
      setErrorApi('No se pudo eliminar el producto desde la API.');
    }
  };

  const productosFiltrados = productos.filter((producto) => {
    const coincideCategoria = filtro === 'todos'
      || (filtro === 'alertas' ? producto.stock <= 5 : producto.categoria?.toLowerCase() === filtro);
    const texto = busqueda.toLowerCase().trim();
    const coincideBusqueda = `${producto.nombre || ''} ${producto.id || ''} ${obtenerIdCorto(producto.id)}`.toLowerCase().includes(texto);
    return coincideCategoria && coincideBusqueda;
  });

  const totalProductos = productos.length;
  const valorInventario = productos.reduce((total, producto) => total + (Number(producto.precio) * Number(producto.stock)), 0);
  const alertasStock = productos.filter((producto) => producto.stock <= 5).length;
  const totalCategorias = new Set(productos.map((producto) => producto.categoria).filter(Boolean)).size;

  if (vista === 'editor') {
    return (
      <div className="workspace-page pb-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={volverAlCatalogo} aria-label="Volver al inventario" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
              <ArrowLeft size={19} />
            </button>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{productoEditandoId ? 'Editar producto' : 'Añadir producto'}</h1>
              <p className="mt-1 text-sm text-gray-400">{productoEditandoId ? `ID ${obtenerIdCorto(productoEditandoId)}` : 'Completa los datos para incorporarlo al catálogo.'}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-gray-400">Inventario · {sucursales.find((sucursal) => sucursal.id === nuevoProducto.sucursalId)?.nombre || 'Sucursal'}</span>
        </div>

        {errorApi && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{errorApi}</p>}

        <form onSubmit={handleSubmit} className="inventory-editor">
          <div className="inventory-editor-image">
            <label className="group relative flex min-h-32 cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 transition-colors hover:border-red-500/50">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/40 text-gray-500">
                {nuevoProducto.imagenUrl ? <img src={nuevoProducto.imagenUrl} alt="Vista previa del producto" className="h-full w-full object-cover" /> : <ImageIcon size={24} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Imagen del producto</span>
                <span className="mt-1 block text-xs text-gray-400">PNG, JPG o WEBP · hasta 3 MB</span>
                <span className="mt-2 inline-flex text-xs font-semibold text-red-300">{nuevoProducto.imagenUrl ? 'Cambiar imagen' : 'Seleccionar archivo'}</span>
              </span>
              <input type="file" accept="image/*" onChange={handleImagenChange} className="sr-only" />
            </label>
            {nuevoProducto.imagenUrl && (
              <button type="button" onClick={() => setNuevoProducto((actual) => ({ ...actual, imagenUrl: '' }))} className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-300">
                <X size={13} /> Quitar imagen
              </button>
            )}
          </div>

          <label className="inventory-editor-name block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-400">Nombre del producto</span>
            <input type="text" name="nombre" required value={nuevoProducto.nombre} onChange={handleChange} placeholder="Ej. Proteína ISO 100" className="inventory-editor-input" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-400">Categoría</span>
            <span className="relative block">
              <Tag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <select name="categoria" value={nuevoProducto.categoria} onChange={handleChange} className="inventory-editor-input pl-9">
                <option value="Suplementos">Suplementos</option>
                <option value="Mercancía">Mercancía (Ropa)</option>
                <option value="Accesorios">Accesorios (Shakers, Cintos)</option>
                <option value="Bebidas">Bebidas / Snacks</option>
              </select>
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-400">Sucursal</span>
            <select name="sucursalId" required value={nuevoProducto.sucursalId} onChange={handleChange} className="inventory-editor-input">
              <option value="">Selecciona sucursal</option>
              {sucursales.map((sucursal) => <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-400">Precio ({monedaActual.simbolo})</span>
            <input type="number" name="precio" min="0" step="0.01" required value={nuevoProducto.precio} onChange={handleChange} placeholder="0.00" className="inventory-editor-input" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-gray-400">Stock inicial</span>
            <input type="number" name="stock" min="0" step="1" required value={nuevoProducto.stock} onChange={handleChange} placeholder="Ej. 10" className="inventory-editor-input" />
          </label>

          <div className="inventory-editor-actions">
            <button type="button" onClick={volverAlCatalogo} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white">
              <X size={16} /> Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || isSaved} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-colors disabled:cursor-wait disabled:opacity-60 ${isSaved ? 'bg-emerald-700' : 'bg-red-600 hover:bg-red-500'}`}>
              {isSubmitting ? 'Guardando…' : isSaved ? <><CheckCircle2 size={16} /> Guardado</> : <><Save size={16} /> {productoEditandoId ? 'Guardar cambios' : 'Añadir al inventario'}</>}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="workspace-page pb-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Inventario</h1>
          <p className="mt-1 text-sm text-gray-400">Productos, existencias y precios por sucursal.</p>
        </div>
        <button type="button" onClick={abrirNuevoProducto} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition-colors hover:bg-red-500">
          <Plus size={16} /> Añadir producto
        </button>
      </div>

      {errorApi && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{errorApi}</p>}

      <div className="workspace-grid--metrics">
        <TarjetaMetrica titulo="Total de Productos" valor={totalProductos} icono={Package} color="text-blue-500" detalle="Artículos en catálogo" />
        <TarjetaMetrica titulo="Valor del Inventario" valor={formatearMonto(valorInventario)} icono={DollarSign} color="text-green-500" detalle="Capital invertido" />
        <TarjetaMetrica titulo="Alertas de Stock" valor={alertasStock} icono={AlertTriangle} color="text-orange-500" detalle="Cinco unidades o menos" />
        <TarjetaMetrica titulo="Categorías" valor={totalCategorias} icono={Layers} color="text-gray-400" detalle="En el catálogo" />
      </div>

      <section className="min-w-0 rounded-xl border border-white/10 bg-[#090909] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Catálogo de productos</h2>
            <p className="mt-1 text-xs text-gray-400">{productosFiltrados.length} resultados</p>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="search" placeholder="Buscar producto o ID" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} className="w-full rounded-lg border border-white/10 bg-[#111] py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-red-500/60" />
          </label>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <FilterBtn label="Todos" value="todos" current={filtro} setFiltro={setFiltro} />
          <FilterBtn label="Suplementos" value="suplementos" current={filtro} setFiltro={setFiltro} />
          <FilterBtn label="Accesorios" value="accesorios" current={filtro} setFiltro={setFiltro} />
          <FilterBtn label="Alertas de stock" value="alertas" current={filtro} setFiltro={setFiltro} />
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.07]">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead className="bg-white/[0.025] text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-3 py-3">Producto</th><th className="px-3 py-3">Categoría</th><th className="px-3 py-3">Sucursal</th><th className="px-3 py-3 text-center">Stock</th><th className="px-3 py-3 text-right">Precio</th><th className="px-3 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-sm">
              {productosFiltrados.map((producto) => (
                <tr key={producto.id} className="transition-colors hover:bg-white/[0.025]">
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04] text-gray-500">
                        {producto.imagenUrl ? <img src={producto.imagenUrl} alt="" className="h-full w-full object-cover" /> : <Package size={16} />}
                      </span>
                      <span className="min-w-0"><span className="block truncate font-semibold text-white">{producto.nombre}</span><span className="mt-0.5 block font-mono text-[10px] text-gray-500" title={producto.id}>ID {obtenerIdCorto(producto.id)}</span></span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-400">{producto.categoria}</td>
                  <td className="px-3 py-3 text-gray-400">{producto.sucursal?.nombre || producto.sucursal || 'Sin sucursal'}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs font-semibold ${producto.stock <= 5 ? 'text-orange-300' : 'text-gray-200'}`}>{producto.stock === 0 ? 'Agotado' : `${producto.stock} unid.`}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-400">{formatearMonto(producto.precio)}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-center gap-1">
                      <button type="button" onClick={() => editarProducto(producto)} aria-label={`Editar ${producto.nombre}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/[0.07] hover:text-white"><Edit size={15} /></button>
                      <button type="button" onClick={() => eliminarProducto(producto.id)} aria-label={`Eliminar ${producto.nombre}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-300"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!productosFiltrados.length && <tr><td colSpan="6" className="px-4 py-10 text-center text-sm text-gray-500">No se encontraron productos para esos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const FilterBtn = ({ label, value, current, setFiltro }) => (
  <button type="button" onClick={() => setFiltro(value)} aria-pressed={current === value} className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${current === value ? 'bg-red-600/15 text-red-300' : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'}`}>
    {label}
  </button>
);

export default Inventario;
