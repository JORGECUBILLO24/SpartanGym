import { Download, Printer, Receipt, X } from 'lucide-react';
import { obtenerLogosApp } from '../utils/logosApp';

const formatearFechaHora = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
};

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const texto = String(valor);
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(Number(texto.slice(0, 4)), Number(texto.slice(5, 7)) - 1, Number(texto.slice(8, 10)))
    : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return texto;
  return new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium' }).format(fecha);
};

const crearSlugFactura = (valor) =>
  String(valor || 'factura-membresia')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'factura-membresia';

const escaparHtml = (valor) =>
  String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const crearHtmlFacturaMembresia = (factura, configuracion, formatearMonto) => {
  const logos = obtenerLogosApp(configuracion);
  const concepto = `Membresia ${factura.tipoMembresia || ''}`.trim();

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escaparHtml(factura.numeroFactura || 'Factura')}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; background: #f2f2f2; color: #151515; font-family: Arial, Helvetica, sans-serif; }
          .sheet { width: 816px; min-height: 1056px; margin: 24px auto; background: #fff; padding: 42px; box-shadow: 0 18px 45px rgba(0,0,0,.12); }
          .top-line { height: 4px; background: #151515; margin-bottom: 22px; }
          header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #ddd; padding-bottom: 22px; }
          .brand { display: flex; gap: 18px; align-items: flex-start; }
          .logo { width: 132px; height: 72px; object-fit: contain; border: 1px solid #eee; padding: 8px; }
          h1, h2, p { margin: 0; }
          h1 { font-size: 26px; letter-spacing: .04em; }
          h2 { font-size: 18px; }
          .muted { color: #666; font-size: 12px; line-height: 1.55; }
          .right { text-align: right; }
          .center { text-align: center; }
          .strong { font-weight: 800; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin: 28px 0; }
          .label { color: #777; font-size: 10px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #151515; color: #fff; font-size: 11px; padding: 11px; text-align: left; text-transform: uppercase; }
          td { border-bottom: 1px solid #e8e8e8; padding: 12px 11px; font-size: 13px; }
          .bottom { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 28px; margin-top: 30px; align-items: start; }
          .box { background: #f7f7f7; border: 1px solid #e2e2e2; padding: 16px; }
          .pay-row, .total-row { display: flex; justify-content: space-between; gap: 18px; padding: 6px 0; font-size: 13px; }
          .total-row.final { border-top: 1px solid #ccc; margin-top: 8px; padding-top: 13px; font-size: 18px; font-weight: 900; }
          footer { margin-top: 42px; border-top: 1px solid #ddd; padding-top: 16px; color: #777; font-size: 12px; }
          @media print {
            body { background: #fff; }
            .sheet { width: auto; min-height: auto; margin: 0; padding: 28px; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <div class="top-line"></div>
          <header>
            <div class="brand">
              <img class="logo" src="${escaparHtml(logos.principal)}" alt="${escaparHtml(configuracion.gymName || 'Spartan Gym')}" />
              <div>
                <h2>${escaparHtml(configuracion.gymName || 'Spartan Gym')}</h2>
                <p class="muted">${escaparHtml(configuracion.email || 'admin@spartangym.com')}</p>
                <p class="muted">${escaparHtml(configuracion.phone || '+505 0000 0000')}</p>
              </div>
            </div>
            <div class="right">
              <h1>FACTURA DE MEMBRESIA</h1>
              <p class="muted strong">${escaparHtml(factura.numeroFactura || 'Sin numero')}</p>
              <p class="muted">${escaparHtml(formatearFechaHora(factura.fechaTransaccion))}</p>
            </div>
          </header>

          <section class="grid">
            <div>
              <p class="label">Socio</p>
              <h2>${escaparHtml(factura.socio || 'Socio')}</h2>
              <p class="muted">Renovacion de membresia</p>
            </div>
            <div>
              <p class="label">Vigencia</p>
              <p class="muted"><strong>Inicio:</strong> ${escaparHtml(formatearFecha(factura.fechaInicio))}</p>
              <p class="muted"><strong>Vence:</strong> ${escaparHtml(formatearFecha(factura.fechaVencimiento))}</p>
              <p class="muted"><strong>Metodo:</strong> ${escaparHtml(factura.metodoPago || 'No especificado')}</p>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th class="center">Cant.</th>
                <th class="right">Precio</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${escaparHtml(concepto)}</td>
                <td class="center">1</td>
                <td class="right">${escaparHtml(formatearMonto(factura.subtotal))}</td>
                <td class="right strong">${escaparHtml(formatearMonto(factura.subtotal))}</td>
              </tr>
            </tbody>
          </table>

          <section class="bottom">
            <div class="box">
              <p class="label">Detalles de pago</p>
              <div class="pay-row"><span>Metodo de pago</span><strong>${escaparHtml(factura.metodoPago || 'No especificado')}</strong></div>
              <div class="pay-row"><span>Estado de pago</span><strong>Pagado</strong></div>
              <div class="pay-row"><span>Tipo de membresia</span><strong>${escaparHtml(factura.tipoMembresia || '—')}</strong></div>
            </div>
            <div class="box">
              <div class="total-row"><span>Subtotal</span><strong>${escaparHtml(formatearMonto(factura.subtotal))}</strong></div>
              <div class="total-row"><span>Impuesto</span><strong>${escaparHtml(formatearMonto(factura.impuesto))}</strong></div>
              <div class="total-row final"><span>Total</span><strong>${escaparHtml(formatearMonto(factura.total))}</strong></div>
            </div>
          </section>

          <footer>Gracias por renovar tu membresia. Documento generado desde Spartan Gym.</footer>
        </main>
      </body>
    </html>
  `;
};

export const imprimirFacturaMembresia = (factura, configuracion, formatearMonto) => {
  const ventana = window.open('', '_blank', 'width=920,height=1080');
  if (!ventana) return;

  ventana.document.open();
  ventana.document.write(crearHtmlFacturaMembresia(factura, configuracion, formatearMonto));
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 450);
};

const cargarImagenComoPng = (urlImagen) =>
  new Promise((resolver) => {
    if (!urlImagen || typeof document === 'undefined') {
      resolver(null);
      return;
    }

    const imagen = new Image();
    imagen.crossOrigin = 'anonymous';
    imagen.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = imagen.naturalWidth || imagen.width;
        canvas.height = imagen.naturalHeight || imagen.height;
        const contexto = canvas.getContext('2d');
        contexto.drawImage(imagen, 0, 0);
        resolver({ dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height });
      } catch {
        resolver(null);
      }
    };
    imagen.onerror = () => resolver(null);
    imagen.src = urlImagen;
  });

export const descargarFacturaMembresiaPdf = async (factura, configuracion, formatearMonto) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const anchoPagina = pdf.internal.pageSize.getWidth();
  const margen = 42;
  const anchoTabla = anchoPagina - margen * 2;
  const logos = obtenerLogosApp(configuracion);
  const logo = await cargarImagenComoPng(logos.principal);
  let y = 40;

  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(1.4);
  pdf.line(margen, y, anchoPagina - margen, y);
  y += 14;

  if (logo?.width && logo?.height) {
    const proporcion = logo.width / logo.height;
    let ancho = 120;
    let alto = ancho / proporcion;
    if (alto > 58) {
      alto = 58;
      ancho = alto * proporcion;
    }
    pdf.addImage(logo.dataUrl, 'PNG', margen, y, ancho, alto, undefined, 'FAST');
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(18, 18, 18);
    pdf.text(configuracion.gymName || 'Spartan Gym', margen, y + 30);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(18, 18, 18);
  pdf.text('FACTURA DE MEMBRESIA', anchoPagina - margen, y + 16, { align: 'right' });
  pdf.setFontSize(10);
  pdf.setTextColor(90, 90, 90);
  pdf.text(factura.numeroFactura || 'Sin numero', anchoPagina - margen, y + 36, { align: 'right' });
  pdf.text(formatearFechaHora(factura.fechaTransaccion), anchoPagina - margen, y + 52, { align: 'right' });

  y += 82;
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margen, y, anchoPagina - margen, y);
  y += 26;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(18, 18, 18);
  pdf.text(configuracion.gymName || 'Spartan Gym', margen, y);
  pdf.text('Socio', margen + 285, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 75, 75);
  pdf.text(configuracion.email || 'admin@spartangym.com', margen, y + 16);
  pdf.text(configuracion.phone || '+505 0000 0000', margen, y + 31);
  pdf.text(factura.socio || 'Socio', margen + 285, y + 16, { maxWidth: 220 });
  pdf.text(`Membresia: ${factura.tipoMembresia || '—'}`, margen + 285, y + 31, { maxWidth: 220 });
  pdf.text(`Vence: ${formatearFecha(factura.fechaVencimiento)}`, margen + 285, y + 46);

  y += 78;
  pdf.setFillColor(18, 18, 18);
  pdf.rect(margen, y, anchoTabla, 28, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('CONCEPTO', margen + 12, y + 18);
  pdf.text('CANT.', margen + 300, y + 18);
  pdf.text('PRECIO', margen + 390, y + 18, { align: 'right' });
  pdf.text('TOTAL', anchoPagina - margen - 12, y + 18, { align: 'right' });
  y += 28;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(margen, y, anchoTabla, 34, 'F');
  pdf.setDrawColor(232, 232, 232);
  pdf.line(margen, y + 34, anchoPagina - margen, y + 34);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(30, 30, 30);
  pdf.text(`Membresia ${factura.tipoMembresia || ''}`.trim(), margen + 12, y + 20);
  pdf.text('1', margen + 300, y + 20);
  pdf.text(formatearMonto(factura.subtotal), margen + 390, y + 20, { align: 'right' });
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatearMonto(factura.subtotal), anchoPagina - margen - 12, y + 20, { align: 'right' });
  y += 58;

  const xTotales = anchoPagina - margen - 210;
  pdf.setFillColor(248, 248, 248);
  pdf.roundedRect(xTotales, y, 210, 112, 6, 6, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text('Subtotal', xTotales + 14, y + 24);
  pdf.text(formatearMonto(factura.subtotal), xTotales + 196, y + 24, { align: 'right' });
  pdf.text('Impuesto', xTotales + 14, y + 48);
  pdf.text(formatearMonto(factura.impuesto), xTotales + 196, y + 48, { align: 'right' });
  pdf.setDrawColor(220, 220, 220);
  pdf.line(xTotales + 14, y + 64, xTotales + 196, y + 64);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(18, 18, 18);
  pdf.text('Total', xTotales + 14, y + 90);
  pdf.text(formatearMonto(factura.total), xTotales + 196, y + 90, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(18, 18, 18);
  pdf.text('Detalles de pago', margen, y + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 75, 75);
  const detallesPago = [
    ['Metodo de pago', factura.metodoPago || 'No especificado'],
    ['Estado de pago', 'Pagado'],
    ['Inicio', formatearFecha(factura.fechaInicio)],
  ];
  detallesPago.forEach(([etiqueta, valor], indice) => {
    const filaY = y + 24 + indice * 16;
    pdf.text(`${etiqueta}:`, margen, filaY);
    pdf.text(String(valor ?? ''), margen + 122, filaY, { maxWidth: 170 });
  });

  y += 142;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(110, 110, 110);
  pdf.text('Gracias por renovar tu membresia. Documento generado desde Spartan Gym.', margen, y, { maxWidth: anchoTabla });

  pdf.save(`${crearSlugFactura(factura.numeroFactura)}.pdf`);
};

export const FacturaMembresiaModal = ({
  factura,
  configuracion,
  formatearMonto,
  descargando,
  onClose,
  onPrint,
  onDownload,
}) => {
  const logos = obtenerLogosApp(configuracion);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <section className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
        <header className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Factura de membresia</p>
            <h2 className="mt-1 font-mono text-lg font-black text-white">{factura.numeroFactura}</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase text-white transition-colors hover:bg-white/10"
            >
              <Printer size={15} />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onDownload}
              disabled={descargando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:bg-white/10 disabled:text-gray-500"
            >
              <Download size={15} />
              {descargando ? 'Generando...' : 'Descargar PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar factura"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto bg-neutral-200 p-3 sm:p-6">
          <article className="mx-auto w-full max-w-[840px] bg-white p-5 text-neutral-950 shadow-2xl sm:p-9">
            <div className="mb-7 h-1 w-full bg-neutral-950" />
            <header className="flex flex-col gap-6 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-20 w-36 items-center justify-center border border-neutral-200 p-2">
                  <img src={logos.principal} alt={configuracion.gymName || 'Spartan Gym'} className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-neutral-950">{configuracion.gymName || 'Spartan Gym'}</h2>
                  <p className="mt-1 text-sm text-neutral-600">{configuracion.email || 'admin@spartangym.com'}</p>
                  <p className="text-sm text-neutral-600">{configuracion.phone || '+505 0000 0000'}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <h1 className="text-2xl font-black uppercase tracking-wider text-neutral-950">Factura de membresia</h1>
                <p className="mt-2 font-mono text-sm font-black text-neutral-700">{factura.numeroFactura || 'Sin numero'}</p>
                <p className="mt-1 text-sm text-neutral-600">{formatearFechaHora(factura.fechaTransaccion)}</p>
              </div>
            </header>

            <section className="grid grid-cols-1 gap-6 border-b border-neutral-200 py-7 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Socio</p>
                <h3 className="mt-2 text-lg font-black text-neutral-950">{factura.socio || 'Socio'}</h3>
                <p className="mt-1 text-sm text-neutral-600">Renovacion de membresia</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Vigencia</p>
                <div className="mt-2 space-y-1 text-sm text-neutral-700">
                  <p><span className="font-bold text-neutral-950">Inicio:</span> {formatearFecha(factura.fechaInicio)}</p>
                  <p><span className="font-bold text-neutral-950">Vence:</span> {formatearFecha(factura.fechaVencimiento)}</p>
                  <p><span className="font-bold text-neutral-950">Metodo:</span> {factura.metodoPago || 'No especificado'}</p>
                </div>
              </div>
            </section>

            <div className="mt-7 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="bg-neutral-950 text-left text-[11px] uppercase text-white">
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-200">
                    <td className="px-4 py-4 font-bold text-neutral-950">Membresia {factura.tipoMembresia}</td>
                    <td className="px-4 py-4 text-center text-neutral-700">1</td>
                    <td className="px-4 py-4 text-right text-neutral-700">{formatearMonto(factura.subtotal)}</td>
                    <td className="px-4 py-4 text-right font-black text-neutral-950">{formatearMonto(factura.subtotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="border border-neutral-200 bg-neutral-50 p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Detalles de pago</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-5">
                    <span className="text-neutral-600">Metodo de pago</span>
                    <strong className="text-right text-neutral-950">{factura.metodoPago || 'No especificado'}</strong>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <span className="text-neutral-600">Estado de pago</span>
                    <strong className="text-right text-neutral-950">Pagado</strong>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <span className="text-neutral-600">Tipo de membresia</span>
                    <strong className="text-right text-neutral-950">{factura.tipoMembresia || '—'}</strong>
                  </div>
                </div>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-600">Subtotal</span>
                    <strong>{formatearMonto(factura.subtotal)}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-600">Impuesto</span>
                    <strong>{formatearMonto(factura.impuesto)}</strong>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-neutral-300 pt-4 text-xl font-black">
                    <span>Total</span>
                    <strong>{formatearMonto(factura.total)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <footer className="mt-10 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
              Gracias por renovar tu membresia. Documento generado desde Spartan Gym.
            </footer>
          </article>
        </div>
      </section>
    </div>
  );
};

export const FacturaMembresiaResumen = ({ factura, formatearMonto, onAbrir }) => (
  <section className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-green-400">Factura generada</p>
        <h2 className="mt-1 font-mono text-lg font-black text-white">{factura.numeroFactura}</h2>
        <p className="mt-1 text-sm text-gray-300">
          {factura.socio} - {formatearMonto(factura.total)}
        </p>
      </div>
      <button
        type="button"
        onClick={onAbrir}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black uppercase text-[#111] transition-colors hover:bg-gray-200 sm:w-auto"
      >
        <Receipt size={15} />
        Ver factura
      </button>
    </div>
  </section>
);
