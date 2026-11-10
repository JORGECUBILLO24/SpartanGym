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
  Users,
} from 'lucide-react';
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
    titulo: 'Reporte financiero consolidado',
    desc: 'Ingresos, egresos, métodos de pago y balance neto del gimnasio.',
    icon: DollarSign,
  },
  {
    id: 'soc',
    tipo: 'Socios',
    titulo: 'Análisis de socios y retención',
    desc: 'Altas, renovaciones, membresías vencidas y actividad de asistencia.',
    icon: Users,
  },
  {
    id: 'inv',
    tipo: 'Inventario',
    titulo: 'Auditoría de inventario y stock',
    desc: 'Existencias, alertas de stock y ventas recientes de productos.',
    icon: Package,
  },
  {
    id: 'asi',
    tipo: 'Asistencia',
    titulo: 'Control de asistencia y horarios',
    desc: 'Check-ins, membresías activas y hora de mayor asistencia.',
    icon: Clock,
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
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);
  const logos = obtenerLogosApp(configuracion);

  useEffect(() => {
    reportesApi.resumen()
      .then((datos) => setResumen({ ...resumenInicial, ...datos }))
      .catch(() => setErrorDescarga('No se pudo cargar el resumen desde la API. Inténtalo de nuevo.'))
      .finally(() => setCargandoResumen(false));
  }, []);

  const generarReporte = async (reporteBase) => {
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
      setErrorDescarga(error.message || 'No se pudo generar el reporte desde la API. Inténtalo de nuevo.');
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
        const logoReporte = logos.principal;
        await exportarReportePdf(reporte, logoReporte);
      } else {
        exportarReporteExcel(reporte);
      }
    } catch (error) {
      console.error(error);
      setErrorDescarga('No se pudo generar el archivo. Inténtalo de nuevo.');
    } finally {
      setDescargandoId(null);
    }
  };

  return (
    <div className="workspace-page report-page pb-4 text-white">
      <section className="report-page-heading" aria-labelledby="report-page-title">
        <div>
          <h2 id="report-page-title">Centro de reportes</h2>
          <p>Consulta la actividad del gimnasio y genera archivos listos para compartir.</p>
        </div>
        <span className="report-page-count"><BarChart3 size={15} /> {tiposReportes.length} análisis</span>
      </section>

      <section className="report-overview" aria-labelledby="report-overview-title" aria-busy={cargandoResumen}>
        <div className="report-section-heading">
          <div>
            <h3 id="report-overview-title">Panorama actual</h3>
            <p>Indicadores consolidados del sistema</p>
          </div>
        </div>
        <dl className="report-metric-strip">
          <div className="report-metric">
            <dt>Ingresos</dt>
            <dd>{cargandoResumen ? '—' : formatearMonto(resumen.ingresosTotales)}</dd>
            <span>Pagos registrados</span>
          </div>
          <div className="report-metric">
            <dt>Socios</dt>
            <dd>{cargandoResumen ? '—' : resumen.totalSocios}</dd>
            <span>En la base actual</span>
          </div>
          <div className="report-metric">
            <dt>Asistencias</dt>
            <dd>{cargandoResumen ? '—' : resumen.asistenciasRegistradas}</dd>
            <span>Check-ins guardados</span>
          </div>
          <div className="report-metric">
            <dt>Retención</dt>
            <dd>{cargandoResumen ? '—' : `${resumen.tasaRetencion}%`}</dd>
            <span>{cargandoResumen ? 'Cargando membresías…' : `${resumen.membresiasActivas} membresías activas`}</span>
          </div>
        </dl>
      </section>

      <div className="report-content-grid">
        <section className="report-catalog" aria-labelledby="report-catalog-title">
          <div className="report-section-heading">
            <div>
              <h3 id="report-catalog-title">Reportes disponibles</h3>
              <p>Elige un análisis para preparar sus archivos.</p>
            </div>
            <span className="report-section-count">{String(tiposReportes.length).padStart(2, '0')}</span>
          </div>

          <div className="report-option-list">
            {tiposReportes.map((rep) => {
              const IconComponent = rep.icon;
              const estaGenerando = generandoId === rep.id;
              const fueGenerado = reportesDescargados.includes(rep.id);

              return (
                <article key={rep.id} className={`report-option report-option--${rep.id}`} aria-busy={estaGenerando}>
                  <span className="report-option-icon"><IconComponent size={18} aria-hidden="true" /></span>
                  <div className="report-option-copy">
                    <span className="report-option-category">{rep.tipo}</span>
                    <h4>{rep.titulo}</h4>
                    <p>{rep.desc}</p>
                  </div>
                  <button
                    type="button"
                    disabled={generandoId !== null}
                    onClick={() => generarReporte(rep)}
                    className={`report-generate-button${fueGenerado ? ' is-generated' : ''}`}
                    aria-label={`${estaGenerando ? 'Generando' : fueGenerado ? 'Reporte generado' : 'Generar'} ${rep.titulo}`}
                  >
                    {estaGenerando ? <Clock size={14} aria-hidden="true" /> : fueGenerado ? <CheckCircle2 size={14} aria-hidden="true" /> : <ArrowUpRight size={14} aria-hidden="true" />}
                    <span>{estaGenerando ? 'Generando…' : fueGenerado ? 'Listo' : 'Generar'}</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="report-history" aria-labelledby="report-history-title">
          <div className="report-section-heading">
            <div>
              <h3 id="report-history-title">Descargas recientes</h3>
              <p>Archivos preparados durante esta sesión</p>
            </div>
            <span className="report-section-count">{historialReportes.length}</span>
          </div>

          {errorDescarga && (
            <div className="report-error" role="alert" aria-live="polite">
              <AlertCircle size={15} aria-hidden="true" />
              <span>{errorDescarga}</span>
            </div>
          )}

          {historialReportes.length > 0 ? (
            <div className="report-history-list">
              {historialReportes.map((doc) => (
                <article key={doc.id} className="report-history-row">
                  <div className="report-history-copy">
                    <p className="report-history-title" title={doc.titulo}>{doc.titulo}</p>
                    <div className="report-history-meta">
                      <span>{doc.tipo}</span>
                      <span className="report-history-separator" aria-hidden="true">·</span>
                      <span className="report-history-date"><Calendar size={11} aria-hidden="true" /> {doc.fecha}</span>
                    </div>
                    <p className="report-history-id" title={`${doc.id} · ${doc.createdBy}`}>{doc.id} · {doc.createdBy}</p>
                  </div>
                  <div className="report-history-actions">
                    <button
                      type="button"
                      disabled={descargandoId === `${doc.id}-pdf`}
                      onClick={() => descargarReporte(doc, 'pdf')}
                      className="report-download-button"
                      aria-label={`Descargar ${doc.titulo} en PDF`}
                    >
                      <Download size={13} aria-hidden="true" />
                      <span>{descargandoId === `${doc.id}-pdf` ? 'Preparando…' : 'PDF'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={descargandoId === `${doc.id}-excel`}
                      onClick={() => descargarReporte(doc, 'excel')}
                      className="report-download-button"
                      aria-label={`Descargar ${doc.titulo} en Excel`}
                    >
                      <FileSpreadsheet size={13} aria-hidden="true" />
                      <span>{descargandoId === `${doc.id}-excel` ? 'Preparando…' : 'Excel'}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="report-empty-state">
              <span><FileText size={20} aria-hidden="true" /></span>
              <p>Aún no hay archivos preparados.</p>
              <small>Genera uno de los reportes para habilitar sus descargas en PDF y Excel.</small>
            </div>
          )}

          <div className="report-history-note">
            <FileText size={13} aria-hidden="true" />
            <span>Los PDF incluyen la marca, fecha y cuenta que generó el archivo.</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reportes;
