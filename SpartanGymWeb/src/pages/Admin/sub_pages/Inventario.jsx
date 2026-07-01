import { useEffect, useState } from 'react';
import { 
  Package, AlertTriangle, Search, Plus, 
  DollarSign, Layers, Save, CheckCircle2, 
  Tag, Image as ImageIcon, Edit, Trash2, X
} from 'lucide-react';
import TarjetaMetrica from '../../../components/TarjetaMetrica';
import {
  formatearMoneda,
  MONEDAS_DISPONIBLES,
  useConfiguracionApp,
} from '../../../utils/configuracionApp';
import { inventarioApi, sucursalesApi } from '../../../services/api';

const TAMANO_MAXIMO_IMAGEN = 3 * 1024 * 1024;

const leerArchivoComoDataUrl = (archivo) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = rechazar;
    lector.readAsDataURL(archivo);
  });

const cargarImagen = (src) =>
  new Promise((resolver, rechazar) => {
    const imagen = new window.Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = rechazar;
    imagen.src = src;
  });

const prepararImagenProducto = async (archivo) => {
  if (!archivo?.type?.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen valido.');
  }

  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    throw new Error('La imagen no debe superar 3 MB.');
  }

  const dataUrl = await leerArchivoComoDataUrl(archivo);
  if (archivo.type === 'image/svg+xml' || typeof document === 'undefined') {
    return dataUrl;
  }

  const imagen = await cargarImagen(dataUrl);
  const maximo = 720;
  const escala = Math.min(1, maximo / imagen.width, maximo / imagen.height);
  const ancho = Math.max(1, Math.round(imagen.width * escala));
  const alto = Math.max(1, Math.round(imagen.height * escala));
  const canvas = document.createElement('canvas');
  const contexto = canvas.getContext('2d');

  canvas.width = ancho;
  canvas.height = alto;
  contexto.drawImage(imagen, 0, 0, ancho, alto);

  return canvas.toDataURL('image/webp', 0.86);
};

const crearProductoInicial = (sucursalId = '') => ({
  nombre: '',
  categoria: 'Suplementos',
  precio: '',
  stock: '',
  sucursalId,
  imagenUrl: '',
});

const obtenerIdCorto = (id = '') => {
  const texto = String(id || '').trim();
  return texto ? texto.split('-')[0].toUpperCase() : 'SIN ID';
};

const Inventario = () => {
  // Estado para el formulario
  const [nuevoProducto, setNuevoProducto] = useState(() => crearProductoInicial());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorApi, setErrorApi] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoEditandoId, setProductoEditandoId] = useState('');
  const configuracion = useConfiguracionApp();
  const monedaActual = MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === configuracion.currency) || MONEDAS_DISPONIBLES[1];
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);

  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const cargarDatos = async () => {
    const [productosApi, sucursalesApiData] = await Promise.all([
      inventarioApi.listar(),
      sucursalesApi.listar(),
    ]);
    setProductos(productosApi);
    setProductoSeleccionado((actual) => (
      actual ? productosApi.find((producto) => producto.id === actual.id) || null : actual
    ));
    setSucursales(sucursalesApiData);
    setNuevoProducto((actual) => ({
      ...actual,
      sucursalId: actual.sucursalId || sucursalesApiData[0]?.id || '',
    }));
  };

  useEffect(() => {
    Promise.resolve()
      .then(cargarDatos)
      .catch(() => setErrorApi('No se pudo cargar el inventario desde la API.'));
  }, []);

  const handleChange = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const handleImagenChange = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setErrorApi('');
    try {
      const imagenUrl = await prepararImagenProducto(archivo);
      setNuevoProducto((actual) => ({ ...actual, imagenUrl }));
    } catch (error) {
      setErrorApi(error.message || 'No se pudo cargar la imagen.');
    } finally {
      e.target.value = '';
    }
  };

  const quitarImagen = () => {
    setNuevoProducto((actual) => ({ ...actual, imagenUrl: '' }));
  };

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
  };

  const editarProducto = (producto) => {
    setProductoSeleccionado(producto);
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
  };

  const cancelarEdicion = () => {
    setProductoEditandoId('');
    setIsSaved(false);
    setNuevoProducto(crearProductoInicial(nuevoProducto.sucursalId || sucursales[0]?.id || ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorApi('');
    
    try {
      const payload = {
        nombre: nuevoProducto.nombre,
        categoria: nuevoProducto.categoria,
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock),
        imagenUrl: nuevoProducto.imagenUrl,
        sucursalId: nuevoProducto.sucursalId || null,
      };
      const productoGuardado = productoEditandoId
        ? await inventarioApi.actualizar(productoEditandoId, payload)
        : await inventarioApi.crear(payload);

      await cargarDatos();
      setProductoSeleccionado(productoGuardado);
      setIsSaved(true);
      setTimeout(() => {
        setProductoEditandoId('');
        setNuevoProducto((actual) => crearProductoInicial(actual.sucursalId));
        setIsSaved(false);
      }, 2000);
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
      setProductoSeleccionado((actual) => (actual?.id === id ? null : actual));
      if (productoEditandoId === id) {
        setProductoEditandoId('');
        setNuevoProducto(crearProductoInicial(nuevoProducto.sucursalId || sucursales[0]?.id || ''));
      }
      await cargarDatos();
    } catch {
      setErrorApi('No se pudo eliminar el producto desde la API.');
    }
  };

  // Lógica para filtrar y buscar
  const productosFiltrados = productos.filter(p => {
    const coincideCategoria = filtro === 'todos' || 
                             (filtro === 'alertas' ? p.stock <= 5 : p.categoria.toLowerCase() === filtro);
    const busquedaNormalizada = busqueda.toLowerCase();
    const coincideBusqueda = p.nombre.toLowerCase().includes(busquedaNormalizada) ||
                             p.id.toLowerCase().includes(busquedaNormalizada) ||
                             obtenerIdCorto(p.id).toLowerCase().includes(busquedaNormalizada);
    return coincideCategoria && coincideBusqueda;
  });

  // Cálculos para métricas superiores
  const totalProductos = productos.length;
  const valorInventario = productos.reduce((acc, el) => acc + (el.precio * el.stock), 0);
  const alertasStock = productos.filter(p => p.stock <= 5).length;
  const totalCategorias = new Set(productos.map((producto) => producto.categoria).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6 text-white min-h-screen pb-10">
      {errorApi && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
          {errorApi}
        </div>
      )}
      
      {/* MÉTRICAS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaMetrica titulo="Total de Productos" valor={totalProductos} icono={Package} color="text-blue-500" detalle="Articulos en catalogo" />
        <TarjetaMetrica titulo="Valor del Inventario" valor={formatearMonto(valorInventario)} icono={DollarSign} color="text-green-500" detalle="Capital invertido" />
        <TarjetaMetrica titulo="Alertas de Stock" valor={alertasStock} icono={AlertTriangle} color="text-orange-500" detalle="Pocas unidades o agotado" />
        <TarjetaMetrica titulo="Categorias" valor={totalCategorias} icono={Layers} color="text-gray-400" detalle="Segun productos API" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: TABLA DE INVENTARIO */}
        <div className="lg:col-span-2 bg-[#090909] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h4 className="text-base font-bold">Catálogo de Productos</h4>
              <p className="text-xs text-gray-400">Administra las existencias y precios de la tienda.</p>
            </div>
            
            {/* Buscador Integrado */}
            <div className="relative w-full sm:w-64 group">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text" placeholder="Buscar producto o ID..." 
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#111] border border-white/5 py-2 pl-9 pr-4 rounded-xl text-xs outline-none focus:border-red-600/50 transition-all text-white"
              />
            </div>
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2 mb-6">
            <FilterBtn label="Todos" value="todos" current={filtro} setFiltro={setFiltro} activeColor="bg-red-600" />
            <FilterBtn label="Suplementos" value="suplementos" current={filtro} setFiltro={setFiltro} activeColor="bg-gray-700" />
            <FilterBtn label="Accesorios" value="accesorios" current={filtro} setFiltro={setFiltro} activeColor="bg-gray-700" />
            <FilterBtn label="⚠️ Alertas de Stock" value="alertas" current={filtro} setFiltro={setFiltro} activeColor="bg-orange-500 text-white" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0c0c0c]">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase font-bold tracking-wider bg-white/[0.02]">
                  <th className="p-4 w-24">ID corto</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Sucursal</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-white/5 font-medium">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((p) => {
                    const estaSeleccionado = productoSeleccionado?.id === p.id;

                    return (
                    <tr
                      key={p.id}
                      onClick={() => seleccionarProducto(p)}
                      className={`cursor-pointer transition-colors hover:bg-white/[0.04] ${
                        estaSeleccionado ? 'bg-red-500/10 ring-1 ring-inset ring-red-500/30' : ''
                      }`}
                    >
                      <td className="p-4 text-gray-500 font-mono font-bold text-[10px]" title={p.id}>
                        <span className="rounded-md border border-white/10 bg-[#111] px-2 py-1 text-gray-300">
                          {obtenerIdCorto(p.id)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#111]">
                            {p.imagenUrl ? (
                              <img src={p.imagenUrl} alt={p.nombre} className="h-full w-full object-cover" />
                            ) : (
                              <Package size={17} className="text-gray-600" />
                            )}
                          </div>
                          <p className="text-white font-bold break-words max-w-[200px]">{p.nombre}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-[#111] border border-white/5 rounded text-[10px] text-gray-400">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{p.sucursal?.nombre || p.sucursal || 'Sin sucursal'}</td>
                      <td className="p-4 text-center">
                        {p.stock === 0 ? (
                          <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded font-bold">Agotado</span>
                        ) : p.stock <= 5 ? (
                          <span className="text-[10px] bg-orange-500/20 text-orange-500 px-2 py-1 rounded font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                            <AlertTriangle size={12}/> {p.stock} unid.
                          </span>
                        ) : (
                          <span className="text-white font-bold">{p.stock} unid.</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-black text-green-500">
                        {formatearMonto(p.precio)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={(evento) => {
                              evento.stopPropagation();
                              editarProducto(p);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            aria-label={`Editar ${p.nombre}`}
                          >
                            <Edit size={14}/>
                          </button>
                          <button
                            type="button"
                            onClick={(evento) => {
                              evento.stopPropagation();
                              eliminarProducto(p.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            aria-label={`Eliminar ${p.nombre}`}
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      No se encontraron productos en esta categoría o búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA Y FORMULARIO */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          {productoSeleccionado && (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Vista previa</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#111]">
                <div className="flex aspect-[4/3] items-center justify-center bg-black/20">
                  {productoSeleccionado.imagenUrl ? (
                    <img src={productoSeleccionado.imagenUrl} alt={productoSeleccionado.nombre} className="h-full w-full object-cover" />
                  ) : (
                    <Package size={42} className="text-gray-700" />
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h4 className="break-words text-lg font-black text-white">{productoSeleccionado.nombre}</h4>
                    <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      ID {obtenerIdCorto(productoSeleccionado.id)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-black uppercase text-gray-500">Stock</p>
                      <p className="mt-1 font-black text-white">{productoSeleccionado.stock} unid.</p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-black uppercase text-gray-500">Precio</p>
                      <p className="mt-1 font-black text-green-500">{formatearMonto(productoSeleccionado.precio)}</p>
                    </div>
                  </div>
                  <p className="truncate rounded-lg border border-white/5 bg-white/[0.03] p-3 text-xs font-bold text-gray-300">
                    {productoSeleccionado.sucursal?.nombre || productoSeleccionado.sucursal || 'Sin sucursal'}
                  </p>
                  <button
                    type="button"
                    onClick={() => editarProducto(productoSeleccionado)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white/10"
                  >
                    <Edit size={14} />
                    Editar producto
                  </button>
                </div>
              </div>
            </section>
          )}

        <div className="bg-[#090909] border border-white/10 rounded-2xl p-6 shadow-2xl h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-600/10 rounded-lg text-red-600">
              {productoEditandoId ? <Edit size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider">
                {productoEditandoId ? 'Actualizar Producto' : 'Añadir Producto'}
              </h4>
              {productoEditandoId && (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Editando ID {obtenerIdCorto(productoEditandoId)}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-[#111] text-gray-500 transition-colors hover:border-red-500/50 hover:text-red-400">
                {nuevoProducto.imagenUrl ? (
                  <>
                    <img
                      src={nuevoProducto.imagenUrl}
                      alt="Vista previa del producto"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="relative z-10 rounded-full bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Cambiar imagen
                    </span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={24} className="mb-2 transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Subir Imagen</span>
                    <span className="mt-1 text-[9px] font-medium uppercase tracking-wider text-gray-600">PNG, JPG o WEBP</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="sr-only"
                />
              </label>
              {nuevoProducto.imagenUrl && (
                <button
                  type="button"
                  onClick={quitarImagen}
                  className="mt-2 w-full rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                >
                  Quitar imagen
                </button>
              )}
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Nombre del Producto</label>
              <input 
                type="text" name="nombre" required value={nuevoProducto.nombre} onChange={handleChange}
                placeholder="Ej. Proteína ISO 100..."
                className="w-full bg-[#111] border border-white/5 rounded-xl py-2 px-4 text-xs outline-none focus:border-red-600 transition-all text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Categoría</label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 text-gray-600" size={14} />
                <select 
                  name="categoria" value={nuevoProducto.categoria} onChange={handleChange}
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-red-600 cursor-pointer appearance-none"
                >
                  <option value="Suplementos">Suplementos</option>
                  <option value="Mercancía">Mercancía (Ropa)</option>
                  <option value="Accesorios">Accesorios (Shakers, Cintos)</option>
                  <option value="Bebidas">Bebidas / Snacks</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Precio ({monedaActual.simbolo})</label>
                <input 
                  type="number" name="precio" step="0.01" required value={nuevoProducto.precio} onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-2 px-4 text-xs outline-none focus:border-red-600 transition-all text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Stock Inicial</label>
                <input 
                  type="number" name="stock" required value={nuevoProducto.stock} onChange={handleChange}
                  placeholder="Ej. 10"
                  className="w-full bg-[#111] border border-white/5 rounded-xl py-2 px-4 text-xs outline-none focus:border-red-600 transition-all text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Sucursal</label>
              <select
                name="sucursalId"
                required
                value={nuevoProducto.sucursalId}
                onChange={handleChange}
                className="w-full bg-[#111] border border-white/5 rounded-xl py-2 px-4 text-xs outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" disabled={isSubmitting || isSaved}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all mt-4 flex items-center justify-center gap-2
                ${isSaved ? 'bg-green-600' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20'}
                ${isSubmitting ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              {isSubmitting
                ? (productoEditandoId ? 'Actualizando...' : 'Guardando...')
                : isSaved
                  ? <><CheckCircle2 size={16}/> Guardado</>
                  : <><Save size={16}/> {productoEditandoId ? 'Actualizar producto' : 'Añadir al Inventario'}</>}
            </button>
            {productoEditandoId && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={14} />
                Cancelar edición
              </button>
            )}
          </form>
        </div>
        </aside>

      </div>
    </div>
  );
};

// Componente para los botones de filtrado
const FilterBtn = ({ label, value, current, setFiltro, activeColor }) => (
  <button 
    onClick={() => setFiltro(value)}
    className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all border 
      ${current === value ? `${activeColor} border-transparent text-white` : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
  >
    {label}
  </button>
);

export default Inventario;
