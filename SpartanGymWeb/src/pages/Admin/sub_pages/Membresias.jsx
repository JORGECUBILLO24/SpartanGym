import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Dumbbell, ImagePlus, Pencil, Save, Trash2 } from 'lucide-react';
import { membresiasApi } from '../../../services/api';
import { prepararImagen } from '../../../utils/imagen';
import { formatearMoneda, MONEDAS_DISPONIBLES, useConfiguracionApp } from '../../../utils/configuracionApp';

const formularioInicial = {
  nombre: '',
  precio: '',
  duracionDias: '30',
  beneficios: '',
};

const Membresias = () => {
  const [formData, setFormData] = useState(formularioInicial);
  const [listaMembresias, setListaMembresias] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [imagenGuardando, setImagenGuardando] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const formularioRef = useRef(null);
  const configuracion = useConfiguracionApp();
  const monedaActual = MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === configuracion.currency) || MONEDAS_DISPONIBLES[1];
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);

  const cargarMembresias = async () => {
    setListaMembresias(await membresiasApi.tipos());
  };

  useEffect(() => {
    Promise.resolve()
      .then(cargarMembresias)
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudo cargar el catalogo desde la API.' }))
      .finally(() => setCargando(false));
  }, []);

  const guardarMembresia = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const precioTexto = String(formData.precio).trim().replace(',', '.');
      if (!/^\d+(?:\.\d{1,2})?$/.test(precioTexto)) throw new Error('Escribe un precio válido, por ejemplo 30.50.');
      const duracionDias = Number(formData.duracionDias);
      if (!Number.isSafeInteger(duracionDias) || duracionDias < 1) throw new Error('Escribe la duración en días, desde 1.');
      const datos = {
        nombre: formData.nombre.trim(),
        precio: Number(precioTexto),
        duracionDias,
        beneficios: formData.beneficios.trim(),
      };
      if (editandoId) await membresiasApi.actualizarTipo(editandoId, datos);
      else await membresiasApi.crearTipo(datos);
      setFormData(formularioInicial);
      setEditandoId(null);
      await cargarMembresias();
      setMensaje({ tipo: 'exito', texto: 'Plan guardado. Sus detalles se mostrarán en la app móvil.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo guardar el plan.' });
    } finally {
      setGuardando(false);
    }
  };

  const editarMembresia = (membresia) => {
    setEditandoId(membresia.id);
    setFormData({ nombre: membresia.nombre, precio: String(membresia.precio), duracionDias: String(membresia.duracionDias), beneficios: membresia.beneficios || '' });
    setMensaje(null);
    formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const eliminarMembresia = async (id) => {
    setMensaje(null);
    try {
      await membresiasApi.eliminarTipo(id);
      await cargarMembresias();
      setMensaje({ tipo: 'exito', texto: 'Membresia eliminada.' });
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo eliminar. Puede tener pagos o socios asociados.' });
    }
  };

  const cambiarImagen = async (id, archivo) => {
    if (!archivo) return;
    setMensaje(null);
    setImagenGuardando(id);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
        throw new Error('Usa una imagen PNG, JPG o WebP.');
      }
      const imagenUrl = await prepararImagen(archivo, { maxLado: 900, calidad: 0.8 });
      await membresiasApi.actualizarImagen(id, imagenUrl);
      await cargarMembresias();
      setMensaje({ tipo: 'exito', texto: 'Imagen reemplazada. La app móvil mostrará la nueva imagen.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message || 'No se pudo actualizar la imagen.' });
    } finally {
      setImagenGuardando(null);
    }
  };

  return (
    <div className="workspace-page w-full text-white">
      {mensaje && (
        <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
          mensaje.tipo === 'exito'
            ? 'border-green-500/20 bg-green-500/10 text-green-400'
            : 'border-red-500/20 bg-red-500/10 text-red-400'
        }`}>
          <AlertCircle size={15} />
          {mensaje.texto}
        </div>
      )}

      <div className="workspace-grid workspace-grid--split-wide">
        <form ref={formularioRef} onSubmit={guardarMembresia} className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Catalogo BD</p>
            <h2 className="mt-1 text-xl font-black text-white">{editandoId ? 'Editar membresía' : 'Crear membresía'}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Los planes guardados aqui se reflejan en recepcion, pagos y app movil.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-semibold text-gray-300">Nombre del plan
              <input required maxLength={50} placeholder="Ej. Mensual" value={formData.nombre} className="campo-sistema mt-2 w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none" onChange={(evento) => setFormData({ ...formData, nombre: evento.target.value })} />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-gray-300">Precio ({monedaActual.simbolo})
                <input required type="text" inputMode="decimal" placeholder="Ej. 30.50" value={formData.precio} className="campo-sistema mt-2 w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none" onChange={(evento) => setFormData({ ...formData, precio: evento.target.value })} />
              </label>
              <label className="block text-xs font-semibold text-gray-300">Duración en días
                <input required min="1" step="1" type="number" inputMode="numeric" placeholder="Ej. 45" value={formData.duracionDias} className="campo-sistema mt-2 w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none" onChange={(evento) => setFormData({ ...formData, duracionDias: evento.target.value })} />
              </label>
            </div>
            <label className="block text-xs font-semibold text-gray-300">Beneficios del plan
              <textarea rows={3} maxLength={2000} placeholder={'Escribe un beneficio por línea\nAcceso a todas las áreas\nEvaluación mensual'} value={formData.beneficios} className="campo-sistema mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none" onChange={(evento) => setFormData({ ...formData, beneficios: evento.target.value })} />
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            {editandoId && <button type="button" onClick={() => { setEditandoId(null); setFormData(formularioInicial); }} className="min-h-11 rounded-xl border border-white/15 px-4 text-sm text-gray-300">Cancelar</button>}
            <button disabled={guardando} type="submit" className="boton-primario flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">
              <Save size={18} /> {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar membresía'}
            </button>
          </div>
        </form>

        <div className="flex w-full min-w-0 flex-col gap-6">
          <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Disponibles</p>
                <h3 className="text-lg font-black text-white">Membresias guardadas</h3>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-gray-400">
                {listaMembresias.length} planes
              </span>
            </div>

            <div className="workspace-grid--cards">
              {listaMembresias.map((membresia) => (
                <div key={membresia.id} className="group relative">
                  <TarjetaMembresia data={membresia} formatearMonto={formatearMonto} nombreGimnasio={configuracion.gymName} />
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-bold text-white transition-colors hover:bg-white/10 focus-within:outline-2 focus-within:outline-red-500">
                      <ImagePlus size={16} /> {imagenGuardando === membresia.id ? 'Guardando...' : 'Cambiar imagen'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={imagenGuardando !== null} onChange={(evento) => { cambiarImagen(membresia.id, evento.target.files?.[0]); evento.target.value = ''; }} />
                    </label>
                    <button type="button" onClick={() => editarMembresia(membresia)} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label={`Editar membresía ${membresia.nombre}`}><Pencil size={17} /></button>
                    <button type="button" onClick={() => eliminarMembresia(membresia.id)} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 text-red-400 transition-colors hover:bg-red-600 hover:text-white" aria-label={`Eliminar membresía ${membresia.nombre}`}><Trash2 size={17} /></button>
                  </div>
                </div>
              ))}
              {cargando && listaMembresias.length === 0 && (
                <p role="status" className="col-span-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-gray-400">
                  Cargando planes…
                </p>
              )}
              {!cargando && listaMembresias.length === 0 && (
                <p className="col-span-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-gray-400">
                  {mensaje?.tipo === 'error' ? 'No se pudo cargar el catálogo.' : 'Aún no hay planes guardados. Crea el primer plan para ofrecerlo en recepción.'}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const TarjetaMembresia = ({ data, formatearMonto, nombreGimnasio }) => (
  <article className="relative flex aspect-[16/10] w-full max-w-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#241216] via-[#121216] to-black p-5 shadow-2xl">
    {data.imagenUrl && <img src={data.imagenUrl} className="absolute inset-0 h-full w-full object-cover opacity-80" alt="" loading="lazy" decoding="async" />}
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

    <div className="relative z-10 flex justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500">
          <Dumbbell size={10} /> {nombreGimnasio || 'Tu gimnasio'} · Plan
        </p>
        <h4 className="truncate text-lg font-black text-white">{data.nombre}</h4>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{data.duracionDias} dias</p>
      </div>
      <h3 className="shrink-0 text-xl font-black text-white">{formatearMonto(data.precio)}</h3>
    </div>

    <div className="relative z-10 space-y-1 border-t border-white/10 pt-2">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-300">
        <Check size={10} className="text-green-500" />
        <span className="line-clamp-1">{data.beneficios?.split(/\r?\n/).find((item) => item.trim()) || 'Disponible para pagos y renovaciones'}</span>
      </div>
    </div>
  </article>
);

export default Membresias;
