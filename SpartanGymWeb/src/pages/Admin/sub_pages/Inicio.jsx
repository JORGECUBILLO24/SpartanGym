import { useEffect, useState } from 'react';
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
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRoundCog,
  Users,
  Zap,
} from 'lucide-react';

import imgLaptop from '../../../assets/ComputadoraSpartan.webp';
import imgEstadisticas from '../../../assets/EstadisticasSpartan.webp';
import imgMembresia from '../../../assets/MembresiaSpartan.webp';
import imgSuplementos from '../../../assets/SuplementosSpartan.webp';
import { formatearMoneda, useConfiguracionApp } from '../../../utils/configuracionApp';
import { finanzasApi, inventarioApi, membresiasApi, operacionApi, personalApi, reportesApi, sucursalesApi } from '../../../services/api';

const modulosAdministracion = [
  {
    titulo: 'Gestion de usuarios',
    descripcion: 'Socios, entrenadores, recepcion y permisos del sistema.',
    boton: 'Ver usuarios',
    imagen: imgLaptop,
    icono: UserRoundCog,
    ruta: '/admin/usuarios',
    metrica: '...',
    estado: 'Activo',
  },
  {
    titulo: 'Validacion QR de socios',
    descripcion: 'QR temporal en web para que el socio lo escanee desde la app movil.',
    boton: 'Mostrar QR',
    imagen: imgLaptop,
    icono: QrCode,
    ruta: '/admin/check-in',
    metrica: '...',
    estado: 'Seguro',
  },
  {
    titulo: 'Tipos de membresia',
    descripcion: 'Planes diarios, quincenales, mensuales y anuales.',
    boton: 'Configurar',
    imagen: imgMembresia,
    icono: CreditCard,
    ruta: '/admin/membresias',
    metrica: '...',
    estado: 'Actualizado',
  },
  {
    titulo: 'Reportes financieros',
    descripcion: 'Ingresos, pagos, categorias, exportes PDF y Excel.',
    boton: 'Ver reportes',
    imagen: imgEstadisticas,
    icono: BarChart3,
    ruta: '/admin/finanzas',
    metricaMonto: 0,
    estado: 'En linea',
  },
  {
    titulo: 'Inventario',
    descripcion: 'Productos, stock, categorias y alertas de bajo inventario.',
    boton: 'Ver inventario',
    imagen: imgSuplementos,
    icono: Package,
    ruta: '/admin/inventario',
    metrica: '...',
    estado: 'Revision',
  },
  {
    titulo: 'Sucursales y gimnasios',
    descripcion: 'Ubicaciones, horarios, capacidad y conteo operativo.',
    boton: 'Agregar gimnasio',
    imagen: imgMembresia,
    icono: Building2,
    ruta: '/admin/sucursales',
    metrica: '...',
    estado: 'Creciendo',
  },
  {
    titulo: 'Personal de entrenamiento',
    descripcion: 'Entrenadores, especialidades, turnos y asignaciones.',
    boton: 'Agregar entrenador',
    imagen: imgSuplementos,
    icono: Dumbbell,
    ruta: '/admin/usuarios',
    metrica: '...',
    estado: 'Cubierto',
  },
  {
    titulo: 'Area de recepcion',
    descripcion: 'Recepcionistas, accesos, caja y control de turnos.',
    boton: 'Agregar recepcionista',
    imagen: imgLaptop,
    icono: Contact,
    ruta: '/admin/usuarios',
    metrica: '...',
    estado: 'Operando',
  },
  {
    titulo: 'Mensajes globales',
    descripcion: 'Comunicados por correo o SMS a todos los usuarios.',
    boton: 'Crear mensaje',
    imagen: imgEstadisticas,
    icono: Bell,
    ruta: '/admin/mensajes',
    metrica: '...',
    estado: 'Listo',
  },
];

const estadoInicialAdmin = {
  sociosActivos: 0,
  ingresosMes: 0,
  margenNeto: 0,
  porVencer: 0,
  personalActivo: 0,
  alertasInventario: 0,
  tiposMembresia: 0,
  movimientosFinancieros: 0,
  sucursales: 0,
};

const Inicio = () => {
  const configuracion = useConfiguracionApp();
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);
  const [resumenAdmin, setResumenAdmin] = useState(estadoInicialAdmin);

  useEffect(() => {
    Promise.allSettled([
      reportesApi.resumen(),
      personalApi.listar(),
      inventarioApi.listar(),
      operacionApi.inicioRecepcion(),
      membresiasApi.tipos(),
      finanzasApi.listar(),
      sucursalesApi.listar(),
    ]).then(([reporte, personal, inventario, recepcion, tipos, finanzas, sucursales]) => {
      const reporteDatos = reporte.status === 'fulfilled' ? reporte.value : {};
      const personalDatos = personal.status === 'fulfilled' ? personal.value : [];
      const inventarioDatos = inventario.status === 'fulfilled' ? inventario.value : [];
      const recepcionDatos = recepcion.status === 'fulfilled' ? recepcion.value : {};
      const tiposDatos = tipos.status === 'fulfilled' ? tipos.value : [];
      const finanzasDatos = finanzas.status === 'fulfilled' ? finanzas.value : [];
      const sucursalesDatos = sucursales.status === 'fulfilled' ? sucursales.value : [];

      setResumenAdmin({
        sociosActivos: Number(reporteDatos.totalSocios || recepcionDatos.sociosActivos || 0),
        ingresosMes: Number(reporteDatos.ingresosTotales || 0),
        margenNeto: Number(reporteDatos.margenNeto || 0),
        porVencer: (recepcionDatos.proximosVencimientos || []).length,
        personalActivo: personalDatos.filter((persona) => persona.activo).length,
        alertasInventario: inventarioDatos.filter((producto) => Number(producto.stock || 0) <= 5).length,
        tiposMembresia: tiposDatos.length,
        movimientosFinancieros: finanzasDatos.length,
        sucursales: sucursalesDatos.length,
      });
    });
  }, []);

  const indicadoresDinamicos = [
    { titulo: 'Socios activos', valor: resumenAdmin.sociosActivos, detalle: 'Registrados en base', icono: Users, color: 'text-blue-500' },
    { titulo: 'Ingresos mes', valorMonto: resumenAdmin.ingresosMes, detalle: `${resumenAdmin.margenNeto}% margen`, icono: DollarSign, color: 'text-green-500' },
    { titulo: 'Por vencer', valor: resumenAdmin.porVencer, detalle: 'Requieren seguimiento', icono: Calendar, color: 'text-red-500' },
    { titulo: 'Personal', valor: resumenAdmin.personalActivo, detalle: 'Usuarios activos', icono: UserCheck, color: 'text-orange-500' },
  ];

  const pulsoDinamico = [
    { etiqueta: 'Rendimiento', valor: `${resumenAdmin.margenNeto}%`, icono: Gauge },
    { etiqueta: 'Alertas', valor: String(resumenAdmin.alertasInventario), icono: Bell },
    { etiqueta: 'Turnos', valor: resumenAdmin.personalActivo ? 'Activo' : '0', icono: ShieldCheck },
  ];

  const modulosDinamicos = modulosAdministracion.map((modulo) => {
    if (modulo.titulo === 'Gestion de usuarios') return { ...modulo, metrica: `${resumenAdmin.sociosActivos} socios` };
    if (modulo.titulo === 'Tipos de membresia') return { ...modulo, metrica: `${resumenAdmin.tiposMembresia} planes` };
    if (modulo.titulo === 'Reportes financieros') return { ...modulo, metricaMonto: resumenAdmin.ingresosMes };
    if (modulo.titulo === 'Inventario') return { ...modulo, metrica: `${resumenAdmin.alertasInventario} alertas` };
    if (modulo.titulo === 'Sucursales y gimnasios') return { ...modulo, metrica: `${resumenAdmin.sucursales} sedes` };
    if (modulo.titulo === 'Personal de entrenamiento') return { ...modulo, metrica: `${resumenAdmin.personalActivo} activos` };
    if (modulo.titulo === 'Area de recepcion') return { ...modulo, metrica: `${resumenAdmin.movimientosFinancieros} movimientos` };
    return modulo;
  });

  return (
    <div className="inicio-admin flex min-h-full w-full flex-col gap-5 text-white sm:gap-6">
      <section className="panel-operativo relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6 lg:p-7">
        <div className="brillo-acento-operativo pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block" />
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
            {pulsoDinamico.map((pulso) => (
              <PulsoOperativo key={pulso.etiqueta} {...pulso} />
            ))}
          </div>
        </div>
      </section>

      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-4">
        {indicadoresDinamicos.map((indicador) => (
          <TarjetaIndicador
            key={indicador.titulo}
            {...indicador}
            valor={indicador.valorMonto ? formatearMonto(indicador.valorMonto) : indicador.valor}
          />
        ))}
      </div>

      <div className="grid flex-grow grid-cols-1 gap-4 sm:gap-6 2xl:grid-cols-2">
        {modulosDinamicos.map((modulo) => (
          <TarjetaModulo
            key={modulo.titulo}
            {...modulo}
            metrica={modulo.metricaMonto ? `${formatearMonto(modulo.metricaMonto)} mes` : modulo.metrica}
          />
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
        loading="lazy"
        decoding="async"
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
