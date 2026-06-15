import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  ChevronRight,
  Contact,
  CreditCard,
  DollarSign,
  Dumbbell,
  Gauge,
  Package,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRoundCog,
  Users,
  Zap,
} from 'lucide-react';

import imgLaptop from '../../../assets/ComputadoraSpartan.png';
import imgEstadisticas from '../../../assets/EstadisticasSpartan.png';
import imgMembresia from '../../../assets/MembresiaSpartan.png';
import imgSuplementos from '../../../assets/SuplementosSpartan.png';

const indicadoresRapidos = [
  { titulo: 'Socios activos', valor: '128', detalle: '+18 este mes', icono: Users, color: 'text-blue-500' },
  { titulo: 'Ingresos mes', valor: '$4,850', detalle: '82.4% margen', icono: DollarSign, color: 'text-green-500' },
  { titulo: 'Por vencer', valor: '17', detalle: 'Requieren seguimiento', icono: Calendar, color: 'text-red-500' },
  { titulo: 'Personal', valor: '12', detalle: 'Turnos cubiertos', icono: UserCheck, color: 'text-orange-500' },
];

const pulsoOperativo = [
  { etiqueta: 'Rendimiento', valor: '94%', icono: Gauge },
  { etiqueta: 'Alertas', valor: '3', icono: Bell },
  { etiqueta: 'Turnos', valor: '100%', icono: ShieldCheck },
];

const modulosAdministracion = [
  {
    titulo: 'Gestion de usuarios',
    descripcion: 'Socios, entrenadores, recepcion y permisos del sistema.',
    boton: 'Ver usuarios',
    imagen: imgLaptop,
    icono: UserRoundCog,
    ruta: '/admin/usuarios',
    metrica: '1,248 usuarios',
    estado: 'Activo',
  },
  {
    titulo: 'Tipos de membresia',
    descripcion: 'Planes diarios, quincenales, mensuales y anuales.',
    boton: 'Configurar',
    imagen: imgMembresia,
    icono: CreditCard,
    ruta: '/admin/membresias',
    metrica: '8 planes',
    estado: 'Actualizado',
  },
  {
    titulo: 'Reportes financieros',
    descripcion: 'Ingresos, pagos, categorias, exportes PDF y Excel.',
    boton: 'Ver reportes',
    imagen: imgEstadisticas,
    icono: BarChart3,
    ruta: '/admin/finanzas',
    metrica: '$4,850 mes',
    estado: 'En linea',
  },
  {
    titulo: 'Inventario',
    descripcion: 'Productos, stock, categorias y alertas de bajo inventario.',
    boton: 'Ver inventario',
    imagen: imgSuplementos,
    icono: Package,
    ruta: '/admin/inventario',
    metrica: '3 alertas',
    estado: 'Revision',
  },
  {
    titulo: 'Sucursales y gimnasios',
    descripcion: 'Ubicaciones, horarios, capacidad y conteo operativo.',
    boton: 'Agregar gimnasio',
    imagen: imgMembresia,
    icono: Building2,
    ruta: '/admin/sucursales',
    metrica: '4 sedes',
    estado: 'Creciendo',
  },
  {
    titulo: 'Personal de entrenamiento',
    descripcion: 'Entrenadores, especialidades, turnos y asignaciones.',
    boton: 'Agregar entrenador',
    imagen: imgSuplementos,
    icono: Dumbbell,
    ruta: '/admin/usuarios',
    metrica: '7 activos',
    estado: 'Cubierto',
  },
  {
    titulo: 'Area de recepcion',
    descripcion: 'Recepcionistas, accesos, caja y control de turnos.',
    boton: 'Agregar recepcionista',
    imagen: imgLaptop,
    icono: Contact,
    ruta: '/admin/usuarios',
    metrica: '4 turnos',
    estado: 'Operando',
  },
  {
    titulo: 'Mensajes globales',
    descripcion: 'Comunicados por correo o SMS a todos los usuarios.',
    boton: 'Crear mensaje',
    imagen: imgEstadisticas,
    icono: Bell,
    ruta: '/admin/mensajes',
    metrica: '2 canales',
    estado: 'Listo',
  },
];

const Inicio = () => {
  return (
    <div className="inicio-admin flex min-h-full w-full flex-col gap-5 text-white sm:gap-6">
      <section className="panel-operativo relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6 lg:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(120deg,transparent,rgba(229,9,20,0.16),transparent)] lg:block" />
        <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-red-400">
              <Sparkles size={13} />
              Centro de mando
            </div>
            <h1 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
              Operacion Spartan en tiempo real
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Supervisa usuarios, dinero, inventario, personal y mensajes desde un inicio mas claro, visual y rapido.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {pulsoOperativo.map((pulso) => (
              <PulsoOperativo key={pulso.etiqueta} {...pulso} />
            ))}
          </div>
        </div>
      </section>

      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        {indicadoresRapidos.map((indicador) => (
          <TarjetaIndicador key={indicador.titulo} {...indicador} />
        ))}
      </div>

      <div className="grid flex-grow grid-cols-1 gap-4 sm:gap-6 2xl:grid-cols-2">
        {modulosAdministracion.map((modulo) => (
          <TarjetaModulo key={modulo.titulo} {...modulo} />
        ))}
      </div>

      <footer className="mt-2 flex flex-col gap-2 border-t border-white/5 pt-4 text-[10px] text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
        <p>© 2026 Spartan Gym. Todos los derechos reservados.</p>
        <p>Version 1.0.0</p>
      </footer>
    </div>
  );
};

const PulsoOperativo = ({ etiqueta, valor, icono: Icono }) => (
  <article className="pulso-operativo rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center backdrop-blur-sm">
    <Icono className="mx-auto text-red-500" size={18} />
    <p className="mt-2 text-lg font-black text-white">{valor}</p>
    <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-widest text-gray-500">{etiqueta}</p>
  </article>
);

const TarjetaIndicador = ({ titulo, valor, detalle, icono: Icono, color }) => (
  <article className="tarjeta-indicador flex items-center justify-between rounded-xl border border-white/5 bg-[#090909] p-3 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10 sm:p-4">
    <div className="min-w-0 overflow-hidden">
      <p className="mb-1 truncate text-[9px] font-bold uppercase tracking-wider text-gray-500 sm:text-[10px]">{titulo}</p>
      <h2 className="text-xl font-black leading-none sm:text-2xl">{valor}</h2>
      <p className="mt-2 truncate text-[10px] font-bold text-gray-500">{detalle}</p>
    </div>
    <div className={`ml-2 shrink-0 rounded-lg bg-white/5 p-2 ${color}`}>
      <Icono size={18} className="sm:h-5 sm:w-5" />
    </div>
  </article>
);

const TarjetaModulo = ({ titulo, descripcion, boton, imagen, icono: Icono, ruta, metrica, estado }) => {
  const navegar = useNavigate();

  return (
    <article className="tarjeta-modulo-admin module-card group relative min-h-[210px] overflow-hidden rounded-2xl border border-white/10 bg-[#090909] shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-red-600/40">
      <img
        src={imagen}
        alt={titulo}
        className="imagen-modulo-admin module-card-image absolute inset-y-0 right-0 h-full w-full object-cover opacity-35 grayscale transition-all duration-700 group-hover:scale-105 group-hover:opacity-70 group-hover:grayscale-0 sm:w-[72%] sm:opacity-55"
      />
      <div className="module-card-overlay absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/92 to-[#090909]/25" />
      <div className="brillo-modulo-admin absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex min-h-[210px] w-full flex-col justify-between p-4 sm:max-w-[66%] sm:p-6">
        <div>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-xl bg-red-600/10 p-2 text-red-600">
                <Icono size={22} />
              </div>
              <h3 className="min-w-0 text-sm font-black leading-tight text-white sm:text-base">{titulo}</h3>
            </div>
            <ArrowUpRight size={16} className="shrink-0 text-white/15 transition-colors group-hover:text-red-500" />
          </div>
          <p className="line-clamp-3 pr-2 text-[11px] leading-5 text-gray-400 sm:text-xs">{descripcion}</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-gray-400">
              {metrica}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-red-500">
              <Zap size={10} />
              {estado}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navegar(ruta)}
            className="relative z-20 inline-flex w-fit max-w-full cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-left text-[10px] font-black uppercase text-white transition-all hover:border-red-600 hover:bg-red-600"
          >
            {boton} <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default Inicio;
