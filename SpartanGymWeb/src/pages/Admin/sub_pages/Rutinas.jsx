import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  Plus,
  Save,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { catalogoApi, personalApi, rutinasApi, sociosApi } from '../../../services/api';

const tiposRutina = ['Hipertrofia', 'Fuerza', 'Definicion', 'Resistencia', 'Salud'];
const tiposEjercicio = ['Fuerza', 'Cardio', 'Movilidad', 'Funcional', 'Estiramiento'];

const plantillasGenero = [
  {
    id: 'Hombres',
    titulo: 'Rutina para hombre',
    objetivo: 'Hipertrofia, fuerza progresiva y control tecnico.',
  },
  {
    id: 'Mujeres',
    titulo: 'Rutina para mujer',
    objetivo: 'Tonificacion, gluteos, fuerza funcional y resistencia.',
  },
  {
    id: 'Todos',
    titulo: 'Rutina mixta',
    objetivo: 'Plan equilibrado adaptable para cualquier socio.',
  },
];

const obtenerFechaIso = (fecha = new Date()) => {
  const normalizada = new Date(fecha);
  normalizada.setMinutes(normalizada.getMinutes() - normalizada.getTimezoneOffset());
  return normalizada.toISOString().slice(0, 10);
};

const sumarDiasIso = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return obtenerFechaIso(fecha);
};

const crearDetalleInicial = (ejercicios = [], fecha = obtenerFechaIso(), orden = 1) => {
  const ejercicio = ejercicios[0];

  return {
    grupoMuscularId: ejercicio?.grupoMuscular?.id ? String(ejercicio.grupoMuscular.id) : '',
    idEjercicio: ejercicio?.id ? String(ejercicio.id) : '',
    ejercicioNombre: ejercicio?.nombre || '',
    tipoEjercicio: 'Fuerza',
    diaProgramado: fecha,
    series: 3,
    repeticiones: 12,
    pesoSugeridoKg: '',
    tiempoDescansoSegundos: 60,
    notas: '',
    orden,
  };
};

const crearFormularioInicial = () => ({
  alcance: 'personal',
  idSocio: '',
  idEntrenador: '',
  nombre: 'Rutina hombre - Hipertrofia',
  generoObjetivo: 'Hombres',
  tipoRutina: 'Hipertrofia',
  fechaInicio: obtenerFechaIso(),
  fechaFin: sumarDiasIso(28),
  objetivo: 'Hipertrofia, fuerza progresiva y control tecnico.',
  notas: '',
  detalles: [crearDetalleInicial()],
});

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';
  const texto = String(fecha);
  const valor = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(Number(texto.slice(0, 4)), Number(texto.slice(5, 7)) - 1, Number(texto.slice(8, 10)))
    : new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Sin fecha';
  return valor.toLocaleDateString('es-NI');
};

const Rutinas = () => {
  const [socios, setSocios] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [ejercicios, setEjercicios] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [formulario, setFormulario] = useState(crearFormularioInicial);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    const [sociosApiData, personalApiData, ejerciciosApiData, rutinasApiData] = await Promise.all([
      sociosApi.listar(),
      personalApi.listar(),
      catalogoApi.ejercicios(),
      rutinasApi.listar(),
    ]);

    const personalActivo = personalApiData.filter((persona) => persona.activo !== false);
    const entrenadorDefault =
      personalActivo.find((persona) => persona.rol === 'ROLE_ENTRENADOR') ||
      personalActivo.find((persona) => ['ROLE_ADMIN', 'ROLE_SUPERADMIN'].includes(persona.rol)) ||
      personalActivo[0];

    setSocios(sociosApiData);
    setPersonal(personalActivo);
    setEjercicios(ejerciciosApiData);
    setRutinas(rutinasApiData);
    setFormulario((actual) => ({
      ...actual,
      idSocio: actual.idSocio || sociosApiData[0]?.id || '',
      idEntrenador: actual.idEntrenador || entrenadorDefault?.id || '',
      detalles: normalizarDetalles(actual.detalles, ejerciciosApiData),
    }));
    setCargando(false);
  }, []);

  useEffect(() => {
    Promise.resolve()
      .then(cargarDatos)
      .catch(() => {
        setCargando(false);
        setMensaje({ tipo: 'error', texto: 'No se pudieron cargar socios, personal o ejercicios desde la API.' });
      });
  }, [cargarDatos]);

  const entrenadores = useMemo(
    () => personal.filter((persona) => ['ROLE_ENTRENADOR', 'ROLE_ADMIN', 'ROLE_SUPERADMIN'].includes(persona.rol)),
    [personal],
  );

  const gruposMusculares = useMemo(() => {
    const grupos = new Map();
    ejercicios.forEach((ejercicio) => {
      if (ejercicio.grupoMuscular?.id) {
        grupos.set(String(ejercicio.grupoMuscular.id), ejercicio.grupoMuscular.nombre);
      }
    });
    return Array.from(grupos, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ejercicios]);

  const ejerciciosPorGrupo = useMemo(() => {
    const grupos = new Map();
    ejercicios.forEach((ejercicio) => {
      const grupoId = String(ejercicio.grupoMuscular?.id || '');
      if (!grupos.has(grupoId)) grupos.set(grupoId, []);
      grupos.get(grupoId).push(ejercicio);
    });
    return grupos;
  }, [ejercicios]);

  const resumenRutinas = useMemo(() => {
    const globales = rutinas.filter((rutina) => rutina.esGlobal).length;
    const personales = rutinas.length - globales;
    return { globales, personales };
  }, [rutinas]);

  const actualizarCampo = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setMensaje(null);
  };

  const seleccionarPlantilla = (plantilla) => {
    setFormulario((actual) => ({
      ...actual,
      generoObjetivo: plantilla.id,
      nombre: plantilla.titulo.replace('para ', '') + ` - ${actual.tipoRutina}`,
      objetivo: plantilla.objetivo,
    }));
  };

  const actualizarDetalle = (index, campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      detalles: actual.detalles.map((detalle, detalleIndex) => {
        if (detalleIndex !== index) return detalle;

        if (campo === 'grupoMuscularId') {
          return {
            ...detalle,
            grupoMuscularId: valor,
            idEjercicio: '',
            ejercicioNombre: '',
          };
        }

        return { ...detalle, [campo]: valor };
      }),
    }));
  };

  const actualizarEjercicioPorNombre = (index, valor, listaEjercicios) => {
    const texto = valor.trim().toLowerCase();
    const ejercicioSeleccionado = listaEjercicios.find((ejercicio) => ejercicio.nombre?.trim().toLowerCase() === texto);

    setFormulario((actual) => ({
      ...actual,
      detalles: actual.detalles.map((detalle, detalleIndex) => (
        detalleIndex === index
          ? {
              ...detalle,
              ejercicioNombre: valor,
              idEjercicio: ejercicioSeleccionado?.id ? String(ejercicioSeleccionado.id) : '',
              grupoMuscularId:
                detalle.grupoMuscularId ||
                (ejercicioSeleccionado?.grupoMuscular?.id ? String(ejercicioSeleccionado.grupoMuscular.id) : ''),
            }
          : detalle
      )),
    }));
  };

  const agregarDetalle = () => {
    setFormulario((actual) => ({
      ...actual,
      detalles: [
        ...actual.detalles,
        crearDetalleInicial(ejercicios, actual.fechaInicio || obtenerFechaIso(), actual.detalles.length + 1),
      ],
    }));
  };

  const eliminarDetalle = (index) => {
    setFormulario((actual) => ({
      ...actual,
      detalles: actual.detalles
        .filter((_, detalleIndex) => detalleIndex !== index)
        .map((detalle, detalleIndex) => ({ ...detalle, orden: detalleIndex + 1 })),
    }));
  };

  const construirPayload = () => ({
    idSocio: formulario.alcance === 'global' ? null : formulario.idSocio,
    idEntrenador: formulario.idEntrenador,
    esGlobal: formulario.alcance === 'global',
    nombre: formulario.nombre.trim(),
    tipoRutina: formulario.tipoRutina,
    generoObjetivo: formulario.generoObjetivo,
    fechaInicio: formulario.fechaInicio || null,
    fechaFin: formulario.fechaFin || null,
    objetivo: formulario.objetivo.trim(),
    notas: formulario.notas.trim() || null,
    detalles: formulario.detalles.map((detalle, index) => ({
      idEjercicio: Number(detalle.idEjercicio),
      tipoEjercicio: detalle.tipoEjercicio,
      diaProgramado: detalle.diaProgramado || null,
      series: Number(detalle.series),
      repeticiones: Number(detalle.repeticiones),
      pesoSugeridoKg: detalle.pesoSugeridoKg === '' ? null : Number(detalle.pesoSugeridoKg),
      tiempoDescansoSegundos: detalle.tiempoDescansoSegundos === '' ? null : Number(detalle.tiempoDescansoSegundos),
      notas: detalle.notas.trim() || null,
      orden: index + 1,
    })),
  });

  const guardarRutina = async (event) => {
    event.preventDefault();
    setMensaje(null);
    setGuardando(true);

    try {
      const payload = construirPayload();

      if (formulario.alcance === 'global') {
        const respuesta = await rutinasApi.crearGlobal(payload);
        setMensaje({
          tipo: 'exito',
          texto: `Rutina global asignada a ${respuesta.rutinasCreadas || 0} socios activos. Se envio aviso por correo.`,
        });
      } else {
        await rutinasApi.crear(payload);
        setMensaje({ tipo: 'exito', texto: 'Rutina personal asignada. Se envio aviso por correo al socio.' });
      }

      await cargarDatos();
      setFormulario((actual) => ({
        ...actual,
        nombre: actual.generoObjetivo === 'Mujeres' ? 'Rutina mujer - Hipertrofia' : 'Rutina hombre - Hipertrofia',
        objetivo: '',
        notas: '',
        detalles: [crearDetalleInicial(ejercicios, actual.fechaInicio || obtenerFechaIso())],
      }));
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo asignar la rutina.' });
    } finally {
      setGuardando(false);
    }
  };

  const formularioInvalido =
    guardando ||
    cargando ||
    !ejercicios.length ||
    !formulario.idEntrenador ||
    !formulario.nombre.trim() ||
    !formulario.objetivo.trim() ||
    (formulario.alcance === 'personal' && !formulario.idSocio) ||
    formulario.detalles.some((detalle) => !detalle.idEjercicio || !detalle.series || !detalle.repeticiones);

  return (
    <div className="pagina-stack flex flex-col gap-6 text-white">
      {mensaje && <Mensaje tipo={mensaje.tipo} texto={mensaje.texto} />}

      <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#101010] p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Panel administrativo</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-white">
              <Dumbbell className="text-red-500" />
              Constructor de rutinas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Crea rutinas personales o globales con fechas de calendario y ejercicios estructurados por grupo muscular.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <ResumenMini valor={rutinas.length} etiqueta="Totales" />
            <ResumenMini valor={resumenRutinas.personales} etiqueta="Personales" />
            <ResumenMini valor={resumenRutinas.globales} etiqueta="Globales" />
          </div>
        </div>

        <form onSubmit={guardarRutina} className="space-y-7">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#080808] p-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">Alcance</p>
                <div className="grid grid-cols-2 gap-2">
                  <BotonSegmento
                    activo={formulario.alcance === 'personal'}
                    icono={UserRound}
                    titulo="Personal"
                    onClick={() => actualizarCampo('alcance', 'personal')}
                  />
                  <BotonSegmento
                    activo={formulario.alcance === 'global'}
                    icono={Users}
                    titulo="Global"
                    onClick={() => actualizarCampo('alcance', 'global')}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">Plantilla</p>
                <div className="space-y-2">
                  {plantillasGenero.map((plantilla) => (
                    <button
                      key={plantilla.id}
                      type="button"
                      onClick={() => seleccionarPlantilla(plantilla)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        formulario.generoObjetivo === plantilla.id
                          ? 'border-red-500/50 bg-red-500/15 text-white'
                          : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="block text-sm font-black">{plantilla.titulo}</span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500">{plantilla.objetivo}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {formulario.alcance === 'personal' && (
                <CampoSelect
                  label="Socio"
                  icono={UserRound}
                  value={formulario.idSocio}
                  onChange={(valor) => actualizarCampo('idSocio', valor)}
                  disabled={cargando}
                >
                  <option value="">Selecciona socio</option>
                  {socios.map((socio) => (
                    <option key={socio.id} value={socio.id}>{socio.nombres} {socio.apellidos}</option>
                  ))}
                </CampoSelect>
              )}

              <CampoSelect
                label="Entrenador"
                icono={Dumbbell}
                value={formulario.idEntrenador}
                onChange={(valor) => actualizarCampo('idEntrenador', valor)}
                disabled={cargando}
              >
                <option value="">Selecciona entrenador</option>
                {entrenadores.map((persona) => (
                  <option key={persona.id} value={persona.id}>{persona.nombres} {persona.apellidos} - {persona.rol}</option>
                ))}
              </CampoSelect>

              <CampoTexto
                label="Nombre de rutina"
                value={formulario.nombre}
                onChange={(valor) => actualizarCampo('nombre', valor)}
                placeholder="Ej. Rutina mujer - Gluteos"
              />

              <CampoSelect
                label="Tipo"
                value={formulario.tipoRutina}
                onChange={(valor) => actualizarCampo('tipoRutina', valor)}
              >
                {tiposRutina.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </CampoSelect>

              <CampoFecha
                label="Fecha de inicio"
                value={formulario.fechaInicio}
                onChange={(valor) => actualizarCampo('fechaInicio', valor)}
              />

              <CampoFecha
                label="Fecha final"
                value={formulario.fechaFin}
                min={formulario.fechaInicio}
                onChange={(valor) => actualizarCampo('fechaFin', valor)}
              />

              <div className="md:col-span-2 2xl:col-span-3">
                <CampoTexto
                  label="Objetivo"
                  value={formulario.objetivo}
                  onChange={(valor) => actualizarCampo('objetivo', valor)}
                  placeholder="Ej. Gluteos, fuerza, hipertrofia, definicion"
                />
              </div>

              <div className="md:col-span-2 2xl:col-span-3">
                <CampoArea
                  label="Notas para el socio"
                  value={formulario.notas}
                  onChange={(valor) => actualizarCampo('notas', valor)}
                  placeholder="Indicaciones generales, calentamiento o recomendaciones."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-black text-white">Ejercicios del plan</h3>
                <p className="text-xs text-gray-500">Cada ejercicio incluye grupo muscular, tipo, fecha, series, repeticiones, peso y descanso.</p>
              </div>
              <button
                type="button"
                onClick={agregarDetalle}
                disabled={!ejercicios.length}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition-colors hover:border-red-500/30 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:text-gray-600"
              >
                <Plus size={16} />
                Agregar ejercicio
              </button>
            </div>

            {!ejercicios.length && (
              <Mensaje tipo="error" texto="No hay ejercicios en el catalogo. Registra ejercicios en la base de datos antes de asignar rutinas." />
            )}

            <div className="space-y-3">
              {formulario.detalles.map((detalle, index) => {
                const ejerciciosGrupo = ejerciciosPorGrupo.get(String(detalle.grupoMuscularId)) || ejercicios;

                return (
                  <div key={`${index}-${detalle.idEjercicio}`} className="rounded-2xl border border-white/10 bg-[#080808] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Ejercicio {index + 1}</p>
                        <p className="mt-1 text-xs text-gray-500">Configura el bloque de entrenamiento.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarDetalle(index)}
                        disabled={formulario.detalles.length === 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition-colors hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-gray-700"
                        aria-label="Eliminar ejercicio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.25fr_150px_150px_100px_100px_110px_120px]">
                      <CampoSelect
                        label="Grupo muscular"
                        value={detalle.grupoMuscularId}
                        onChange={(valor) => actualizarDetalle(index, 'grupoMuscularId', valor)}
                      >
                        <option value="">Selecciona grupo</option>
                        {gruposMusculares.map((grupo) => (
                          <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                        ))}
                      </CampoSelect>

                      <CampoEjercicioTexto
                        label="Ejercicio"
                        value={detalle.ejercicioNombre || ''}
                        opciones={ejerciciosGrupo}
                        listId={`ejercicios-rutina-${index}`}
                        onChange={(valor) => actualizarEjercicioPorNombre(index, valor, ejerciciosGrupo)}
                      />

                      <CampoSelect
                        label="Tipo ejercicio"
                        value={detalle.tipoEjercicio}
                        onChange={(valor) => actualizarDetalle(index, 'tipoEjercicio', valor)}
                      >
                        {tiposEjercicio.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                      </CampoSelect>

                      <CampoFecha
                        label="Fecha"
                        value={detalle.diaProgramado}
                        min={formulario.fechaInicio}
                        max={formulario.fechaFin || undefined}
                        onChange={(valor) => actualizarDetalle(index, 'diaProgramado', valor)}
                      />

                      <CampoNumero label="Series" value={detalle.series} onChange={(valor) => actualizarDetalle(index, 'series', valor)} />
                      <CampoNumero label="Reps" value={detalle.repeticiones} onChange={(valor) => actualizarDetalle(index, 'repeticiones', valor)} />
                      <CampoNumero label="Peso kg" value={detalle.pesoSugeridoKg} onChange={(valor) => actualizarDetalle(index, 'pesoSugeridoKg', valor)} requerido={false} />
                      <CampoNumero label="Descanso" value={detalle.tiempoDescansoSegundos} onChange={(valor) => actualizarDetalle(index, 'tiempoDescansoSegundos', valor)} requerido={false} />
                    </div>

                    <div className="mt-3">
                      <CampoTexto
                        label="Nota del ejercicio"
                        value={detalle.notas}
                        onChange={(valor) => actualizarDetalle(index, 'notas', valor)}
                        placeholder="Ej. Controlar tecnica, tempo 3-1-1, no bloquear rodillas"
                        requerido={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:gap-4">
              <span className="inline-flex items-center gap-2"><Calendar size={14} /> {formatearFecha(formulario.fechaInicio)} - {formatearFecha(formulario.fechaFin)}</span>
              <span className="inline-flex items-center gap-2"><Clock size={14} /> {formulario.detalles.length} ejercicios</span>
            </div>
            <button
              type="submit"
              disabled={formularioInvalido}
              className="boton-primario inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-950 disabled:text-red-200 sm:w-auto"
            >
              <Save size={18} />
              {guardando ? 'Asignando...' : formulario.alcance === 'global' ? 'Asignar global' : 'Asignar rutina'}
            </button>
          </div>
        </form>
      </section>

      <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#101010] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Historial API</p>
            <h3 className="text-lg font-black text-white">Rutinas asignadas</h3>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-gray-400">
            {rutinas.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500">
                <th className="pb-3 pr-4">Rutina</th>
                <th className="pb-3 pr-4">Alcance</th>
                <th className="pb-3 pr-4">Socio</th>
                <th className="pb-3 pr-4">Entrenador</th>
                <th className="pb-3 pr-4">Fechas</th>
                <th className="pb-3 pr-4">Ejercicios</th>
                <th className="pb-3">Asignada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rutinas.map((rutina) => (
                <tr key={rutina.id} className="hover:bg-white/[0.03]">
                  <td className="py-4 pr-4">
                    <p className="max-w-[260px] truncate font-black text-white">{rutina.nombre || rutina.objetivo}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-red-300">{rutina.generoObjetivo || 'Todos'} / {rutina.tipoRutina || 'General'}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                      rutina.esGlobal ? 'bg-blue-500/10 text-blue-300' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {rutina.esGlobal ? 'Global' : 'Personal'}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-bold text-white">{rutina.socio}</td>
                  <td className="py-4 pr-4 text-gray-400">{rutina.entrenador}</td>
                  <td className="py-4 pr-4 text-gray-400">{formatearFecha(rutina.fechaInicio)} - {formatearFecha(rutina.fechaFin)}</td>
                  <td className="py-4 pr-4 text-gray-400">{rutina.ejercicios?.length || 0}</td>
                  <td className="py-4 text-gray-500">{rutina.fechaAsignacion ? new Date(rutina.fechaAsignacion).toLocaleDateString('es-NI') : 'N/A'}</td>
                </tr>
              ))}
              {!rutinas.length && (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-sm text-gray-500">
                    No hay rutinas asignadas todavia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const normalizarDetalles = (detalles, ejercicios) => {
  if (!detalles?.length) {
    return [crearDetalleInicial(ejercicios)];
  }

  return detalles.map((detalle, index) => {
    const ejercicioActual = ejercicios.find((ejercicio) => String(ejercicio.id) === String(detalle.idEjercicio)) || ejercicios[0];
    return {
      ...detalle,
      grupoMuscularId: detalle.grupoMuscularId || (ejercicioActual?.grupoMuscular?.id ? String(ejercicioActual.grupoMuscular.id) : ''),
      idEjercicio: detalle.idEjercicio || (ejercicioActual?.id ? String(ejercicioActual.id) : ''),
      ejercicioNombre: detalle.ejercicioNombre || ejercicioActual?.nombre || '',
      diaProgramado: detalle.diaProgramado || obtenerFechaIso(),
      tipoEjercicio: detalle.tipoEjercicio || 'Fuerza',
      notas: detalle.notas || '',
      orden: index + 1,
    };
  });
};

const ResumenMini = ({ valor, etiqueta }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
    <p className="text-lg font-black text-white">{valor}</p>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{etiqueta}</p>
  </div>
);

const BotonSegmento = ({ activo, icono: Icono, titulo, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black uppercase transition-all ${
      activo ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icono size={15} />
    {titulo}
  </button>
);

const Mensaje = ({ tipo, texto }) => (
  <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
    tipo === 'exito'
      ? 'border-green-500/20 bg-green-500/10 text-green-400'
      : 'border-red-500/20 bg-red-500/10 text-red-400'
  }`}>
    {tipo === 'exito' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
    {texto}
  </div>
);

const CampoTexto = ({ label, value, onChange, placeholder, requerido = true }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
    <input
      required={requerido}
      value={value}
      onChange={(evento) => onChange(evento.target.value)}
      className="campo-sistema w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-600"
      placeholder={placeholder}
    />
  </label>
);

const CampoEjercicioTexto = ({ label, value, onChange, opciones, listId }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
    <input
      required
      value={value}
      list={listId}
      onChange={(evento) => onChange(evento.target.value)}
      className="campo-sistema w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-600"
      placeholder="Escribe el nombre del ejercicio"
    />
    <datalist id={listId}>
      {opciones.map((ejercicio) => (
        <option key={ejercicio.id} value={ejercicio.nombre} />
      ))}
    </datalist>
  </label>
);

const CampoArea = ({ label, value, onChange, placeholder }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
    <textarea
      value={value}
      onChange={(evento) => onChange(evento.target.value)}
      rows={3}
      className="campo-sistema w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-600"
      placeholder={placeholder}
    />
  </label>
);

const CampoFecha = ({ label, value, onChange, min, max }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
    <input
      type="date"
      required
      value={value || ''}
      min={min}
      max={max}
      onChange={(evento) => onChange(evento.target.value)}
      className="campo-sistema w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-600"
    />
  </label>
);

const CampoSelect = ({ label, icono: Icono, value, onChange, disabled, children }) => {
  const [abierto, setAbierto] = useState(false);
  const refContenedor = useRef(null);

  // Extraer opciones de los children (elementos <option>)
  const opciones = useMemo(() => {
    const lista = [];
    const procesar = (nodos) => {
      [].concat(nodos || []).forEach((nodo) => {
        if (!nodo) return;
        if (Array.isArray(nodo)) { procesar(nodo); return; }
        if (nodo.type === 'option') {
          lista.push({ value: nodo.props.value ?? '', label: nodo.props.children });
        }
      });
    };
    procesar(children);
    return lista;
  }, [children]);

  const etiquetaSeleccionada = opciones.find((o) => String(o.value) === String(value))?.label || '';
  const esPlaceholder = value === '' || value == null;

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => {
      if (refContenedor.current && !refContenedor.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  return (
    <div className="block" ref={refContenedor}>
      <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setAbierto((v) => !v)}
        className={`campo-sistema relative flex w-full cursor-pointer items-center gap-2 rounded-xl border ${
          abierto ? 'border-red-600/60' : 'border-white/10'
        } bg-[#050505] ${Icono ? 'pl-4' : 'pl-4'} pr-4 py-3 text-sm outline-none transition-all disabled:cursor-wait`}
      >
        {Icono && <Icono size={16} className="shrink-0 text-gray-500" />}
        <span className={`flex-1 truncate text-left ${esPlaceholder ? 'text-gray-600' : 'text-white'}`}>
          {esPlaceholder ? (opciones[0]?.label || label) : etiquetaSeleccionada}
        </span>
        <ChevronDown
          size={15}
          className={`ml-1 shrink-0 text-gray-500 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div className="absolute z-50 mt-1.5 max-h-60 w-auto min-w-[200px] overflow-y-auto rounded-xl border border-white/10 bg-[#111111] py-1 shadow-2xl shadow-black/60">
          {opciones.map((opcion, i) => {
            const seleccionada = String(opcion.value) === String(value);
            return (
              <button
                key={i}
                type="button"
                onClick={() => { onChange(opcion.value); setAbierto(false); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  seleccionada
                    ? 'bg-red-600/15 text-red-400'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {seleccionada && <Check size={13} className="shrink-0 text-red-400" />}
                <span className={seleccionada ? '' : 'pl-[21px]'}>{opcion.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CampoNumero = ({ label, value, onChange, requerido = true }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
    <input
      aria-label={label}
      type="number"
      min={requerido ? 1 : 0}
      required={requerido}
      value={value}
      onChange={(evento) => onChange(evento.target.value)}
      className="campo-sistema w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-sm text-white outline-none focus:border-red-600"
      placeholder={label}
    />
  </label>
);

export default Rutinas;
