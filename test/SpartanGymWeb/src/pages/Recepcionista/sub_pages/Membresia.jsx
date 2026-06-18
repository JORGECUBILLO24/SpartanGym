import { Users, AlertCircle, CheckCircle2, PlusCircle, Calendar, ShieldCheck, Zap } from 'lucide-react';

const Membresias = () => {
  const catalogo = [
    { 
      nombre: 'Básica', precio: '$30.00', duracion: '1 Mes', 
      beneficios: ['Acceso ilimitado', 'Vestidores'], 
      socios: 120, color: 'text-gray-400' 
    },
    { 
      nombre: 'Premium', precio: '$80.00', duracion: '3 Meses', 
      beneficios: ['Acceso ilimitado', 'Asesoría nutricional', 'Clases grupales'], 
      socios: 85, color: 'text-red-500', popular: true 
    },
    { 
      nombre: 'Elite', precio: '$150.00', duracion: '6 Meses', 
      beneficios: ['Todo Premium', 'Acceso 24/7', 'Entrenador personal'], 
      socios: 45, color: 'text-yellow-500' 
    },
  ];

  const socios = [
    { nombre: 'Carlos Ramírez', plan: 'Elite', vencimiento: '20/06/2026', estado: 'Activo' },
    { nombre: 'Ana Torres', plan: 'Básica', vencimiento: '15/05/2026', estado: 'Vencida' },
  ];

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto p-4 animate-in fade-in duration-500">
      
      {/* Sección Catálogo: Diseño de tarjetas tipo "Pricing Table" */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="text-red-500" /> Planes de Membresía
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {catalogo.map((plan, i) => (
            <div key={i} className={`relative bg-[#0d0d0d] p-6 rounded-3xl border ${plan.popular ? 'border-red-600/50 shadow-2xl shadow-red-900/10' : 'border-white/5'} hover:border-white/10 transition-all`}>
              {plan.popular && <span className="absolute -top-3 left-6 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popular</span>}
              
              <h4 className="text-white font-bold text-lg">{plan.nombre}</h4>
              <div className="mt-4 mb-6">
                <span className={`text-3xl font-black ${plan.color}`}>{plan.precio}</span>
                <span className="text-gray-500 text-sm ml-1">/ {plan.duracion}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.beneficios.map((b, idx) => (
                  <li key={idx} className="text-gray-400 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-red-600" /> {b}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 text-xs text-gray-600 pt-6 border-t border-white/5">
                <Users size={14} /> {plan.socios} socios activos
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección Tabla: Estilo moderno y limpio */}
      <section className="bg-[#0d0d0d] rounded-3xl border border-white/5 p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-white text-lg">Estado de Socios</h3>
          <button className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all">
            <PlusCircle size={18} /> Nueva Membresía
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead>
              <tr className="text-gray-500 border-b border-white/10 uppercase tracking-wider text-[10px]">
                <th className="pb-4 font-bold">Socio</th>
                <th className="pb-4 font-bold">Plan</th>
                <th className="pb-4 font-bold">Vencimiento</th>
                <th className="pb-4 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {socios.map((s, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-5 text-white font-medium">{s.nombre}</td>
                  <td className="py-5">{s.plan}</td>
                  <td className="py-5 flex items-center gap-2 text-gray-400">
                    <Calendar size={14} /> {s.vencimiento}
                  </td>
                  <td className="py-5">
                    <StatusBadge estado={s.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

// Sub-componente para Badge de estado para limpiar el código principal
const StatusBadge = ({ estado }) => {
  const isActive = estado === 'Activo';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
      isActive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
    }`}>
      {isActive ? <ShieldCheck size={12} /> : <AlertCircle size={12} />} {estado}
    </span>
  );
};

export default Membresias;