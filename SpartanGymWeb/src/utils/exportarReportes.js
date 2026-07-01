import { convertirTextoMoneda, leerConfiguracionApp } from './configuracionApp';
import { obtenerEtiquetaCuentaActual } from './cuentaActual';

export { leerCuentaActual, obtenerEtiquetaCuentaActual } from './cuentaActual';

export const leerConfiguracionGimnasio = () => leerConfiguracionApp();

const normalizarFecha = (fechaEntrada) => {
  const fecha = fechaEntrada ? new Date(fechaEntrada) : new Date();

  return Number.isNaN(fecha.getTime()) ? new Date() : fecha;
};

export const formatearFechaReporte = (fechaEntrada = new Date()) =>
  new Intl.DateTimeFormat('es-NI', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(normalizarFecha(fechaEntrada));

export const formatearFechaCortaReporte = (fechaEntrada = new Date()) =>
  new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(normalizarFecha(fechaEntrada));

const convertirCeldaMoneda = (valor) => (typeof valor === 'string' ? convertirTextoMoneda(valor) : valor);

const convertirFilasMoneda = (filas = []) =>
  filas.map((fila) => fila.map(convertirCeldaMoneda));

const convertirContenidoMoneda = (contenido = {}) => ({
  ...contenido,
  rows: convertirFilasMoneda(contenido.rows || []),
  summary: convertirFilasMoneda(contenido.summary || []),
  detalles: (contenido.detalles || []).map((seccion) => ({
    ...seccion,
    rows: convertirFilasMoneda(seccion.rows || []),
  })),
});

const escaparHtml = (valor) =>
  String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const crearSlug = (valor) =>
  String(valor ?? 'reporte')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70) || 'reporte';

const descargarBlob = (blob, nombreArchivo) => {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
};

const construirNombreArchivo = (reporte, extension) => {
  const fecha = normalizarFecha(reporte.createdAt).toISOString().slice(0, 10);

  return `${crearSlug(reporte.titulo)}-${fecha}.${extension}`;
};

const leerBlobComoDataUrl = (blob) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = rechazar;
    lector.readAsDataURL(blob);
  });

const cargarElementoImagen = (dataUrl) =>
  new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = rechazar;
    imagen.src = dataUrl;
  });

const cargarLogoParaPdf = async (urlImagen) => {
  if (!urlImagen) return null;

  try {
    const respuesta = await fetch(urlImagen);
    const blob = await respuesta.blob();
    const dataUrl = await leerBlobComoDataUrl(blob);
    const imagen = await cargarElementoImagen(dataUrl);

    return { dataUrl, width: imagen.width, height: imagen.height };
  } catch {
    return null;
  }
};

const agregarImagenContenida = (pdf, imagen, x, y, anchoMaximo, altoMaximo) => {
  const proporcion = imagen.width / imagen.height;
  let ancho = anchoMaximo;
  let alto = ancho / proporcion;

  if (alto > altoMaximo) {
    alto = altoMaximo;
    ancho = alto * proporcion;
  }

  const desplazamientoX = (anchoMaximo - ancho) / 2;
  const desplazamientoY = (altoMaximo - alto) / 2;

  pdf.addImage(imagen.dataUrl, 'PNG', x + desplazamientoX, y + desplazamientoY, ancho, alto, undefined, 'FAST');
};

const agregarPiePdf = (pdf) => {
  const totalPaginas = pdf.getNumberOfPages();
  const anchoPagina = pdf.internal.pageSize.getWidth();
  const altoPagina = pdf.internal.pageSize.getHeight();

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    pdf.setPage(pagina);
    pdf.setDrawColor(229, 231, 235);
    pdf.line(42, altoPagina - 42, anchoPagina - 42, altoPagina - 42);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Pagina ${pagina} de ${totalPaginas}`, anchoPagina - 42, altoPagina - 26, {
      align: 'right',
    });
  }
};

const asegurarPagina = (pdf, y, altoNecesario, altoPagina) => {
  if (y + altoNecesario <= altoPagina - 58) return y;

  pdf.addPage();
  return 54;
};

const dibujarTablaPdf = (pdf, { titulo, headers = [], rows = [], yInicial, margen, anchoPagina, altoPagina }) => {
  if (!headers.length && !rows.length) return yInicial;

  let y = yInicial;
  const anchoDisponible = anchoPagina - margen * 2;
  const anchoColumna = anchoDisponible / Math.max(headers.length, 1);

  if (titulo) {
    y = asegurarPagina(pdf, y, 36, altoPagina);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(17, 24, 39);
    pdf.text(titulo, margen, y, { maxWidth: anchoDisponible });
    y += 22;
  }

  if (headers.length) {
    y = asegurarPagina(pdf, y, 30, altoPagina);
    pdf.setFillColor(229, 9, 20);
    pdf.rect(margen, y, anchoDisponible, 28, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    headers.forEach((encabezado, indice) => {
      pdf.text(String(encabezado).toUpperCase(), margen + indice * anchoColumna + 8, y + 18, {
        maxWidth: anchoColumna - 14,
      });
    });
    y += 28;
  }

  rows.forEach((fila, indiceFila) => {
    const lineasCelda = headers.map((_, indiceColumna) =>
      pdf.splitTextToSize(String(fila[indiceColumna] ?? ''), anchoColumna - 14)
    );
    const altoFila = Math.max(34, Math.max(1, ...lineasCelda.map((lineas) => lineas.length)) * 11 + 18);

    y = asegurarPagina(pdf, y, altoFila, altoPagina);
    pdf.setFillColor(indiceFila % 2 === 0 ? 255 : 249, indiceFila % 2 === 0 ? 255 : 250, indiceFila % 2 === 0 ? 255 : 251);
    pdf.rect(margen, y, anchoDisponible, altoFila, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margen, y + altoFila, anchoPagina - margen, y + altoFila);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(31, 41, 55);

    lineasCelda.forEach((lineas, indiceColumna) => {
      pdf.text(lineas, margen + indiceColumna * anchoColumna + 8, y + 18);
    });

    y += altoFila;
  });

  return y + 24;
};

export const exportarReportePdf = async (reporte, logoUrl) => {
  const { jsPDF } = await import('jspdf');
  const reporteMoneda = convertirContenidoMoneda(reporte);
  const configuracion = leerConfiguracionGimnasio();
  const creadoEn = formatearFechaReporte(reporteMoneda.createdAt);
  const creadoPor = reporteMoneda.createdBy || obtenerEtiquetaCuentaActual();
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const anchoPagina = pdf.internal.pageSize.getWidth();
  const altoPagina = pdf.internal.pageSize.getHeight();
  const margen = 42;
  const logo = await cargarLogoParaPdf(logoUrl);
  let y = 128;

  pdf.setFillColor(8, 8, 9);
  pdf.rect(0, 0, anchoPagina, 94, 'F');
  pdf.setFillColor(229, 9, 20);
  pdf.rect(0, 92, anchoPagina, 3, 'F');

  if (logo) {
    agregarImagenContenida(pdf, logo, margen, 18, 132, 54);
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text(configuracion.gymName, margen, 48);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(configuracion.gymName, anchoPagina - margen, 38, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(209, 213, 219);
  pdf.text(configuracion.email, anchoPagina - margen, 56, { align: 'right' });

  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(reporteMoneda.titulo, margen, y, { maxWidth: anchoPagina - margen * 2 });

  y += 26;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  pdf.text(`Tipo: ${reporteMoneda.tipo || 'General'}`, margen, y);
  y += 28;

  const metadatos = [
    ['Nombre del reporte', reporteMoneda.titulo],
    ['Fecha', creadoEn],
    ['Creado desde la cuenta', creadoPor],
    ['Identificador', reporteMoneda.id],
  ];

  y = dibujarTablaPdf(pdf, {
    titulo: 'Informacion del reporte',
    headers: ['Campo', 'Valor'],
    rows: metadatos,
    yInicial: y,
    margen,
    anchoPagina,
    altoPagina,
  });

  if (reporteMoneda.summary?.length) {
    y = dibujarTablaPdf(pdf, {
      titulo: 'Resumen ejecutivo',
      headers: ['Indicador', 'Valor'],
      rows: reporteMoneda.summary,
      yInicial: y,
      margen,
      anchoPagina,
      altoPagina,
    });
  }

  y = dibujarTablaPdf(pdf, {
    titulo: 'Detalle principal',
    headers: reporteMoneda.headers || [],
    rows: reporteMoneda.rows || [],
    yInicial: y,
    margen,
    anchoPagina,
    altoPagina,
  });

  (reporteMoneda.detalles || []).forEach((seccion) => {
    y = dibujarTablaPdf(pdf, {
      titulo: seccion.titulo,
      headers: seccion.headers,
      rows: seccion.rows,
      yInicial: y,
      margen,
      anchoPagina,
      altoPagina,
    });
  });

  agregarPiePdf(pdf);
  pdf.save(construirNombreArchivo(reporteMoneda, 'pdf'));
};

const crearFilaHtml = (fila, tipoCelda = 'td') =>
  `<tr>${fila.map((celda) => `<${tipoCelda}>${escaparHtml(celda)}</${tipoCelda}>`).join('')}</tr>`;

const crearTablaHtml = ({ titulo, headers = [], rows = [], clase = 'tabla-datos' }) => `
  <table class="${clase}">
    <tr class="titulo-tabla"><td colspan="${Math.max(headers.length, 1)}">${escaparHtml(titulo)}</td></tr>
    ${headers.length ? crearFilaHtml(headers, 'th') : ''}
    ${rows.map((fila) => crearFilaHtml(fila)).join('')}
  </table>
`;

export const exportarReporteExcel = (reporte) => {
  const reporteMoneda = convertirContenidoMoneda(reporte);
  const configuracion = leerConfiguracionGimnasio();
  const creadoEn = formatearFechaReporte(reporteMoneda.createdAt);
  const creadoPor = reporteMoneda.createdBy || obtenerEtiquetaCuentaActual();

  const tablaMetadatos = crearTablaHtml({
    titulo: 'Informacion del reporte',
    headers: ['Campo', 'Valor'],
    rows: [
      ['Gimnasio', configuracion.gymName],
      ['Nombre del reporte', reporteMoneda.titulo],
      ['Fecha', creadoEn],
      ['Creado desde la cuenta', creadoPor],
      ['Identificador', reporteMoneda.id],
      ['Tipo', reporteMoneda.tipo || 'General'],
    ],
    clase: 'tabla-meta',
  });

  const tablaResumen = crearTablaHtml({
    titulo: 'Resumen ejecutivo',
    headers: ['Indicador', 'Valor'],
    rows: reporteMoneda.summary || [],
    clase: 'tabla-resumen',
  });

  const tablaPrincipal = crearTablaHtml({
    titulo: 'Detalle principal',
    headers: reporteMoneda.headers || [],
    rows: reporteMoneda.rows || [],
  });

  const tablasDetalle = (reporteMoneda.detalles || [])
    .map((seccion) => crearTablaHtml({
      titulo: seccion.titulo,
      headers: seccion.headers,
      rows: seccion.rows,
    }))
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #111827; }
          .encabezado { background: #080809; color: #ffffff; padding: 18px; border-bottom: 4px solid #e50914; }
          .encabezado h1 { margin: 0; font-size: 22px; }
          .encabezado p { margin: 6px 0 0; color: #d1d5db; font-size: 12px; }
          table { border-collapse: collapse; margin: 16px 0 22px; min-width: 720px; }
          th, td { border: 1px solid #d9dde5; padding: 9px 10px; mso-number-format:"\\@"; font-size: 12px; }
          th { background: #e50914; color: #ffffff; font-weight: 700; text-transform: uppercase; }
          .titulo-tabla td { background: #111827; color: #ffffff; font-size: 14px; font-weight: 700; }
          .tabla-meta th { background: #374151; }
          .tabla-meta td:first-child, .tabla-resumen td:first-child { background: #f3f4f6; font-weight: 700; }
          .tabla-resumen th { background: #16a34a; }
          .tabla-datos tr:nth-child(even) td { background: #f9fafb; }
          .nota { color: #6b7280; font-size: 11px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="encabezado">
          <h1>${escaparHtml(reporteMoneda.titulo)}</h1>
          <p>${escaparHtml(configuracion.gymName)} | ${escaparHtml(creadoEn)} | ${escaparHtml(creadoPor)}</p>
        </div>
        ${tablaMetadatos}
        ${tablaResumen}
        ${tablaPrincipal}
        ${tablasDetalle}
        <p class="nota">Archivo generado desde Spartan Gym Web con datos devueltos por la API.</p>
      </body>
    </html>
  `;

  descargarBlob(new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), construirNombreArchivo(reporteMoneda, 'xls'));
};
