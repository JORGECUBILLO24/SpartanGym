import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { obtenerInicialesCuenta } from '../../../utils/cuentaActual';
import { prepararImagen } from '../../../utils/imagen';
import Avatar from '../../../components/Avatar';
import { operacionApi, personalApi } from '../../../services/api';

const perfilRecepcionBase = {
  nombre: 'Recepcionista',
  correo: '',
  telefono: '+505 0000 0000',
  rol: 'Recepcionista',
  gimnasio: 'Base de datos',
  ubicacion: 'Base de datos',
  estado: 'Activo',
};

const nombreCompleto = (persona) =>
  [persona.nombres, persona.apellidos].filter(Boolean).join(' ') || persona.email || 'Sin nombre';

const mapearRecepcionista = (persona) => ({
  id: persona.id,
  nombre: persona.nombres || '',
  apellido: persona.apellidos || '',
  correo: persona.email || '',
  telefono: '+505 0000 0000',
  rol: 'Recepcionista',
  gimnasio: 'Base de datos',
  estado: persona.activo ? 'Activo' : 'Inactivo',
});

const Perfil = () => {
  const [recepcionistas, setRecepcionistas] = useState([]);
  const [perfilActualApi, setPerfilActualApi] = useState(perfilRecepcionBase);
  const [errorApi, setErrorApi] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [errorFoto, setErrorFoto] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const fotoTocadaLocalmente = useRef(false);

  useEffect(() => {
    Promise.allSettled([
      operacionApi.perfil(),
      personalApi.listar(),
    ]).then(([perfil, personal]) => {
      if (perfil.status === 'fulfilled') {
        const datos = perfil.value;
        setPerfilActualApi({
          ...perfilRecepcionBase,
          nombre: nombreCompleto(datos),
          correo: datos.email || '',
          telefono: datos.telefono || '+505 0000 0000',
          rol: datos.rol || 'Recepcionista',
          estado: datos.activo ? 'Activo' : 'Inactivo',
        });
        if (!fotoTocadaLocalmente.current) {
          setFotoUrl(datos.fotoUrl || '');
        }
      } else {
        setErrorApi('No se pudo cargar el perfil desde la API.');
      }

      if (personal.status === 'fulfilled') {
        setRecepcionistas(
          personal.value
            .filter((persona) => persona.rol === 'ROLE_RECEPCIONISTA')
            .map(mapearRecepcionista)
        );
      }
    });
  }, []);

  const cambiarFoto = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo || subiendoFoto) return;
    setErrorFoto('');
    setSubiendoFoto(true);
    fotoTocadaLocalmente.current = true;
    try {
      const dataUrl = await prepararImagen(archivo, { maxLado: 512, calidad: 0.8, maxBytesEntrada: 5 * 1024 * 1024 });
      await operacionApi.actualizarFoto(dataUrl);
      setFotoUrl(dataUrl);
    } catch (error) {
      setErrorFoto(error.message || 'No se pudo actualizar la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const quitarFoto = async () => {
    if (subiendoFoto) return;
    setErrorFoto('');
    setSubiendoFoto(true);
    fotoTocadaLocalmente.current = true;
    try {
      await operacionApi.actualizarFoto('');
      setFotoUrl('');
    } catch (error) {
      setErrorFoto(error.message || 'No se pudo quitar la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const perfilActual = useMemo(() => {
    const recepcionistaActual = recepcionistas.find((persona) => persona.correo === perfilActualApi.correo);
    return recepcionistaActual
      ? { ...recepcionistaActual, nombre: [recepcionistaActual.nombre, recepcionistaActual.apellido].filter(Boolean).join(' '), ubicacion: recepcionistaActual.gimnasio }
      : perfilActualApi;
  }, [perfilActualApi, recepcionistas]);

  const recepcionistasVisibles = useMemo(() => {
    const existePerfilActual = recepcionistas.some((persona) => persona.correo === perfilActual.correo);
    if (existePerfilActual || !perfilActual.correo) return recepcionistas;

    return [
      {
        id: 'perfil-actual',
        nombre: perfilActual.nombre,
        apellido: '',
        correo: perfilActual.correo,
        telefono: perfilActual.telefono,
        rol: 'Recepcionista',
        gimnasio: perfilActual.gimnasio,
        estado: perfilActual.estado,
      },
      ...recepcionistas,
    ];
  }, [perfilActual, recepcionistas]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-8 text-white sm:gap-6 lg:gap-8">
      <section className="tarjeta-sistema overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-400">Perfil de recepcion</p>
            <h1 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">Equipo de recepcionistas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Consulta tu perfil y la lista completa de recepcionistas asignados a los gimnasios.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <IndicadorPerfil titulo="Recepcionistas" valor={recepcionistasVisibles.length} />
            <IndicadorPerfil titulo="Gimnasios" valor={new Set(recepcionistasVisibles.map((persona) => persona.gimnasio)).size} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <article className="tarjeta-sistema flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 text-center shadow-2xl sm:p-8">
          <Avatar fotoUrl={fotoUrl} nombre={perfilActual.nombre} email={perfilActual.correo} tamano={112} respaldo="RC" />
          <div className="mt-3 flex items-center gap-2">
            <label className={`rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 transition hover:bg-white/10 ${
              subiendoFoto ? 'pointer-events-none cursor-wait opacity-50' : 'cursor-pointer'
            }`}>
              {subiendoFoto ? 'Guardando...' : 'Cambiar foto'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={subiendoFoto} onChange={cambiarFoto} />
            </label>
            {fotoUrl && (
              <button
                type="button"
                onClick={quitarFoto}
                disabled={subiendoFoto}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-400 transition hover:text-white disabled:cursor-wait disabled:opacity-50 disabled:hover:text-gray-400"
              >
                Quitar foto
              </button>
            )}
          </div>
          {errorFoto && <p className="mt-2 text-xs text-red-400">{errorFoto}</p>}
          <h2 className="mt-5 max-w-full break-words text-xl font-black text-white">{perfilActual.nombre}</h2>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-red-500">Recepcionista</p>
          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-400">
            <Building2 size={14} className="shrink-0 text-red-500" />
            <span className="truncate">{perfilActual.gimnasio}</span>
          </div>
        </article>

        <article className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-xl bg-red-600/10 p-3 text-red-500">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Cuenta activa</p>
              <h3 className="text-lg font-black text-white">Datos del perfil</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <DetallePerfil icono={User} etiqueta="Nombre completo" valor={perfilActual.nombre} />
            <DetallePerfil icono={Mail} etiqueta="Correo electronico" valor={perfilActual.correo} />
            <DetallePerfil icono={Phone} etiqueta="Telefono" valor={perfilActual.telefono || '+505 0000 0000'} />
            <DetallePerfil icono={Building2} etiqueta="Gimnasio asignado" valor={perfilActual.gimnasio} />
            <DetallePerfil icono={MapPin} etiqueta="Ubicacion" valor={perfilActual.ubicacion || perfilActual.gimnasio} />
            <DetallePerfil icono={ShieldCheck} etiqueta="Estado" valor={perfilActual.estado || 'Activo'} />
          </div>
        </article>
      </section>

      <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Listado completo</p>
            <h2 className="mt-1 text-xl font-black text-white">Todos los recepcionistas</h2>
            <p className="mt-1 text-sm text-gray-400">Personal visible y sincronizado con el panel administrativo.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-red-500">
            <Users size={14} />
            {recepcionistasVisibles.length} activos
          </span>
        </div>
        {errorApi && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
            {errorApi}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recepcionistasVisibles.map((recepcionista) => (
            <TarjetaRecepcionista
              key={recepcionista.id || recepcionista.correo}
              recepcionista={recepcionista}
              esActual={recepcionista.correo === perfilActual.correo}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const IndicadorPerfil = ({ titulo, valor }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{titulo}</p>
    <p className="mt-1 text-2xl font-black text-white">{valor}</p>
  </div>
);

const DetallePerfil = ({ icono: Icono, etiqueta, valor }) => (
  <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="mb-2 flex items-center gap-2 text-gray-500">
      <Icono size={15} className="shrink-0 text-red-500" />
      <p className="truncate text-[10px] font-black uppercase tracking-widest">{etiqueta}</p>
    </div>
    <p className="break-words border-b border-white/10 pb-2 text-sm font-bold text-white">{valor}</p>
  </div>
);

const TarjetaRecepcionista = ({ recepcionista, esActual }) => {
  const nombre = [recepcionista.nombre, recepcionista.apellido].filter(Boolean).join(' ') || recepcionista.nombre;

  return (
    <article className={`rounded-2xl border p-4 shadow-xl transition-all hover:-translate-y-0.5 ${
      esActual
        ? 'border-red-500/40 bg-red-500/10'
        : 'border-white/10 bg-white/5 hover:border-red-500/25'
    }`}>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#111111] text-sm font-black text-red-500">
          {obtenerInicialesCuenta({ name: nombre, email: recepcionista.correo }, 'RC')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-sm font-black text-white">{nombre}</h3>
            {esActual && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-black uppercase text-white">Tu perfil</span>
            )}
          </div>
          <p className="mt-1 break-all text-[11px] font-medium text-gray-500">{recepcionista.correo || 'Sin correo'}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <MiniDato icono={Building2} valor={recepcionista.gimnasio} />
        <MiniDato icono={Phone} valor={recepcionista.telefono || '+505 0000 0000'} />
        <MiniDato icono={ShieldCheck} valor={recepcionista.estado || 'Activo'} />
      </div>
    </article>
  );
};

const MiniDato = ({ icono: Icono, valor }) => (
  <div className="flex min-w-0 items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs font-bold text-gray-400">
    <Icono size={14} className="shrink-0 text-red-500" />
    <span className="min-w-0 truncate">{valor}</span>
  </div>
);

export default Perfil;
