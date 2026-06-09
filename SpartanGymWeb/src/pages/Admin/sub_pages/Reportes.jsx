import { useState } from 'react';
import { 
  BarChart3, FileText, Download, TrendingUp, Users, 
  Package, DollarSign, Calendar, ArrowUpRight, Clock,
  CheckCircle2, AlertCircle
} from 'lucide-react';

const Reportes = () => {
  const [generandoId, setGenerandoId] = useState(null);
  const [reportesDescargados, setReportesDescargados] = useState([]);

  // Historial de reportes listos para descargar
  const [historialReportes, setHistorialReportes] = useState([
    { id: 'REP-2026-001', titulo: 'Cierre Financiero Mayo 2026', tipo: 'Finanzas', formato: 'PDF', fecha: '01 Jun 2026', tamano: '2.4 MB' },
    { id: 'REP-2026-002', titulo: 'Rendimiento de Inventario Q2', tipo: 'Inventario', formato: 'XLSX', fecha: '28 May 2026', tamano: '1.1 MB' },
    { id: 'REP-2026-003', titulo: 'Asistencia y Flujo de Socios', tipo: 'Asistencia', formato: 'PDF', fecha: '15 May 2026', tamano: '3.8 MB' },
  ]);

  // Tipos de reportes disponibles para generar
  const tiposReportes = [
    { id: 'fin', titulo: 'Reporte Financiero Consolidado', desc: 'Ingresos, egresos, desglose de métodos de pago y balance neto del gimnasio.', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'soc', titulo: 'Análisis de Socios y Retención', desc: 'Altas de nuevos socios, membresías renovadas, abandonos y tasas de asistencia.', icon: Users, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'inv', titulo: 'Auditoría de Inventario y Stock', desc: 'Rotación de suplementos, alertas de stock bajo y ganancias por ventas en recepción.', icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'asi', titulo: 'Control de Asistencia y Horarios', desc: 'Horas pico de flujo, asistencia del personal técnico y control de accesos.', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  const simularGeneracionReporte = (id, titulo, tipo) => {
    setGenerandoId(id);
    
    setTimeout(() => {
      const nuevoReporte = {
        id: `REP-2026-${Math.floor(Math.random() * 900) + 100}`,
        titulo: `${titulo} (Generado)`,
        tipo: tipo,
        formato: 'PDF',
        fecha: 'Ahora mismo',
        tamano: '1.5 MB'
      };
      
      setHistorialReportes((prev) => [nuevoReporte, ...prev]);
      setReportesDescargados((prev) => [...prev, id]);
      setGenerandoId(null);

      // Limpiar animación de éxito después de 2 segundos
      setTimeout(() => {
        setReportesDescargados(prev => prev.filter(item => item !== id));
      }, 2000);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 text-white min-h-screen pb-10">
      
      {/* SECCIÓN 1: TARJETAS ANALÍTICAS (MÉTRICAS CLAVE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AnalyticCard title="Crecimiento" value="+24%" desc="Nuevos socios" icon={TrendingUp} color="text-green-500" />
        <AnalyticCard title="Retención" value="92.3%" desc="Socios activos" icon={Users} color="text-red-500" />
        <AnalyticCard title="Rotación" value="4.2x" desc="Venta Suplementos" icon={Package} color="text-orange-500" />
        <AnalyticCard title="Margen Neto" value="82.4%" desc="Eficiencia caja" icon={BarChart3} color="text-blue-500" />
      </div>

      {/* SECCIÓN 2: GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: GENERADORES DE REPORTES (GRID 2x2 en PC) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiposReportes.map((rep) => {
            const IconComponent = rep.icon;
            const estaGenerando = generandoId === rep.id;
            const fueGenerado = reportesDescargados.includes(rep.id);

            return (
              <div key={rep.id} className="bg-[#090909] border border-white/10 p-5 rounded-2xl shadow-xl hover:border-red-600/30 transition-all flex flex-col justify-between h-[200px] relative overflow-hidden group">
                <ArrowUpRight size={14} className="absolute right-4 top-4 text-white/10 group-hover:text-red-500/70 transition-colors" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${rep.bg} ${rep.color}`}>
                      <IconComponent size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight break-words max-w-[80%]">{rep.titulo}</h4>
                  </div>
                  <p className="text-[11px] leading-4 text-gray-400 line-clamp-3 pr-2">{rep.desc}</p>
                </div>

                <button
                  disabled={generandoId !== null}
                  onClick={() => simularGeneracionReporte(rep.id, rep.titulo, rep.tipo)}
                  className={`w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer
                    ${fueGenerado 
                      ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' 
                      : estaGenerando 
                        ? 'bg-[#111] border border-white/10 text-gray-500 cursor-wait' 
                        : 'bg-white/[0.03] border border-white/10 hover:bg-red-600 hover:border-red-600 text-white shadow-md'
                    }
                  `}
                >
                  {estaGenerando ? (
                    'Procesando datos...'
                  ) : fueGenerado ? (
                    <><CheckCircle2 size={14} /> ¡Reporte Compilado!</>
                  ) : (
                    <><FileText size={14} /> Compilar Reporte</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE REPORTES GENERADOS (CRECE DINÁMICAMENTE) */}
        <div className="bg-[#090909] border border-white/10 rounded-2xl p-6 shadow-2xl h-auto flex flex-col relative overflow-hidden">
          
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-gray-500" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Descargas Recientes</h4>
          </div>
          <p className="text-[10px] text-gray-600 mb-4">Historial de archivos generados listos para su descarga local.</p>

          {/* Lista de archivos listos */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar w-full">
            {historialReportes.map((doc) => (
              <div key={doc.id} className="bg-[#111]/60 border border-white/5 p-3 rounded-xl flex items-center justify-between group hover:border-white/10 transition-colors w-full">
                {/* Contenedor de texto forzado a w-full y break-words para evitar deformaciones */}
                <div className="overflow-hidden flex-1 pr-2 w-full">
                  <p className="text-xs font-bold text-white truncate break-words w-full" title={doc.titulo}>
                    {doc.titulo}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[9px] text-gray-500 font-medium">
                    <span className="font-mono bg-white/5 px-1 py-0.5 rounded text-gray-400">{doc.id}</span>
                    <span>•</span>
                    <span>{doc.tamano}</span>
                    <span>•</span>
                    <span className="font-bold text-[8px] uppercase tracking-wider text-red-500">{doc.formato}</span>
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Calendar size={10} />
                      {doc.fecha}
                    </span>
                  </div>
                </div>

                {/* Botón de descarga individual */}
                <button className="p-2.5 bg-white/5 group-hover:bg-red-600 text-gray-400 group-hover:text-white rounded-lg transition-all shrink-0 ml-1 cursor-pointer">
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[9px] text-gray-600 font-medium">
            <AlertCircle size={12} />
            <span className="break-all">Los reportes expiran automáticamente tras 48 horas de su generación.</span>
          </div>

        </div>

      </div>

    </div>
  );
};

// Componente para las tarjetas analíticas superiores
const AnalyticCard = ({ title, value, desc, icon: Icon, color }) => (
  <div className="bg-[#090909] border border-white/10 p-3 sm:p-4 rounded-xl flex items-center justify-between">
    <div className="overflow-hidden">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5 truncate">{title}</p>
      <h2 className="text-xl sm:text-2xl font-black leading-none mb-1">{value}</h2>
      <p className="text-[10px] text-gray-400 truncate">{desc}</p>
    </div>
    <div className={`p-2 bg-white/5 rounded-lg shrink-0 ml-2 ${color}`}>
      <Icon size={18} className="sm:w-5 sm:h-5" />
    </div>
  </div>
);

export default Reportes;
