import { useState } from 'react';
import { 
  Package, AlertTriangle, Search, Plus, 
  DollarSign, Layers, Save, CheckCircle2, 
  Tag, Image as ImageIcon, Edit, Trash2
} from 'lucide-react';
import TarjetaMetrica from '../../../components/TarjetaMetrica';

const Inventario = () => {
  // Estado para el formulario
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    categoria: 'Suplementos',
    precio: '',
    stock: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  // Datos mock de inventario
  const [productos, setProductos] = useState([
    { id: 'PROD-001', nombre: 'Whey Protein 100% Gold Standard (5 lbs)', categoria: 'Suplementos', precio: 65.00, stock: 12 },
    { id: 'PROD-002', nombre: 'Creatina Monohidratada Micronizada', categoria: 'Suplementos', precio: 25.00, stock: 4 }, // Stock bajo
    { id: 'PROD-003', nombre: 'Camiseta Oficial Spartan Gym (Talla M)', categoria: 'Mercancía', precio: 15.00, stock: 30 },
    { id: 'PROD-004', nombre: 'Shaker Mezclador Spartan (700ml)', categoria: 'Accesorios', precio: 8.50, stock: 0 }, // Agotado
    { id: 'PROD-005', nombre: 'Pre-Entrenamiento C4 Original', categoria: 'Suplementos', precio: 30.00, stock: 15 },
    { id: 'PROD-006', nombre: 'Cinturón de Levantamiento de Cuero', categoria: 'Accesorios', precio: 45.00, stock: 8 },
  ]);

  const handleChange = (e) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const nuevoItem = {
        id: `PROD-00${productos.length + 1}`,
        nombre: nuevoProducto.nombre,
        categoria: nuevoProducto.categoria,
        precio: parseFloat(nuevoProducto.precio),
        stock: parseInt(nuevoProducto.stock)
      };
      
      setProductos([nuevoItem, ...productos]);
      setIsSubmitting(false);
      setIsSaved(true);
      
      setTimeout(() => {
        setNuevoProducto({ nombre: '', categoria: 'Suplementos', precio: '', stock: '' });
        setIsSaved(false);
      }, 2000);
    }, 1000);
  };

  // Lógica para filtrar y buscar
  const productosFiltrados = productos.filter(p => {
    const coincideCategoria = filtro === 'todos' || 
                             (filtro === 'alertas' ? p.stock <= 5 : p.categoria.toLowerCase() === filtro);
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                             p.id.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  // Cálculos para métricas superiores
  const totalProductos = productos.length;
  const valorInventario = productos.reduce((acc, el) => acc + (el.precio * el.stock), 0);
  const alertasStock = productos.filter(p => p.stock <= 5).length;

  return (
    <div className="flex flex-col gap-6 text-white min-h-screen pb-10">
      
      {/* MÉTRICAS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaMetrica titulo="Total de Productos" valor={totalProductos} icono={Package} color="text-blue-500" detalle="Articulos en catalogo" />
        <TarjetaMetrica titulo="Valor del Inventario" valor={`$${valorInventario.toFixed(2)}`} icono={DollarSign} color="text-green-500" detalle="Capital invertido" />
        <TarjetaMetrica titulo="Alertas de Stock" valor={alertasStock} icono={AlertTriangle} color="text-orange-500" detalle="Pocas unidades o agotado" />
        <TarjetaMetrica titulo="Categorias" valor="3" icono={Layers} color="text-gray-400" detalle="Suplementos, Merch, etc." />
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
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 text-[10px] uppercase font-bold tracking-wider bg-white/[0.02]">
                  <th className="p-4 w-20">ID</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-white/5 font-medium">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-gray-500 font-mono font-bold text-[10px]">{p.id}</td>
                      <td className="p-4">
                        <p className="text-white font-bold break-words max-w-[200px]">{p.nombre}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-[#111] border border-white/5 rounded text-[10px] text-gray-400">
                          {p.categoria}
                        </span>
                      </td>
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
                        ${p.precio.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"><Edit size={14}/></button>
                          <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No se encontraron productos en esta categoría o búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: REGISTRAR NUEVO PRODUCTO */}
        <div className="bg-[#090909] border border-white/10 rounded-2xl p-6 shadow-2xl h-fit sticky top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-600/10 rounded-lg text-red-600">
              <Plus size={20} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider">Añadir Producto</h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Contenedor simulado para subir imagen */}
            <div className="w-full h-28 bg-[#111] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-red-500/50 hover:text-red-400 transition-colors cursor-pointer group mb-2">
              <ImageIcon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Subir Imagen</span>
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
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Precio ($)</label>
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

            <button 
              type="submit" disabled={isSubmitting || isSaved}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all mt-4 flex items-center justify-center gap-2
                ${isSaved ? 'bg-green-600' : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20'}
                ${isSubmitting ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              {isSubmitting ? 'Guardando...' : isSaved ? <><CheckCircle2 size={16}/> Guardado</> : <><Save size={16}/> Añadir al Inventario</>}
            </button>
          </form>
        </div>

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
