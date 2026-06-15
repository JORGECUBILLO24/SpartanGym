import { jsPDF } from 'jspdf';
import { leerDatoLocal } from './almacenamientoLocal';
import { obtenerEtiquetaCuentaActual } from './cuentaActual';
import { CLAVE_CONFIGURACION } from './tema';

export { leerCuentaActual, obtenerEtiquetaCuentaActual } from './cuentaActual';

const configuracionPorDefecto = {
  gymName: 'Spartan Gym',
  email: 'admin@spartangym.com',
  currency: 'USD',
  theme: 'system',
};

export const leerConfiguracionGimnasio = () => ({
  ...configuracionPorDefecto,
  ...leerDatoLocal(CLAVE_CONFIGURACION, {}),
});

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

const contenidoReportes = {
  fin: {
    headers: ['Categoria', 'Periodo', 'Cantidad', 'Total', 'Detalle'],
    rows: [
      ['Efectivo cobrado', 'Mes actual', '32 pagos', '$1,180.00', 'Caja fisica conciliada por recepcion y validada en cierre diario'],
      ['Tarjeta de credito', 'Mes actual', '46 pagos', '$1,940.00', 'Operaciones POS con voucher y lote aprobado'],
      ['Tarjeta de debito', 'Mes actual', '25 pagos', '$970.00', 'Operaciones POS debitadas y conciliadas'],
      ['Tarjetas total', 'Mes actual', '71 pagos', '$2,910.00', 'Credito y debito agrupados para control bancario'],
      ['Transferencias', 'Mes actual', '18 pagos', '$760.00', 'Depositos, apps bancarias y comprobantes validados'],
      ['Ventas cobradas', 'Mes actual', '184 ventas', '$4,850.00', 'Membresias, productos, inscripciones y servicios adicionales'],
      ['Pagos pendientes', 'Corte actual', '17 pagos', '$320.00', 'Socios con comprobante pendiente o validacion de caja'],
      ['Egresos operativos', 'Mes actual', '14 movimientos', '$735.50', 'Mantenimiento, servicios, compras y ajustes aprobados'],
      ['Balance neto', 'Mes actual', 'Corte consolidado', '$4,114.50', 'Ingresos cobrados menos egresos operativos'],
    ],
    summary: [
      ['Ingresos cobrados', '$4,850.00'],
      ['Transacciones cobradas', '121 pagos'],
      ['Efectivo', '$1,180.00 / 32 pagos'],
      ['Tarjetas', '$2,910.00 / 71 pagos'],
      ['Ventas', '$4,850.00 / 184 ventas'],
      ['Balance neto', '$4,114.50'],
    ],
    detalles: [
      {
        titulo: 'Resumen por metodo de pago',
        headers: ['Metodo', 'Cantidad', 'Total cobrado', 'Promedio', 'Estado'],
        rows: [
          ['Efectivo', '32', '$1,180.00', '$36.88', 'Conciliado'],
          ['Tarjeta de credito', '46', '$1,940.00', '$42.17', 'Lote POS aprobado'],
          ['Tarjeta de debito', '25', '$970.00', '$38.80', 'Lote POS aprobado'],
          ['Tarjetas total', '71', '$2,910.00', '$40.99', 'Credito + debito'],
          ['Transferencias', '18', '$760.00', '$42.22', 'Comprobante validado'],
          ['Total pagos cobrados', '121', '$4,850.00', '$40.08', 'Cierre consolidado'],
        ],
      },
      {
        titulo: 'Ventas por concepto',
        headers: ['Concepto', 'Cantidad', 'Total vendido', 'Participacion', 'Detalle'],
        rows: [
          ['Membresias', '94 ventas', '$3,270.00', '67.4%', 'Planes mensuales, trimestrales, semestrales y anuales'],
          ['Venta de productos', '61 ventas', '$920.00', '19.0%', 'Suplementos, bebidas, accesorios y merch'],
          ['Inscripciones', '18 ventas', '$420.00', '8.7%', 'Altas de socios nuevos'],
          ['Servicios adicionales', '11 ventas', '$240.00', '4.9%', 'Evaluaciones, clases y servicios puntuales'],
          ['Total ventas', '184 ventas', '$4,850.00', '100%', 'Total cobrado del periodo'],
        ],
      },
      {
        titulo: 'Detalle de efectivo',
        headers: ['Caja / Turno', 'Pagos', 'Total', 'Responsable', 'Resultado'],
        rows: [
          ['Caja manana', '14', '$515.00', 'Recepcion turno manana', 'Cuadrada'],
          ['Caja tarde', '18', '$665.00', 'Recepcion turno tarde', 'Cuadrada'],
          ['Deposito preparado', '32', '$1,180.00', 'Administrador de caja', 'Listo para banco'],
        ],
      },
      {
        titulo: 'Detalle de tarjetas',
        headers: ['Tipo', 'Pagos', 'Total', 'Referencia', 'Resultado'],
        rows: [
          ['Credito', '46', '$1,940.00', 'Lote POS 0426', 'Aprobado'],
          ['Debito', '25', '$970.00', 'Lote POS 0427', 'Aprobado'],
          ['Total tarjetas', '71', '$2,910.00', 'POS consolidado', 'Listo para conciliacion bancaria'],
        ],
      },
      {
        titulo: 'Control operativo',
        headers: ['Punto', 'Estado', 'Monto / Conteo', 'Accion'],
        rows: [
          ['Caja recepcion', 'Cuadrada', '$1,180.00 / 32 pagos', 'Mantener corte diario firmado'],
          ['POS tarjetas', 'Conciliado', '$2,910.00 / 71 pagos', 'Archivar lote POS y voucher digital'],
          ['Transferencias', 'Validado', '$760.00 / 18 pagos', 'Adjuntar comprobantes al cierre'],
          ['Pagos pendientes', 'Atencion', '$320.00 / 17 pagos', 'Enviar recordatorio por SMS y correo'],
          ['Gastos aprobados', 'Controlado', '$735.50 / 14 movimientos', 'Adjuntar soportes en cierre semanal'],
        ],
      },
    ],
  },
  soc: {
    headers: ['Metrica', 'Resultado', 'Tendencia', 'Observacion'],
    rows: [
      ['Socios activos', '1,248', '+9.2%', 'Crecimiento sobre el mes anterior'],
      ['Nuevos registros', '86', '+24%', 'Alta respuesta a promociones'],
      ['Retencion', '92.3%', '+1.8%', 'Renovaciones por encima del objetivo'],
      ['Membresias renovadas', '312', '+7.4%', 'Plan anual con mayor estabilidad'],
      ['Bajas registradas', '18', '-3.1%', 'Principal motivo reportado: horarios'],
      ['Socios en riesgo', '44', 'Atencion', 'Sin asistencia en los ultimos 10 dias'],
    ],
    summary: [
      ['Retencion', '92.3%'],
      ['Altas', '86'],
      ['Bajas', '18'],
    ],
    detalles: [
      {
        titulo: 'Socios por sucursal',
        headers: ['Sucursal', 'Socios activos', 'Nuevos', 'Por vencer'],
        rows: [
          ['SpartanGym Central', '520', '34', '21'],
          ['SpartanGym Carretera Sur', '316', '19', '13'],
          ['SpartanGym Masaya', '248', '18', '9'],
          ['SpartanGym Leon', '164', '15', '7'],
        ],
      },
      {
        titulo: 'Membresias por plan',
        headers: ['Plan', 'Activas', 'Renovadas', 'Ingreso'],
        rows: [
          ['Mensual', '704', '178', '$2,640.00'],
          ['Anual', '286', '76', '$1,430.00'],
          ['Quincenal', '188', '46', '$540.00'],
          ['Diaria', '70', '12', '$240.00'],
        ],
      },
    ],
  },
  inv: {
    headers: ['Producto', 'Stock', 'Rotacion', 'Accion sugerida'],
    rows: [
      ['Proteina Spartan Whey', '18 unidades', 'Alta', 'Reabastecer en 7 dias'],
      ['Creatina Monohidratada', '9 unidades', 'Media', 'Mantener seguimiento semanal'],
      ['Bebidas energeticas', '42 unidades', 'Alta', 'Preparar promocion por volumen'],
      ['Guantes entrenamiento', '6 unidades', 'Baja', 'Revisar precio y ubicacion'],
      ['Cinturones de fuerza', '4 unidades', 'Media', 'Comprar reposicion preventiva'],
      ['Shaker Spartan', '0 unidades', 'Agotado', 'Bloquear venta hasta reabastecer'],
    ],
    summary: [
      ['Rotacion promedio', '4.2x'],
      ['Productos criticos', '3'],
      ['Margen inventario', '38%'],
    ],
    detalles: [
      {
        titulo: 'Stock por categoria',
        headers: ['Categoria', 'Productos', 'Unidades', 'Valor'],
        rows: [
          ['Suplementos', '4', '84', '$1,680.00'],
          ['Accesorios', '3', '28', '$420.00'],
          ['Merch', '2', '36', '$540.00'],
          ['Bebidas', '1', '42', '$126.00'],
        ],
      },
      {
        titulo: 'Alertas de compra',
        headers: ['Producto', 'Nivel', 'Proveedor', 'Fecha sugerida'],
        rows: [
          ['Shaker Spartan', 'Agotado', 'Proveedor Local', 'Hoy'],
          ['Cinturones de fuerza', 'Critico', 'Iron Supply', '72 horas'],
          ['Guantes entrenamiento', 'Bajo', 'Fit Pro', '7 dias'],
        ],
      },
    ],
  },
  asi: {
    headers: ['Bloque horario', 'Asistencias', 'Capacidad', 'Nota operativa'],
    rows: [
      ['05:00 - 07:00', '112', 'Alta', 'Refuerzo de recepcion recomendado'],
      ['07:00 - 10:00', '86', 'Media', 'Flujo estable'],
      ['12:00 - 14:00', '64', 'Media', 'Buen horario para clases express'],
      ['17:00 - 20:00', '178', 'Critica', 'Pico principal del dia'],
      ['20:00 - 22:00', '74', 'Media', 'Cierre sin saturacion'],
    ],
    summary: [
      ['Horas pico', '17:00 - 20:00'],
      ['Asistencias', '514'],
      ['Capacidad critica', '1 bloque'],
    ],
    detalles: [
      {
        titulo: 'Asistencia por sucursal',
        headers: ['Sucursal', 'Asistencias', 'Pico', 'Observacion'],
        rows: [
          ['SpartanGym Central', '214', '18:30', 'Mayor demanda de peso libre'],
          ['SpartanGym Carretera Sur', '126', '17:45', 'Refuerzo en recepcion'],
          ['SpartanGym Masaya', '98', '19:00', 'Flujo estable'],
          ['SpartanGym Leon', '76', '06:15', 'Buen movimiento matutino'],
        ],
      },
      {
        titulo: 'Personal en turno',
        headers: ['Rol', 'Presentes', 'Ausencias', 'Accion'],
        rows: [
          ['Recepcion', '4', '0', 'Cobertura completa'],
          ['Entrenadores', '7', '1', 'Reasignar rutina de fuerza'],
          ['Limpieza', '3', '0', 'Mantener rondas por bloque'],
        ],
      },
    ],
  },
};

export const crearContenidoReporte = (idReporte) => contenidoReportes[idReporte] || contenidoReportes.fin;

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
    const debeRecortarLogo = imagen.width / imagen.height < 2.2;

    if (!debeRecortarLogo) {
      return { dataUrl, width: imagen.width, height: imagen.height };
    }

    const recorte = {
      sx: imagen.width * 0.06,
      sy: imagen.height * 0.17,
      sw: imagen.width * 0.88,
      sh: imagen.height * 0.52,
    };
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(recorte.sw);
    canvas.height = Math.round(recorte.sh);
    const contexto = canvas.getContext('2d');

    contexto.drawImage(
      imagen,
      recorte.sx,
      recorte.sy,
      recorte.sw,
      recorte.sh,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    };
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

const dibujarTablaPdf = (pdf, { titulo, headers = [], rows = [], yInicial, margen, anchoPagina, altoPagina }) => {
  let y = yInicial;
  const anchoDisponible = anchoPagina - margen * 2;
  const anchoColumna = anchoDisponible / Math.max(headers.length, 1);

  const asegurarEspacio = (altura) => {
    if (y + altura > altoPagina - 58) {
      pdf.addPage();
      y = 54;
    }
  };

  const dibujarEncabezado = () => {
    asegurarEspacio(30);
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
  };

  if (titulo) {
    asegurarEspacio(44);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(17, 24, 39);
    pdf.text(titulo, margen, y, { maxWidth: anchoDisponible });
    y += 22;
  }

  dibujarEncabezado();

  rows.forEach((fila, indiceFila) => {
    const lineasCelda = headers.map((_, indiceColumna) =>
      pdf.splitTextToSize(String(fila[indiceColumna] ?? ''), anchoColumna - 14)
    );
    const altoFila = Math.max(34, Math.max(...lineasCelda.map((lineas) => lineas.length)) * 11 + 18);

    if (y + altoFila > altoPagina - 58) {
      pdf.addPage();
      y = 54;
      dibujarEncabezado();
    }

    if (indiceFila % 2 === 0) {
      pdf.setFillColor(255, 255, 255);
    } else {
      pdf.setFillColor(249, 250, 251);
    }
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
  const configuracion = leerConfiguracionGimnasio();
  const creadoEn = formatearFechaReporte(reporte.createdAt);
  const creadoPor = reporte.createdBy || obtenerEtiquetaCuentaActual();
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
  pdf.text(reporte.titulo, margen, y, { maxWidth: anchoPagina - margen * 2 });

  y += 26;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  pdf.text(`Tipo: ${reporte.tipo || 'General'}`, margen, y);
  y += 28;

  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(margen, y, anchoPagina - margen * 2, 84, 8, 8, 'FD');
  pdf.setFontSize(9);

  [
    ['Nombre del reporte', reporte.titulo],
    ['Fecha', creadoEn],
    ['Creado desde la cuenta', creadoPor],
    ['Identificador', reporte.id],
  ].forEach(([etiqueta, valor], indice) => {
    const filaY = y + 20 + indice * 16;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text(`${etiqueta}:`, margen + 18, filaY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text(String(valor), margen + 142, filaY, { maxWidth: anchoPagina - margen * 2 - 160 });
  });

  y += 116;

  if (reporte.summary?.length) {
    const columnasResumen = Math.min(3, reporte.summary.length);
    const filasResumen = Math.ceil(reporte.summary.length / columnasResumen);
    const separacionTarjetas = 10;
    const anchoTarjeta = (anchoPagina - margen * 2 - separacionTarjetas * (columnasResumen - 1)) / columnasResumen;
    const altoTarjeta = 58;

    reporte.summary.forEach(([etiqueta, valor], indice) => {
      const columna = indice % columnasResumen;
      const fila = Math.floor(indice / columnasResumen);
      const x = margen + columna * (anchoTarjeta + separacionTarjetas);
      const tarjetaY = y + fila * (altoTarjeta + separacionTarjetas);

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(229, 231, 235);
      pdf.roundedRect(x, tarjetaY, anchoTarjeta, altoTarjeta, 8, 8, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(String(etiqueta).toUpperCase(), x + 12, tarjetaY + 18, { maxWidth: anchoTarjeta - 24 });
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(17, 24, 39);
      pdf.text(String(valor), x + 12, tarjetaY + 42, { maxWidth: anchoTarjeta - 24 });
    });

    y += filasResumen * (altoTarjeta + separacionTarjetas) + 18;
  }

  y = dibujarTablaPdf(pdf, {
    titulo: 'Detalle principal',
    headers: reporte.headers || [],
    rows: reporte.rows || [],
    yInicial: y,
    margen,
    anchoPagina,
    altoPagina,
  });

  (reporte.detalles || []).forEach((seccion) => {
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
  pdf.save(construirNombreArchivo(reporte, 'pdf'));
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
  const configuracion = leerConfiguracionGimnasio();
  const creadoEn = formatearFechaReporte(reporte.createdAt);
  const creadoPor = reporte.createdBy || obtenerEtiquetaCuentaActual();

  const tablaMetadatos = crearTablaHtml({
    titulo: 'Informacion del reporte',
    headers: ['Campo', 'Valor'],
    rows: [
      ['Gimnasio', configuracion.gymName],
      ['Nombre del reporte', reporte.titulo],
      ['Fecha', creadoEn],
      ['Creado desde la cuenta', creadoPor],
      ['Identificador', reporte.id],
      ['Tipo', reporte.tipo || 'General'],
    ],
    clase: 'tabla-meta',
  });

  const tablaResumen = crearTablaHtml({
    titulo: 'Resumen ejecutivo',
    headers: ['Indicador', 'Valor'],
    rows: reporte.summary || [],
    clase: 'tabla-resumen',
  });

  const tablaPrincipal = crearTablaHtml({
    titulo: 'Detalle principal',
    headers: reporte.headers || [],
    rows: reporte.rows || [],
  });

  const tablasDetalle = (reporte.detalles || [])
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
          <h1>${escaparHtml(reporte.titulo)}</h1>
          <p>${escaparHtml(configuracion.gymName)} | ${escaparHtml(creadoEn)} | ${escaparHtml(creadoPor)}</p>
        </div>
        ${tablaMetadatos}
        ${tablaResumen}
        ${tablaPrincipal}
        ${tablasDetalle}
        <p class="nota">Archivo generado desde Spartan Gym Web. Las tablas estan separadas por seccion para facilitar filtros y revisiones en Excel.</p>
      </body>
    </html>
  `;

  descargarBlob(new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), construirNombreArchivo(reporte, 'xls'));
};
