import { useState } from 'react';
import { 
  DollarSign, FileText, Search, PlusCircle, 
  CheckCircle2, Clock, CreditCard, ArrowUpRight, 
  TrendingUp, User, Calendar, Download, Filter
} from 'lucide-react';

const Pagos = () => {
  // Estado para simular la generación de reportes
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  // Estado para el filtro de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Datos dummy de ejemplo para el historial de pagos
  const historialPagos = [
    { id: 1, socio: 'Carlos Andrés Ramírez', membresia: 'Spartan Anual', monto: '$250.00', fecha: 'Hoy, 09:09 AM', metodo: 'Tarjeta de Crédito', estado: 'Completado' },
    { id: 2, socio: 'Juan Pérez', membresia: 'Premium (3 Meses)', monto: '$80.00', fecha: '12/05/2026', metodo: 'Transferencia', estado: 'Completado' },
    { id: 3, socio: 'María Gómez', membresia: 'Básica (1 Mes)', monto: '$30.00', fecha: '12/05/2026', metodo: 'Efectivo', estado: 'Completado' },
    { id: 4, socio: 'Ana Torres', membresia: 'Elite (6 Meses)', monto: '$150.00', fecha: '11/05/2026', metodo: 'Tarjeta de Débito', estado: 'Completado' },
    { id: 5, socio: 'Luis Hernández', membresia: 'Básica (1 Mes)', monto: '$30.00', fecha: '10/05/2026', metodo: 'Efectivo', estado: 'Pendiente' },
  ];

  // Función para simular la descarga del reporte financiero
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* ========================================================= */}
      {/* BARRA SUPERIOR CON ACCIÓN DE REPORTES EN EL EXTREMO DERECHO */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white">Flujo de Caja</h2>
          <p className="text-gray-400 text-sm">Monitorea los ingresos, transacciones y estados de cuenta.</p>
        </div>
        
        {/* Apartado Superior Derecho: Generación de Reportes */}
        <div className="self-end sm:self-auto relative">
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className={`flex items-center gap-2 font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg text-sm border cursor-pointer
              ${reportSuccess 
                ? 'bg-green-600 border-green-500 text-white shadow-green-900/20' 
                : 'bg-[#111111] border-white/10 hover:border-red-600/50 text-white hover:text-red-500'
              } ${isGeneratingReport ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isGeneratingReport ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando...</>
            ) : reportSuccess ? (
              <>
                <CheckCircle2 size={16} /> ¡Reporte Descargado!
              </>
            ) : (
              <>
                <FileText size={16} className="text-red-500" />
                Generar Reporte
                <Download size={14} className="opacity-60 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* METRICAS TARJETAS RÁPIDAS (FINANZAS)                      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Recaudado (Mes)</span>
            <h3 className="text-3xl font-black text-white mt-1">$1,840.00</h3>
            <span className="text-green-500 text-xs flex items-center gap-1 mt-2 font-medium">
              <TrendingUp size={12} /> +12.5% vs mes anterior
            </span>
          </div>
          <div className="text-green-500 p-4 bg-green-500/10 rounded-xl border border-green-500/10">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Método Más Utilizado</span>
            <h3 className="text-2xl font-bold text-white mt-1">Tarjetas</h3>
            <p className="text-gray-500 text-xs mt-2">60% de las transacciones</p>
          </div>
          <div className="text-red-500 p-4 bg-[#2a0808] rounded-xl border border-white/5">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Pagos por Registrar</span>
            <h3 className="text-3xl font-black text-orange-400 mt-1">1</h3>
            <span className="text-gray-500 text-xs flex items-center gap-1 mt-2">
              <Clock size={12} /> Requiere validación de caja
            </span>
          </div>
          <div className="text-orange-400 p-4 bg-orange-400/10 rounded-xl border border-orange-400/10">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN PRINCIPAL: BUSCADOR Y TABLA DE HISTORIAL          */}
      {/* ========================================================= */}
      <div className="bg-[#111111] rounded-2xl border border-white/5 p-5 lg:p-6 flex flex-col shadow-lg">
        
        {/* Filtros superiores de la tabla */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 text-white">
            <div className="text-red-500"><ArrowUpRight size={20} /></div>
            <h3 className="font-bold">Historial de Transacciones</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {/* Buscador reactivo por socio */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por socio..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#050505] rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none border border-white/10 focus:border-red-500/50 transition-colors" 
              />
            </div>
            
            <button className="bg-[#050505] hover:bg-white/5 text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer">
              <Filter size={14} /> Filtros
            </button>

            <button className="bg-[#e50914] hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20 cursor-pointer">
              <PlusCircle size={16} /> Registrar Pago
            </button>
          </div>
        </div>

        {/* Tabla transaccional */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="pb-3 font-medium pr-4">Socio</th>
                <th className="pb-3 font-medium pr-4">Concepto / Membresía</th>
                <th className="pb-3 font-medium pr-4">Monto</th>
                <th className="pb-3 font-medium pr-4">Fecha y Hora</th>
                <th className="pb-3 font-medium pr-4">Método</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {historialPagos
                .filter(pago => pago.socio.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((pago) => (
                  <tr key={pago.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    
                    {/* Columna Socio */}
                    <td className="py-3.5 flex items-center gap-3 pr-4">
                      <div className="w-8 h-8 rounded-full bg-[#2a0808] text-red-500 flex items-center justify-center">
                        <User size={14}/>
                      </div>
                      <span className="font-medium text-white">{pago.socio}</span>
                    </td>
                    
                    {/* Columna Membresía */}
                    <td className="py-3.5 text-gray-300 pr-4">{pago.membresia}</td>
                    
                    {/* Columna Monto */}
                    <td className="py-3.5 font-bold text-white pr-4">{pago.monto}</td>
                    
                    {/* Columna Fecha */}
                    <td className="py-3.5 text-gray-400 pr-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-600" />
                        {pago.fecha}
                      </div>
                    </td>
                    
                    {/* Columna Método */}
                    <td className="py-3.5 text-gray-400 pr-4">
                      <span className="bg-[#050505] border border-white/5 px-2.5 py-1 rounded-lg text-xs">
                        {pago.metodo}
                      </span>
                    </td>
                    
                    {/* Columna Estado */}
                    <td className="py-3.5">
                      {pago.estado === 'Completado' ? (
                        <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-green-500/20">
                          <CheckCircle2 size={12} /> {pago.estado}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full text-xs font-semibold border border-orange-400/20">
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
    </div>
  );
};

export default Pagos;