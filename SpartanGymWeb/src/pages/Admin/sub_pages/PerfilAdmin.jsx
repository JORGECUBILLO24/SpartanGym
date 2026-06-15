import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  Dumbbell,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  User,
  UserRoundCog,
  Users,
} from 'lucide-react';
import { guardarDatoLocal, leerDatoLocal } from '../../../utils/almacenamientoLocal';
import {
  EVENTO_CUENTA_ACTUAL,
  guardarCuentaActual,
  leerCuentaActual,
  obtenerInicialesCuenta,
} from '../../../utils/cuentaActual';
import { gimnasiosDisponibles } from '../../../utils/gimnasiosCompartidos';
import {
  EVENTO_PERSONAL,
  eliminarPersonalCompartido,
  leerPersonalCompartido,
  obtenerNombrePersonal,
  personalCreadoPorCuentaActual,
} from '../../../utils/personalCompartido';

const CLAVE_PERFIL_ADMIN = 'spartanGym.adminProfile';

const perfilPorDefecto = {
  nombre: 'Administrador Spartan',
  correo: 'admin@spartangym.com',
  telefono: '+505 0000 0000',
  cargo: 'Administrador General',
  sucursal: 'SpartanGym Central',
  ubicacion: 'Managua, Nicaragua',
};

const gimnasiosAdministrados = gimnasiosDisponibles;

const conteoUsuariosPorSucursal = gimnasiosAdministrados.map((gimnasio) => ({
  sucursal: gimnasio.nombre,
  usuarios: gimnasio.usuarios,
}));

const formatearPersonaPerfil = (persona, cuenta) => ({
  id: persona.id,
  nombre: obtenerNombrePersonal(persona),
  correo: persona.correo,
  rol: persona.cargo || persona.rol,
  especialidad: persona.especialidad || persona.rol,
  sucursal: persona.gimnasio,
  estado: persona.estado,
  creadoPor: persona.creadoPor,
  puedeEliminar: personalCreadoPorCuentaActual(persona, cuenta),
});

const cargarPerfilInicial = () => {
  const cuenta = leerCuentaActual();
  const perfilGuardado = leerDatoLocal(CLAVE_PERFIL_ADMIN, {});
  const correo = cuenta.username || cuenta.email || perfilGuardado.correo || perfilPorDefecto.correo;

  return {
    ...perfilPorDefecto,
    ...perfilGuardado,
    correo,
  };
};

const PerfilAdmin = () => {
  const [perfil, setPerfil] = useState(cargarPerfilInicial);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [mensajePersonal, setMensajePersonal] = useState(null);
  const [cuentaActual, setCuentaActual] = useState(() => leerCuentaActual());
  const [gimnasioActivoId, setGimnasioActivoId] = useState(gimnasiosAdministrados[0].id);
  const [personalCompartido, setPersonalCompartido] = useState(() => leerPersonalCompartido());

  useEffect(() => {
    const actualizarPersonal = () => setPersonalCompartido(leerPersonalCompartido());
    const actualizarCuenta = () => setCuentaActual(leerCuentaActual());

    window.addEventListener('storage', actualizarPersonal);
    window.addEventListener('storage', actualizarCuenta);
    window.addEventListener(EVENTO_PERSONAL, actualizarPersonal);
    window.addEventListener(EVENTO_CUENTA_ACTUAL, actualizarCuenta);

    return () => {
      window.removeEventListener('storage', actualizarPersonal);
      window.removeEventListener('storage', actualizarCuenta);
      window.removeEventListener(EVENTO_PERSONAL, actualizarPersonal);
      window.removeEventListener(EVENTO_CUENTA_ACTUAL, actualizarCuenta);
    };
  }, []);

  const iniciales = useMemo(
    () => obtenerInicialesCuenta({ name: perfil.nombre, email: perfil.correo }, 'AD'),
    [perfil.correo, perfil.nombre]
  );
  const totalUsuarios = useMemo(
    () => conteoUsuariosPorSucursal.reduce((total, sucursal) => total + sucursal.usuarios, 0),
    []
  );
  const usuariosMaximos = useMemo(
    () => Math.max(...conteoUsuariosPorSucursal.map((sucursal) => sucursal.usuarios)),
    []
  );
  const gimnasioActivo = useMemo(
    () => gimnasiosAdministrados.find((gimnasio) => gimnasio.id === gimnasioActivoId) || gimnasiosAdministrados[0],
    [gimnasioActivoId]
  );
  const administradoresCreados = useMemo(
    () => personalCompartido
      .filter((persona) => persona.rol === 'Administrador')
      .map((persona) => formatearPersonaPerfil(persona, cuentaActual)),
    [cuentaActual, personalCompartido]
  );
  const entrenadoresAsignados = useMemo(
    () => personalCompartido
      .filter((persona) => persona.rol === 'Entrenador')
      .map((persona) => formatearPersonaPerfil(persona, cuentaActual)),
    [cuentaActual, personalCompartido]
  );
  const recepcionistasAsignados = useMemo(
    () => personalCompartido
      .filter((persona) => persona.rol === 'Recepcionista')
      .map((persona) => formatearPersonaPerfil(persona, cuentaActual)),
    [cuentaActual, personalCompartido]
  );

  const resumenPerfil = [
    { titulo: 'Gimnasios', valor: gimnasiosAdministrados.length, detalle: 'Bajo tu cuenta', icono: Building2, color: 'text-red-500' },
    { titulo: 'Admins', valor: administradoresCreados.length, detalle: 'Creados por ti', icono: UserRoundCog, color: 'text-blue-500' },
    { titulo: 'Entrenadores', valor: entrenadoresAsignados.length, detalle: 'Asignados', icono: Dumbbell, color: 'text-green-500' },
    { titulo: 'Recepcion', valor: recepcionistasAsignados.length, detalle: 'En sucursales', icono: User, color: 'text-cyan-500' },
    { titulo: 'Usuarios', valor: totalUsuarios.toLocaleString('es-NI'), detalle: 'Total por sucursal', icono: Users, color: 'text-orange-500' },
  ];

  const actualizarCampo = (evento) => {
    setPerfil({ ...perfil, [evento.target.name]: evento.target.value });
    setMensajePersonal(null);
  };

  const eliminarPersona = (persona) => {
    if (!persona.puedeEliminar) {
      setMensajePersonal({
        tipo: 'error',
        texto: 'Solo puedes eliminar personal creado por tu cuenta.',
      });
      return;
    }

    const debeEliminar = typeof window === 'undefined'
      ? true
      : window.confirm(`Eliminar a ${persona.nombre} del sistema?`);

    if (!debeEliminar) return;

    const resultado = eliminarPersonalCompartido(persona.id);
    setPersonalCompartido(resultado.personal);
    setMensajePersonal({
      tipo: resultado.ok ? 'exito' : 'error',
      texto: resultado.mensaje,
    });
  };

  const guardarPerfil = (evento) => {
    evento.preventDefault();
    setGuardando(true);

    setTimeout(() => {
      const perfilNormalizado = {
        ...perfil,
        nombre: perfil.nombre.trim(),
        correo: perfil.correo.trim(),
        telefono: perfil.telefono.trim(),
        cargo: perfil.cargo.trim(),
        sucursal: perfil.sucursal.trim(),
        ubicacion: perfil.ubicacion.trim(),
      };
      const cuentaPrevia = leerCuentaActual();

      guardarDatoLocal(CLAVE_PERFIL_ADMIN, perfilNormalizado);
      const cuentaGuardada = guardarCuentaActual({
        ...cuentaPrevia,
        username: perfilNormalizado.correo,
        email: perfilNormalizado.correo,
        name: perfilNormalizado.nombre,
        role: cuentaPrevia.role || 'Administrador',
        updatedAt: new Date().toISOString(),
      });

      setPerfil(perfilNormalizado);
      setCuentaActual(cuentaGuardada);
      setGuardando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2600);
    }, 700);
  };

  return (
    <div className="perfil-admin flex min-h-screen flex-col gap-6 pb-10 text-white">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {resumenPerfil.map((item) => (
          <TarjetaResumenPerfil key={item.titulo} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="tarjeta-perfil relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-6 text-center shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-70" />
          <div className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-2xl border border-red-500/20 bg-red-600/10 text-4xl font-black text-red-500 shadow-xl shadow-red-950/20">
            {iniciales}
          </div>

          <h2 className="mt-5 text-xl font-black text-white">{perfil.nombre || 'Administrador'}</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-red-500">{perfil.cargo}</p>

          <div className="mt-6 space-y-3 text-left">
            <DatoPerfil icono={Mail} etiqueta="Correo" valor={perfil.correo} />
            <DatoPerfil icono={Phone} etiqueta="Telefono" valor={perfil.telefono} />
            <DatoPerfil icono={Building2} etiqueta="Sucursal" valor={perfil.sucursal} />
            <DatoPerfil icono={ShieldCheck} etiqueta="Rol" valor="Administrador" />
          </div>
        </aside>

        <form
          onSubmit={guardarPerfil}
          className="tarjeta-perfil relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6 lg:p-8"
        >
          <div className="mb-6 flex flex-col gap-3 border-b border-white/5 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Cuenta local</p>
              <h1 className="mt-1 text-2xl font-black text-white">Datos del administrador</h1>
              <p className="mt-1 text-sm text-gray-400">Actualiza la informacion visible de la cuenta logueada.</p>
            </div>
            {guardado && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[10px] font-bold uppercase text-green-500">
                <CheckCircle2 size={13} />
                Guardado
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <CampoPerfil icono={User} etiqueta="Nombre completo" nombre="nombre" valor={perfil.nombre} onChange={actualizarCampo} />
            <CampoPerfil icono={Mail} etiqueta="Correo administrativo" nombre="correo" type="email" valor={perfil.correo} onChange={actualizarCampo} />
            <CampoPerfil icono={Phone} etiqueta="Telefono / WhatsApp" nombre="telefono" valor={perfil.telefono} onChange={actualizarCampo} />
            <CampoPerfil icono={KeyRound} etiqueta="Cargo" nombre="cargo" valor={perfil.cargo} onChange={actualizarCampo} />
            <CampoPerfil icono={Building2} etiqueta="Sucursal principal" nombre="sucursal" valor={perfil.sucursal} onChange={actualizarCampo} />
            <CampoPerfil icono={MapPin} etiqueta="Ubicacion" nombre="ubicacion" valor={perfil.ubicacion} onChange={actualizarCampo} />
          </div>

          <div className="mt-8 flex justify-end border-t border-white/5 pt-5">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-7 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : <><Save size={17} /> Guardar datos</>}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="tarjeta-perfil rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Operaciones</p>
              <h2 className="mt-1 text-lg font-black text-white">Gimnasios administrados</h2>
            </div>
            <Activity className="text-red-500" size={22} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {gimnasiosAdministrados.map((gimnasio) => (
              <TarjetaGimnasio
                key={gimnasio.nombre}
                gimnasio={gimnasio}
                activo={gimnasio.id === gimnasioActivoId}
                onClick={() => setGimnasioActivoId(gimnasio.id)}
              />
            ))}
          </div>

          <PanelGimnasioGlobal gimnasio={gimnasioActivo} />
        </section>

        <section className="tarjeta-perfil rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Conteo limpio</p>
              <h2 className="mt-1 text-lg font-black text-white">Usuarios por sucursal</h2>
            </div>
            <BarChart3 className="text-red-500" size={22} />
          </div>

          <div className="space-y-4">
            {conteoUsuariosPorSucursal.map((sucursal) => (
              <BarraUsuariosSucursal key={sucursal.sucursal} sucursal={sucursal} maximo={usuariosMaximos} />
            ))}
          </div>
        </section>
      </div>

      {mensajePersonal && (
        <div className={`flex items-center gap-2 rounded-2xl border p-4 text-xs font-bold ${
          mensajePersonal.tipo === 'exito'
            ? 'border-green-500/20 bg-green-500/10 text-green-500'
            : 'border-red-500/20 bg-red-500/10 text-red-400'
        }`}>
          {mensajePersonal.tipo === 'exito' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {mensajePersonal.texto}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ListadoPersonas
          titulo="Administradores creados"
          subtitulo="Cuentas administrativas creadas desde tu perfil"
          icono={UserRoundCog}
          personas={administradoresCreados}
          tipo="admin"
          onEliminar={eliminarPersona}
        />
        <ListadoPersonas
          titulo="Entrenadores asignados"
          subtitulo="Personal tecnico visible para tus gimnasios"
          icono={Dumbbell}
          personas={entrenadoresAsignados}
          tipo="entrenador"
          onEliminar={eliminarPersona}
        />
        <ListadoPersonas
          titulo="Recepcionistas asignados"
          subtitulo="Personal de recepcion visible por sucursal"
          icono={User}
          personas={recepcionistasAsignados}
          tipo="recepcion"
          onEliminar={eliminarPersona}
        />
      </div>
    </div>
  );
};

const DatoPerfil = ({ icono: Icono, etiqueta, valor }) => (
  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#111]/60 p-3">
    <span className="rounded-lg bg-white/5 p-2 text-red-500">
      <Icono size={16} />
    </span>
    <span className="min-w-0">
      <span className="block text-[9px] font-black uppercase tracking-widest text-gray-500">{etiqueta}</span>
      <span className="block truncate text-xs font-bold text-white">{valor}</span>
    </span>
  </div>
);

const CampoPerfil = ({ icono: Icono, etiqueta, nombre, valor, onChange, type = 'text' }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">{etiqueta}</span>
    <span className="relative block">
      <Icono className="absolute left-3 top-3.5 text-gray-600" size={16} />
      <input
        required
        type={type}
        name={nombre}
        value={valor}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-[#111] py-3 pl-10 pr-4 text-sm text-white outline-none transition-all focus:border-red-600"
      />
    </span>
  </label>
);

const TarjetaResumenPerfil = ({ titulo, valor, detalle, icono: Icono, color }) => (
  <article className="tarjeta-resumen-perfil flex items-center justify-between rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-xl">
    <div className="min-w-0">
      <p className="truncate text-[10px] font-black uppercase tracking-widest text-gray-500">{titulo}</p>
      <h3 className="mt-1 text-2xl font-black text-white">{valor}</h3>
      <p className="mt-1 truncate text-[10px] font-bold text-gray-500">{detalle}</p>
    </div>
    <span className={`ml-3 rounded-xl bg-white/5 p-3 ${color}`}>
      <Icono size={22} />
    </span>
  </article>
);

const formatearMonedaPanel = (valor) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valor);

const TarjetaGimnasio = ({ gimnasio, activo, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
      activo
        ? 'border-red-500/50 bg-red-500/10 shadow-lg shadow-red-950/20'
        : 'border-white/5 bg-[#111]/60 hover:border-red-500/25'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-black text-white">{gimnasio.nombre}</h3>
        <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <MapPin size={11} />
          {gimnasio.ciudad}
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase text-red-500">
        {gimnasio.estado}
      </span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-white/5 p-3">
        <p className="text-[9px] font-black uppercase text-gray-500">Usuarios</p>
        <p className="mt-1 text-lg font-black text-white">{gimnasio.usuarios}</p>
      </div>
      <div className="rounded-xl bg-white/5 p-3">
        <p className="text-[9px] font-black uppercase text-gray-500">Personal</p>
        <p className="mt-1 text-lg font-black text-white">{gimnasio.personal}</p>
      </div>
    </div>
  </button>
);

const PanelGimnasioGlobal = ({ gimnasio }) => (
  <div className="panel-gimnasio-global mt-5 rounded-2xl border border-white/5 bg-[#111]/60 p-4">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Vista global</p>
        <h3 className="mt-1 text-lg font-black text-white">{gimnasio.nombre}</h3>
        <p className="mt-1 text-xs font-bold text-gray-500">{gimnasio.ciudad} - {gimnasio.estado}</p>
      </div>
      <span className="w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-black uppercase text-green-500">
        Datos sincronizados
      </span>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <DatoGimnasio titulo="Socios" valor={gimnasio.usuarios} detalle="Activos" />
      <DatoGimnasio titulo="Efectivo dia" valor={formatearMonedaPanel(gimnasio.efectivoDia)} detalle="Caja actual" />
      <DatoGimnasio titulo="Ventas" valor={formatearMonedaPanel(gimnasio.ventas)} detalle="Mes actual" />
      <DatoGimnasio titulo="Asistencias" valor={gimnasio.asistencias} detalle="Hoy" />
    </div>

    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="dato-gimnasio-global rounded-xl bg-white/5 p-3">
        <p className="text-[9px] font-black uppercase text-gray-500">Personal</p>
        <p className="mt-1 text-lg font-black text-white">{gimnasio.personal}</p>
      </div>
      <div className="dato-gimnasio-global rounded-xl bg-white/5 p-3">
        <p className="text-[9px] font-black uppercase text-gray-500">Pagos pendientes</p>
        <p className="mt-1 text-lg font-black text-orange-400">{gimnasio.pagosPendientes}</p>
      </div>
      <div className="dato-gimnasio-global rounded-xl bg-white/5 p-3">
        <p className="text-[9px] font-black uppercase text-gray-500">Estado global</p>
        <p className="mt-1 text-lg font-black text-green-500">{gimnasio.estado}</p>
      </div>
    </div>
  </div>
);

const DatoGimnasio = ({ titulo, valor, detalle }) => (
  <div className="dato-gimnasio-global rounded-xl border border-white/5 bg-[#090909]/70 p-3">
    <p className="text-[9px] font-black uppercase text-gray-500">{titulo}</p>
    <p className="mt-1 truncate text-base font-black text-white sm:text-lg">{valor}</p>
    <p className="mt-1 text-[10px] font-bold text-gray-500">{detalle}</p>
  </div>
);

const BarraUsuariosSucursal = ({ sucursal, maximo }) => {
  const porcentaje = Math.round((sucursal.usuarios / maximo) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="truncate text-xs font-bold text-white">{sucursal.sucursal}</span>
        <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[10px] font-black text-gray-400">
          {sucursal.usuarios} usuarios
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="barra-sucursal h-full rounded-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400"
          style={{ '--ancho-barra': `${porcentaje}%` }}
        />
      </div>
    </div>
  );
};

const ListadoPersonas = ({ titulo, subtitulo, icono: Icono, personas, tipo, onEliminar }) => (
  <section className="tarjeta-perfil rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{tipo}</p>
        <h2 className="mt-1 text-lg font-black text-white">{titulo}</h2>
        <p className="mt-1 text-xs text-gray-500">{subtitulo}</p>
      </div>
      <Icono className="text-red-500" size={22} />
    </div>

    <div className="space-y-3">
      {personas.map((persona) => (
        <FilaPersona key={persona.id || `${persona.nombre}-${persona.sucursal}`} persona={persona} tipo={tipo} onEliminar={onEliminar} />
      ))}
    </div>
  </section>
);

const FilaPersona = ({ persona, tipo, onEliminar }) => (
  <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#111]/60 p-3 transition-all hover:border-white/10">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10 text-xs font-black text-red-500">
      {obtenerInicialesCuenta({ name: persona.nombre }, tipo === 'admin' ? 'AD' : tipo === 'recepcion' ? 'RC' : 'EN')}
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-black text-white">{persona.nombre}</p>
      <p className="mt-0.5 truncate text-[10px] font-medium text-gray-500">
        {persona.rol || persona.especialidad} - {persona.sucursal}
      </p>
    </div>
    <span className="hidden rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-gray-500 sm:inline-flex">
      {persona.estado || persona.correo}
    </span>
    <button
      type="button"
      disabled={!persona.puedeEliminar}
      onClick={() => onEliminar(persona)}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
        persona.puedeEliminar
          ? 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white'
          : 'cursor-not-allowed border-white/5 bg-white/5 text-gray-600'
      }`}
      title={persona.puedeEliminar ? 'Eliminar personal creado por tu cuenta' : 'Solo puedes eliminar personal creado por tu cuenta'}
      aria-label={`Eliminar ${persona.nombre}`}
    >
      <Trash2 size={15} />
    </button>
  </div>
);

export default PerfilAdmin;
