import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  TrendingUp,
  Users,
} from 'lucide-react';
import TarjetaMetrica from '../../../components/TarjetaMetrica';
import {
  exportarReporteExcel,
  exportarReportePdf,
  formatearFechaCortaReporte,
  obtenerEtiquetaCuentaActual,
} from '../../../utils/exportarReportes';
import { formatearMoneda, useConfiguracionApp } from '../../../utils/configuracionApp';
import { obtenerLogosApp } from '../../../utils/logosApp';
import { reportesApi } from '../../../services/api';

const tiposReportes = [
  {
    id: 'fin',
    tipo: 'Finanzas',
    titulo: 'Reporte Financiero Consolidado',
    desc: 'Ingresos, egresos, desglose de metodos de pago y balance neto del gimnasio.',
    icon: DollarSign,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    id: 'soc',
    tipo: 'Socios',
    titulo: 'Analisis de Socios y Retencion',
    desc: 'Altas de nuevos socios, membresias renovadas, abandonos y tasas de asistencia.',
    icon: Users,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    id: 'inv',
    tipo: 'Inventario',
    titulo: 'Auditoria de Inventario y Stock',
    desc: 'Rotacion de suplementos, alertas de stock bajo y ganancias por ventas en recepcion.',
    icon: Package,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    id: 'asi',
    tipo: 'Asistencia',
    titulo: 'Control de Asistencia y Horarios',
    desc: 'Horas pico de flujo, asistencia del personal tecnico y control de accesos.',
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
];

const resumenInicial = {
  totalSocios: 0,
  membresiasActivas: 0,
  asistenciasRegistradas: 0,
  ingresosTotales: 0,
  tasaRetencion: 0,
  margenNeto: 0,
};

const crearReporteHistorial = ({
  id,
  titulo,
  tipo,
  fecha,
  kind,
  createdAt,
  createdBy,
  formato = 'PDF / Excel',
  tamano = 'Listo',
  headers = [],
  rows = [],
  summary = [],
  detalles = [],
}) => ({
  id,
  titulo,
  tipo,
  formato,
  fecha,
  tamano,
  kind,
  createdAt,
  createdBy,
  headers,
  rows,
  summary,
  detalles,
});

const Reportes = () => {
  const configuracion = useConfiguracionApp();
  const [generandoId, setGenerandoId] = useState(null);
  const [reportesDescargados, setReportesDescargados] = useState([]);
  const [descargandoId, setDescargandoId] = useState(null);
  const [errorDescarga, setErrorDescarga] = useState('');
  const [resumen, setResumen] = useState(resumenInicial);
  const [historialReportes, setHistorialReportes] = useState([]);
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);
  const logos = obtenerLogosApp(configuracion);

  useEffect(() => {
    reportesApi.resumen()
      .then((datos) => setResumen({ ...resumenInicial, ...datos }))
      .catch(() => setErrorDescarga('No se pudo cargar el resumen de reportes desde la API.'));
  }, []);

  const simularGeneracionReporte = async (reporteBase) => {
    setGenerandoId(reporteBase.id);
    setErrorDescarga('');

    try {
      const reporteApi = await reportesApi.generar(reporteBase.id);
      const ahora = new Date();
      const nuevoReporte = crearReporteHistorial({
        id: reporteApi.id,
        titulo: reporteApi.titulo,
        tipo: reporteBase.tipo,
        fecha: reporteApi.fecha || formatearFechaCortaReporte(ahora),
        kind: reporteApi.tipo || reporteBase.id,
        createdAt: ahora.toISOString(),
        createdBy: obtenerEtiquetaCuentaActual(),
        formato: reporteApi.formato ? `${reporteApi.formato} / Excel` : 'PDF / Excel',
        tamano: reporteApi.tamano || 'Listo',
        headers: reporteApi.headers || [],
        rows: reporteApi.rows || [],
        summary: reporteApi.summary || [],
        detalles: reporteApi.detalles || [],
      });

      setHistorialReportes((prev) => [nuevoReporte, ...prev]);
      setReportesDescargados((prev) => [...prev, reporteBase.id]);

      setTimeout(() => {
        setReportesDescargados((prev) => prev.filter((item) => item !== reporteBase.id));
      }, 2000);
    } catch (error) {
      setErrorDescarga(error.message || 'No se pudo generar el reporte desde la API.');
    } finally {
      setGenerandoId(null);
    }
  };

  const descargarReporte = async (reporte, formato) => {
    const token = `${reporte.id}-${formato}`;

    setErrorDescarga('');
    setDescargandoId(token);

    try {
      if (formato === 'pdf') {
        await exportarReportePdf(reporte, logos.principal);
      } else {
        exportarReporteExcel(reporte);
      }
    } catch (error) {
      console.error(error);
      setErrorDescarga('No se pudo generar el archivo. Intentalo de nuevo.');
    } finally {
      setDescargandoId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 pb-10 text-white">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <TarjetaMetrica titulo="Ingresos" valor={formatearMonto(resumen.ingresosTotales)} detalle="Pagos registrados" icono={DollarSign} color="text-green-500" />
        <TarjetaMetrica titulo="Socios" valor={resumen.totalSocios} detalle="Registrados en base" icono={Users} color="text-red-500" />
        <TarjetaMetrica titulo="Asistencias" valor={resumen.asistenciasRegistradas} detalle="Check-ins guardados" icono={TrendingUp} color="text-orange-500" />
        <TarjetaMetrica titulo="Retencion" valor={`${resumen.tasaRetencion}%`} detalle={`${resumen.membresiasActivas} membresias activas`} icono={BarChart3} color="text-blue-500" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          {tiposReportes.map((rep) => {
            const IconComponent = rep.icon;
            const estaGenerando = generandoId === rep.id;
            const fueGenerado = reportesDescargados.includes(rep.id);

            return (
              <div key={rep.id} className="report-card group relative flex h-[208px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-xl transition-all hover:-translate-y-1 hover:border-red-600/30">
                <ArrowUpRight size={14} className="absolute right-4 top-4 text-white/10 transition-colors group-hover:text-red-500/70" />

                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className={`rounded-xl p-2 ${rep.bg} ${rep.color}`}>
                      <IconComponent size={20} />
                    </div>
                    <h4 className="max-w-[80%] break-words text-sm font-bold tracking-tight text-white">{rep.titulo}</h4>
                  </div>
                  <p className="line-clamp-3 pr-2 text-[11px] leading-4 text-gray-400">{rep.desc}</p>
                </div>

                <button
                  disabled={generandoId !== null}
                  onClick={() => simularGeneracionReporte(rep)}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-wider shadow-md transition-all
                    ${fueGenerado
                      ? 'bg-green-600 text-white shadow-green-900/20'
                      : estaGenerando
                        ? 'cursor-wait border border-white/10 bg-[#111] text-gray-500'
                        : 'border border-white/10 bg-white/[0.03] text-white hover:bg-red-600 hover:border-red-600'
                    }
                  `}
                >
                  {estaGenerando ? (
                    'Procesando datos...'
                  ) : fueGenerado ? (
                    <><CheckCircle2 size={14} /> Reporte compilado</>
                  ) : (
                    <><FileText size={14} /> Compilar reporte</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="relative flex h-auto flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-6 shadow-2xl">
          <div className="mb-1 flex items-center gap-2">
            <Clock size={16} className="text-gray-500" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Descargas Recientes</h4>
          </div>
          <p className="mb-4 text-[10px] text-gray-600">Archivos generados listos para descargar en PDF o Excel.</p>

          {errorDescarga && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[11px] font-semibold text-red-400">
              <AlertCircle size={14} />
              {errorDescarga}
            </div>
          )}

          <div className="custom-scrollbar max-h-[460px] w-full space-y-3 overflow-y-auto pr-1">
            {historialReportes.map((doc) => (
              <div key={doc.id} className="group flex w-full flex-col gap-3 rounded-xl border border-white/5 bg-[#111]/60 p-3 transition-colors hover:border-white/10 xl:flex-row xl:items-center xl:justify-between">
                <div className="w-full flex-1 overflow-hidden pr-1">
                  <p className="w-full truncate break-words text-xs font-bold text-white" title={doc.titulo}>
                    {doc.titulo}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-medium text-gray-500">
                    <span className="rounded bg-white/5 px-1 py-0.5 font-mono text-gray-400">{doc.id}</span>
                    <span>-</span>
                    <span>{doc.tamano}</span>
                    <span>-</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-red-500">{doc.formato}</span>
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Calendar size={10} />
                      {doc.fecha}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[9px] text-gray-600" title={doc.createdBy}>
                    Cuenta: {doc.createdBy}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={descargandoId === `${doc.id}-pdf`}
                    onClick={() => descargarReporte(doc, 'pdf')}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white/5 px-2.5 py-2 text-[10px] font-bold text-gray-300 transition-all hover:bg-red-600 hover:text-white disabled:cursor-wait disabled:opacity-60"
                    title="Descargar PDF"
                  >
                    <Download size={13} />
                    PDF
                  </button>
                  <button
                    type="button"
                    disabled={descargandoId === `${doc.id}-excel`}
                    onClick={() => descargarReporte(doc, 'excel')}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white/5 px-2.5 py-2 text-[10px] font-bold text-gray-300 transition-all hover:bg-green-600 hover:text-white disabled:cursor-wait disabled:opacity-60"
                    title="Descargar Excel"
                  >
                    <FileSpreadsheet size={13} />
                    Excel
                  </button>
                </div>
              </div>
            ))}
            {historialReportes.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-[#111]/60 p-8 text-center text-xs font-medium text-gray-500">
                Aun no hay reportes generados en esta sesion.
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3 text-[9px] font-medium text-gray-600">
            <AlertCircle size={12} />
            <span className="break-all">Los PDF incluyen logo, nombre del reporte, fecha y cuenta creadora.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
