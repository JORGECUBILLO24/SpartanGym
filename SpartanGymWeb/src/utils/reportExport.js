import { jsPDF } from 'jspdf';

export const SETTINGS_STORAGE_KEY = 'spartanGym.settings';
export const CURRENT_ACCOUNT_STORAGE_KEY = 'spartanGym.currentAccount';

const defaultSettings = {
  gymName: 'Spartan Gym',
  email: 'admin@spartangym.com',
  currency: 'USD',
  theme: 'dark',
};

const safeJsonParse = (value, fallback = {}) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const readGymSettings = () => {
  if (typeof window === 'undefined') return defaultSettings;

  return {
    ...defaultSettings,
    ...safeJsonParse(window.localStorage.getItem(SETTINGS_STORAGE_KEY), {}),
  };
};

export const readCurrentAccount = () => {
  if (typeof window === 'undefined') {
    return { username: 'admin@spartangym.com', role: 'Administrador' };
  }

  return safeJsonParse(window.localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY), {
    username: 'admin@spartangym.com',
    role: 'Administrador',
  });
};

export const getCurrentAccountLabel = () => {
  const account = readCurrentAccount();
  const username = account.username || account.email || account.name || 'Cuenta local';
  const role = account.role ? ` (${account.role})` : '';

  return `${username}${role}`;
};

const normalizeDate = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const formatReportDate = (dateInput = new Date()) =>
  new Intl.DateTimeFormat('es-NI', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(normalizeDate(dateInput));

export const formatShortReportDate = (dateInput = new Date()) =>
  new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(normalizeDate(dateInput));

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const slugify = (value) =>
  String(value ?? 'reporte')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70) || 'reporte';

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const buildFilename = (report, extension) => {
  const date = normalizeDate(report.createdAt).toISOString().slice(0, 10);
  return `${slugify(report.titulo)}-${date}.${extension}`;
};

export const createReportContent = (reportId) => {
  const content = {
    fin: {
      headers: ['Indicador', 'Periodo', 'Valor', 'Detalle'],
      rows: [
        ['Ingresos por membresias', 'Mes actual', '$4,850.00', '84 transacciones registradas'],
        ['Egresos operativos', 'Mes actual', '$735.50', 'Mantenimiento, servicios y compras'],
        ['Balance neto', 'Mes actual', '$4,114.50', 'Margen neto estimado de 82.4%'],
        ['Metodo principal', 'Mes actual', 'Tarjetas', '60% de pagos procesados'],
        ['Pagos pendientes', 'Corte actual', '$320.00', '17 socios requieren validacion'],
      ],
      summary: [
        ['Balance', '$4,114.50'],
        ['Ingresos', '$4,850.00'],
        ['Egresos', '$735.50'],
      ],
    },
    soc: {
      headers: ['Metrica', 'Resultado', 'Tendencia', 'Observacion'],
      rows: [
        ['Socios activos', '1,248', '+9.2%', 'Crecimiento sobre el mes anterior'],
        ['Nuevos registros', '86', '+24%', 'Alta respuesta a promociones'],
        ['Retencion', '92.3%', '+1.8%', 'Renovaciones por encima del objetivo'],
        ['Membresias renovadas', '312', '+7.4%', 'Plan anual con mayor estabilidad'],
        ['Bajas registradas', '18', '-3.1%', 'Principal motivo: horarios'],
      ],
      summary: [
        ['Retencion', '92.3%'],
        ['Altas', '86'],
        ['Bajas', '18'],
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
      ],
      summary: [
        ['Rotacion promedio', '4.2x'],
        ['Productos criticos', '3'],
        ['Margen inventario', '38%'],
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
    },
  };

  return content[reportId] || content.fin;
};

const loadImageAsDataUrl = async (imageUrl) => {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const addPdfFooter = (pdf) => {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(229, 231, 235);
    pdf.line(42, pageHeight - 42, pageWidth - 42, pageHeight - 42);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Pagina ${page} de ${pageCount}`, pageWidth - 42, pageHeight - 26, {
      align: 'right',
    });
  }
};

export const exportReportToPdf = async (report, logoUrl) => {
  const settings = readGymSettings();
  const createdAt = formatReportDate(report.createdAt);
  const createdBy = report.createdBy || getCurrentAccountLabel();
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 42;
  const logoData = await loadImageAsDataUrl(logoUrl);
  const tableHeaders = report.headers || [];
  const tableRows = report.rows || [];
  let y = 128;

  pdf.setFillColor(8, 8, 9);
  pdf.rect(0, 0, pageWidth, 94, 'F');
  pdf.setFillColor(229, 9, 20);
  pdf.rect(0, 92, pageWidth, 3, 'F');

  if (logoData) {
    pdf.addImage(logoData, 'PNG', margin, 22, 118, 44, undefined, 'FAST');
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text(settings.gymName, margin, 48);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(settings.gymName, pageWidth - margin, 38, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(209, 213, 219);
  pdf.text(settings.email, pageWidth - margin, 56, { align: 'right' });

  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(report.titulo, margin, y, { maxWidth: pageWidth - margin * 2 });

  y += 26;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  pdf.text(`Tipo: ${report.tipo || 'General'}`, margin, y);
  y += 28;

  pdf.setFillColor(249, 250, 251);
  pdf.setDrawColor(229, 231, 235);
  pdf.roundedRect(margin, y, pageWidth - margin * 2, 84, 8, 8, 'FD');
  pdf.setFontSize(9);

  const metadata = [
    ['Nombre del reporte', report.titulo],
    ['Fecha', createdAt],
    ['Creado desde la cuenta', createdBy],
    ['Identificador', report.id],
  ];

  metadata.forEach(([label, value], index) => {
    const rowY = y + 20 + index * 16;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text(`${label}:`, margin + 18, rowY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text(String(value), margin + 142, rowY, { maxWidth: pageWidth - margin * 2 - 160 });
  });

  y += 116;

  if (report.summary?.length) {
    const cardWidth = (pageWidth - margin * 2 - 20) / 3;
    report.summary.slice(0, 3).forEach(([label, value], index) => {
      const x = margin + index * (cardWidth + 10);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(229, 231, 235);
      pdf.roundedRect(x, y, cardWidth, 54, 8, 8, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(String(label).toUpperCase(), x + 12, y + 18);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(17, 24, 39);
      pdf.text(String(value), x + 12, y + 38, { maxWidth: cardWidth - 24 });
    });
    y += 78;
  }

  const availableWidth = pageWidth - margin * 2;
  const columnWidth = availableWidth / Math.max(tableHeaders.length, 1);

  const drawHeader = () => {
    pdf.setFillColor(229, 9, 20);
    pdf.rect(margin, y, availableWidth, 28, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);

    tableHeaders.forEach((header, index) => {
      pdf.text(String(header).toUpperCase(), margin + index * columnWidth + 8, y + 18, {
        maxWidth: columnWidth - 14,
      });
    });

    y += 28;
  };

  drawHeader();

  tableRows.forEach((row, rowIndex) => {
    const cellLines = tableHeaders.map((_, columnIndex) =>
      pdf.splitTextToSize(String(row[columnIndex] ?? ''), columnWidth - 14)
    );
    const rowHeight = Math.max(34, Math.max(...cellLines.map((lines) => lines.length)) * 11 + 18);

    if (y + rowHeight > pageHeight - 58) {
      pdf.addPage();
      y = 54;
      drawHeader();
    }

    pdf.setFillColor(rowIndex % 2 === 0 ? 255 : 249, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 251);
    pdf.rect(margin, y, availableWidth, rowHeight, 'F');
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(31, 41, 55);

    cellLines.forEach((lines, columnIndex) => {
      pdf.text(lines, margin + columnIndex * columnWidth + 8, y + 18);
    });

    y += rowHeight;
  });

  addPdfFooter(pdf);
  pdf.save(buildFilename(report, 'pdf'));
};

export const exportReportToExcel = (report) => {
  const settings = readGymSettings();
  const createdAt = formatReportDate(report.createdAt);
  const createdBy = report.createdBy || getCurrentAccountLabel();
  const headers = report.headers || [];
  const rows = report.rows || [];

  const metadataRows = [
    ['Gimnasio', settings.gymName],
    ['Nombre del reporte', report.titulo],
    ['Fecha', createdAt],
    ['Creado desde la cuenta', createdBy],
    ['Identificador', report.id],
    [],
  ];

  const tableRows = [
    ...metadataRows,
    headers,
    ...rows,
  ];

  const htmlRows = tableRows
    .map((row) => (
      `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
    ))
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; }
          td { border: 1px solid #d9dde5; padding: 8px; mso-number-format:"\\@"; }
          tr:nth-child(1) td, tr:nth-child(2) td, tr:nth-child(3) td, tr:nth-child(4) td, tr:nth-child(5) td {
            font-weight: 700;
            background: #f3f4f6;
          }
          tr:nth-child(7) td {
            font-weight: 700;
            color: #ffffff;
            background: #e50914;
          }
        </style>
      </head>
      <body>
        <table>${htmlRows}</table>
      </body>
    </html>
  `;

  downloadBlob(new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), buildFilename(report, 'xls'));
};
