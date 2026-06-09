import { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Plus, Save, CheckCircle2, FileText
} from 'lucide-react';

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
  const [filtro, setFiltro] = useState('todos');
  const busqueda = '';

  // Datos mock de transacciones
  const [transacciones, setTransacciones] = useState([
    { id: '#TRX-9841', usuario: 'Jorge Cubillo', tipo: 'ingreso', concepto: 'Membresía Spartan Anual', monto: 250.00, metodo: 'Tarjeta', fecha: 'Hoy, 04:15 PM' },
    { id: '#TRX-9840', usuario: 'Gimnasio Central', tipo: 'gasto', concepto: 'Mantenimiento de máquinas', monto: 120.00, metodo: 'Transferencia', fecha: 'Hoy, 11:30 AM' },
    { id: '#TRX-9839', usuario: 'Anthony Flores', tipo: 'ingreso', concepto: 'Membresía Premium (3 Meses)', monto: 80.00, metodo: 'Efectivo', fecha: 'Ayer' },
  ]);

  const handleChange = (e) => {
    setNuevoMovimiento({ ...nuevoMovimiento, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulación de guardado
    setTimeout(() => {
      const nuevaTrx = {
        id: `#TRX-${Math.floor(Math.random() * 9000) + 1000}`,
        usuario: 'Administrador',
        tipo: nuevoMovimiento.tipo,
        concepto: nuevoMovimiento.concepto,
        monto: parseFloat(nuevoMovimiento.monto),
        metodo: nuevoMovimiento.metodo,
        fecha: 'Ahora mismo'
      };
      
      setTransacciones([nuevaTrx, ...transacciones]);
      setIsSubmitting(false);
      setIsSaved(true);
      
      setTimeout(() => {
        setNuevoMovimiento({ concepto: '', monto: '', tipo: 'ingreso', metodo: 'Efectivo', categoria: 'Membresía' });
        setIsSaved(false);
      }, 2000);
    }, 1000);
  };

  const transaccionesFiltradas = transacciones.filter(t => {
    const coincideTipo = filtro === 'todos' || t.tipo === filtro;
    return coincideTipo && (t.concepto.toLowerCase().includes(busqueda.toLowerCase()) || t.usuario.toLowerCase().includes(busqueda.toLowerCase()));
  });

  return (
    <div className="flex flex-col gap-6 text-white min-h-screen pb-10">
      
      {/* MÉTRICAS SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Balance" value="$4,114.50" icon={DollarSign} color="text-gray-400" trend="+12%" />
        <MetricCard title="Ingresos" value="$4,850.00" icon={TrendingUp} color="text-green-500" trend="84 Trx" />
        <MetricCard title="Egresos" value="$735.50" icon={TrendingDown} color="text-red-500" trend="Gastos" />
        <MetricCard title="Pendiente" value="$320.00" icon={CreditCard} color="text-orange-500" trend="17 Socios" />
      </div>

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
                  <th className="p-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-white/5">
                {transaccionesFiltradas.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="p-4">
                      <p className="font-bold text-white break-words max-w-[180px]">{t.concepto}</p>
                      <span className="text-[10px] text-gray-500">{t.fecha}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-bold text-gray-400">{t.metodo}</span>
                    </td>
                    <td className={`p-4 text-right font-black ${t.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.tipo === 'ingreso' ? '+' : '-'} ${t.monto.toFixed(2)}
                    </td>
                  </tr>
                ))}
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
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 block">Monto ($)</label>
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
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-[#090909] border border-white/10 p-5 rounded-2xl relative overflow-hidden">
    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-2xl font-black">{value}</h3>
    <p className="text-[10px] text-gray-400 mt-1 font-bold">{trend}</p>
    <div className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 rounded-xl ${color}`}>
      <Icon size={22} />
    </div>
  </div>
);

export default Finanzas;
