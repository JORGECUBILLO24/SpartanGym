import { useEffect, useState } from 'react';
import { AlertCircle, Check, Dumbbell, Save, Trash2 } from 'lucide-react';
import imgMembresiaCard from '../../../assets/MembresiaSpartan.webp';
import { membresiasApi } from '../../../services/api';
import { formatearMoneda, MONEDAS_DISPONIBLES, useConfiguracionApp } from '../../../utils/configuracionApp';

const formularioInicial = {
  nombre: '',
  precio: '',
  duracionDias: 30,
};

const opcionesDuracion = [
  { label: '1 Dia', value: 1 },
  { label: '15 Dias', value: 15 },
  { label: '1 Mes', value: 30 },
  { label: '3 Meses', value: 90 },
  { label: '6 Meses', value: 180 },
  { label: '1 Ano', value: 365 },
];

const Membresias = () => {
  const [formData, setFormData] = useState(formularioInicial);
  const [listaMembresias, setListaMembresias] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const configuracion = useConfiguracionApp();
  const monedaActual = MONEDAS_DISPONIBLES.find((moneda) => moneda.codigo === configuracion.currency) || MONEDAS_DISPONIBLES[1];
  const formatearMonto = (valor) => formatearMoneda(valor, configuracion.currency);

  const cargarMembresias = async () => {
    setListaMembresias(await membresiasApi.tipos());
  };

  useEffect(() => {
    Promise.resolve()
      .then(cargarMembresias)
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudo cargar el catalogo desde la API.' }));
  }, []);

  const guardarMembresia = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      await membresiasApi.crearTipo({
        nombre: formData.nombre.trim(),
        precio: Number(formData.precio),
        duracionDias: Number(formData.duracionDias),
      });
      setFormData(formularioInicial);
      await cargarMembresias();
      setMensaje({ tipo: 'exito', texto: 'Membresia guardada en la base de datos.' });
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar. Revisa nombre unico, precio y sesion admin.' });
    } finally {
      setGuardando(false);
    }
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

  return (
    <div className="pagina-stack w-full text-white">
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

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <form onSubmit={guardarMembresia} className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Catalogo BD</p>
            <h2 className="mt-1 text-xl font-black text-white">Crear membresia</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Los planes guardados aqui se reflejan en recepcion, pagos y app movil.
            </p>
          </div>

          <div className="space-y-4">
            <input
              required
              placeholder="Nombre del plan"
              value={formData.nombre}
              className="campo-sistema w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none"
              onChange={(evento) => setFormData({ ...formData, nombre: evento.target.value })}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                min="0"
                step="0.01"
                type="number"
                placeholder={`Precio (${monedaActual.simbolo})`}
                value={formData.precio}
                className="campo-sistema w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none"
                onChange={(evento) => setFormData({ ...formData, precio: evento.target.value })}
              />
              <select
                value={formData.duracionDias}
                onChange={(evento) => setFormData({ ...formData, duracionDias: evento.target.value })}
                className="campo-sistema w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none"
              >
                {opcionesDuracion.map((duracion) => (
                  <option key={duracion.value} value={duracion.value}>{duracion.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button disabled={guardando} type="submit" className="boton-primario mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">
            <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar membresia'}
          </button>
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {listaMembresias.map((membresia) => (
                <div key={membresia.id} className="group relative">
                  <TarjetaMembresia data={membresia} formatearMonto={formatearMonto} />
                  <button
                    type="button"
                    onClick={() => eliminarMembresia(membresia.id)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    aria-label="Eliminar membresia"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const TarjetaMembresia = ({ data, formatearMonto }) => (
  <article className="relative flex aspect-[16/10] w-full max-w-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-black p-5 shadow-2xl">
    <img src={imgMembresiaCard} className="absolute inset-0 h-full w-full object-cover opacity-80" alt="" loading="lazy" decoding="async" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

    <div className="relative z-10 flex justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500">
          <Dumbbell size={10} /> Spartan Pass
        </p>
        <h4 className="truncate text-lg font-black text-white">{data.nombre}</h4>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{data.duracionDias} dias</p>
      </div>
      <h3 className="shrink-0 text-xl font-black text-white">{formatearMonto(data.precio)}</h3>
    </div>

    <div className="relative z-10 space-y-1 border-t border-white/10 pt-2">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-300">
        <Check size={10} className="text-green-500" />
        <span className="line-clamp-1">Disponible para pagos y renovaciones</span>
      </div>
    </div>
  </article>
);

export default Membresias;
