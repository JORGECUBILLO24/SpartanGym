import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  MonitorSmartphone,
  QrCode,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Zap,
} from 'lucide-react';

const pagosRecientes = [
  { id: 1, socio: 'Juan Perez', membresia: 'Premium', monto: '$600', fecha: '12/05/2026', estado: 'Pagado' },
  { id: 2, socio: 'Maria Gomez', membresia: 'Basica', monto: '$450', fecha: '12/05/2026', estado: 'Pagado' },
  { id: 3, socio: 'Carlos Ramirez', membresia: 'Premium', monto: '$600', fecha: '11/05/2026', estado: 'Pagado' },
  { id: 4, socio: 'Ana Torres', membresia: 'Elite', monto: '$800', fecha: '11/05/2026', estado: 'Pagado' },
];

const proximosVencimientos = [
  { id: 1, socio: 'Luis Hernandez', membresia: 'Basica', vence: '18/05/2026', dias: '6 dias' },
  { id: 2, socio: 'Fernanda Lopez', membresia: 'Premium', vence: '20/05/2026', dias: '8 dias' },
  { id: 3, socio: 'Roberto Silva', membresia: 'Elite', vence: '23/05/2026', dias: '11 dias' },
  { id: 4, socio: 'Daniela Castro', membresia: 'Basica', vence: '25/05/2026', dias: '13 dias' },
];

const indicadoresRecepcion = [
  { icono: QrCode, titulo: 'Check-ins', valor: '64', detalle: 'Hoy', ruta: '/recepcion/check-in' },
  { icono: DollarSign, titulo: 'Pagos', valor: '$1,280', detalle: 'Turno actual', ruta: '/recepcion/pagos' },
  { icono: CalendarClock, titulo: 'Vencimientos', valor: '9', detalle: 'Proximos dias', ruta: '/recepcion/membresias' },
  { icono: UserPlus, titulo: 'Socios nuevos', valor: '6', detalle: 'Registrados', ruta: '/recepcion/registrar-socio' },
];

const Inicio = () => {
  const navegar = useNavigate();

  return (
    <div className="pagina-stack flex flex-col gap-5 lg:gap-6">
      <section className="tarjeta-sistema relative overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 lg:p-7">
        <div className="brillo-panel" />
        <div className="relative z-10 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-red-400">
              <Sparkles size={13} />
              Recepcion en vivo
            </div>
            <h1 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">
              Flujo rapido para acceso, caja y socios
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Ten a mano check-in, pagos, vencimientos y registro sin perder tiempo entre pantallas.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniPulso icono={ShieldCheck} etiqueta="Accesos" valor="OK" />
            <MiniPulso icono={Zap} etiqueta="Caja" valor="Activa" />
            <MiniPulso icono={CheckCircle2} etiqueta="Turno" valor="100%" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        {indicadoresRecepcion.map((indicador) => (
          <TarjetaResumen
            key={indicador.titulo}
            {...indicador}
            onClick={() => navegar(indicador.ruta)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <TarjetaAccion
          icono={QrCode}
          titulo="Control de acceso"
          descripcion="Valida membresias activas y registra el check-in para ingresar al gimnasio."
          boton="Registrar check-in"
          onClick={() => navegar('/recepcion/check-in')}
        >
          <VisualQr />
        </TarjetaAccion>

        <TarjetaAccion
          icono={UserPlus}
          titulo="Registro de nuevos socios"
          descripcion="Crea registros y asigna el plan de membresia correcto desde recepcion."
          boton="Registrar socio"
          onClick={() => navegar('/recepcion/registrar-socio')}
        >
          <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-white/10 bg-[#050505]">
            <MonitorSmartphone size={84} className="text-white/10" strokeWidth={1} />
          </div>
        </TarjetaAccion>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <TablaInicio
          titulo="Pagos recientes"
          icono={DollarSign}
          columnas={['Socio', 'Membresia', 'Monto', 'Fecha', 'Estado']}
          accion="Ver todos los pagos"
          onClick={() => navegar('/recepcion/pagos')}
        >
          {pagosRecientes.map((pago) => (
            <tr key={pago.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
              <td className="flex items-center gap-2 py-3 pr-4">
                <AvatarSocio />
                {pago.socio}
              </td>
              <td className="py-3 pr-4 text-gray-400">{pago.membresia}</td>
              <td className="py-3 pr-4 font-bold text-white">{pago.monto}</td>
              <td className="py-3 pr-4 text-gray-400">{pago.fecha}</td>
              <td className="py-3">
                <span className="rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">
                  {pago.estado}
                </span>
              </td>
            </tr>
          ))}
        </TablaInicio>

        <TablaInicio
          titulo="Proximos vencimientos"
          icono={CalendarClock}
          columnas={['Socio', 'Membresia', 'Vence el', 'Dias restantes']}
          accion="Ver vencimientos"
          onClick={() => navegar('/recepcion/membresias')}
        >
          {proximosVencimientos.map((vencimiento) => (
            <tr key={vencimiento.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
              <td className="flex items-center gap-2 py-3 pr-4">
                <AvatarSocio />
                {vencimiento.socio}
              </td>
              <td className="py-3 pr-4 text-gray-400">{vencimiento.membresia}</td>
              <td className="py-3 pr-4 text-gray-400">{vencimiento.vence}</td>
              <td className="py-3 text-right font-bold text-orange-400">{vencimiento.dias}</td>
            </tr>
          ))}
        </TablaInicio>
      </div>
    </div>
  );
};

const MiniPulso = ({ icono: Icono, etiqueta, valor }) => (
  <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
    <Icono className="mx-auto text-red-500" size={18} />
    <p className="mt-2 truncate text-sm font-black text-white">{valor}</p>
    <p className="mt-1 truncate text-[9px] font-black uppercase tracking-widest text-gray-500">{etiqueta}</p>
  </article>
);

const TarjetaResumen = ({ icono: Icono, titulo, valor, detalle, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="tarjeta-sistema group flex min-h-32 flex-col items-start justify-between rounded-2xl border border-white/10 bg-[#111111] p-4 text-left shadow-xl sm:min-h-28 sm:flex-row sm:items-center"
  >
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
      <div className="mb-3 rounded-xl bg-[#2a0808] p-3 text-red-500 transition-colors group-hover:bg-red-600 group-hover:text-white sm:mb-0">
        <Icono size={20} />
      </div>
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{titulo}</span>
        <p className="mt-1 text-2xl font-black text-white">{valor}</p>
        <span className="text-[10px] font-bold text-gray-500">{detalle}</span>
      </div>
    </div>
    <ChevronRight size={16} className="self-end text-gray-600 transition-colors group-hover:text-white sm:self-auto" />
  </button>
);

const TarjetaAccion = ({ icono: Icono, titulo, descripcion, boton, onClick, children }) => (
  <article className="tarjeta-sistema group relative flex min-h-[230px] items-stretch overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl lg:p-7">
    <div className="brillo-panel" />
    <div className="relative z-10 flex w-full flex-col justify-between lg:w-[60%]">
      <div>
        <div className="mb-3 flex items-center gap-3 text-white">
          <div className="rounded-xl bg-red-600/10 p-2 text-red-500">
            <Icono size={22} />
          </div>
          <h3 className="text-base font-black">{titulo}</h3>
        </div>
        <p className="max-w-sm text-sm leading-6 text-gray-400">{descripcion}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="boton-primario mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-900/20 hover:bg-red-700"
      >
        {boton} <ChevronRight size={16} />
      </button>
    </div>
    <div className="absolute bottom-5 right-5 top-5 hidden w-[35%] opacity-85 transition-opacity group-hover:opacity-100 lg:block">
      {children}
    </div>
  </article>
);

const VisualQr = () => (
  <div className="flex h-full min-h-40 flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
    <p className="mb-4 text-xs font-bold text-gray-500">Escanear codigo QR</p>
    <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-red-600/40 bg-red-500/5">
      <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_14px_3px_rgba(239,68,68,0.45)] escaneo-linea" />
      <QrCode size={48} className="text-white/70" />
    </div>
    <div className="mt-4 flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-500">
      <CheckCircle2 size={12} /> Membresia activa
    </div>
  </div>
);

const TablaInicio = ({ titulo, icono: Icono, columnas, accion, onClick, children }) => (
  <section className="tarjeta-sistema flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl">
    <div className="mb-5 flex items-center gap-3 text-white">
      <div className="text-red-500"><Icono size={20} /></div>
      <h3 className="font-black">{titulo}</h3>
    </div>
    <div className="overflow-x-auto pb-2">
      <table className="w-full whitespace-nowrap text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-gray-500">
            {columnas.map((columna) => (
              <th key={columna} className="pb-3 pr-4 font-bold">{columna}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
    <button
      type="button"
      onClick={onClick}
      className="mt-auto flex w-fit items-center gap-1 pt-4 text-sm font-bold text-red-500 transition-colors hover:text-red-400"
    >
      {accion} <ChevronRight size={16} />
    </button>
  </section>
);

const AvatarSocio = () => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2a0808] text-red-500">
    <User size={12} />
  </span>
);

export default Inicio;
