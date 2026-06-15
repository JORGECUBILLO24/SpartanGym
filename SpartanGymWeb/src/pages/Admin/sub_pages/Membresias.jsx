import { useState } from 'react';
import { Check, Dumbbell, Plus, Save, Trash2, X } from 'lucide-react';
import imgMembresiaCard from '../../../assets/MembresiaSpartan.png';
import {
  agregarMembresiaCompartida,
  eliminarMembresiaCompartida,
  formatearPrecioMembresia,
  leerMembresiasCompartidas,
} from '../../../utils/membresiasCompartidas';

const formularioInicial = {
  nombrePlan: '',
  precio: '',
  duracion: '1 Mes',
  beneficios: ['Acceso a pesas y cardio'],
};

const opcionesDuracion = ['1 Dia', '15 Dias', '1 Mes', '3 Meses', '6 Meses', '1 Ano'];

const Membresias = () => {
  const [formData, setFormData] = useState(formularioInicial);
  const [listaMembresias, setListaMembresias] = useState(() => leerMembresiasCompartidas());

  const actualizarBeneficio = (indice, valor) => {
    const beneficios = [...formData.beneficios];
    beneficios[indice] = valor;
    setFormData({ ...formData, beneficios });
  };

  const guardarMembresia = (evento) => {
    evento.preventDefault();

    const membresia = {
      ...formData,
      nombrePlan: formData.nombrePlan.trim(),
      beneficios: formData.beneficios.map((beneficio) => beneficio.trim()).filter(Boolean),
    };

    if (!membresia.nombrePlan || !membresia.precio) return;

    setListaMembresias(agregarMembresiaCompartida(membresia));
    setFormData(formularioInicial);
  };

  const eliminarMembresia = (id) => {
    setListaMembresias(eliminarMembresiaCompartida(id));
  };

  return (
    <div className="pagina-stack w-full text-white">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <form onSubmit={guardarMembresia} className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Catalogo compartido</p>
            <h2 className="mt-1 text-xl font-black text-white">Crear membresia</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Las membresias guardadas aqui se reflejan en recepcion y en el registro de socios.
            </p>
          </div>

          <div className="space-y-4">
            <input
              required
              placeholder="Nombre del plan"
              value={formData.nombrePlan}
              className="campo-sistema w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none"
              onChange={(evento) => setFormData({ ...formData, nombrePlan: evento.target.value })}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                min="0"
                step="0.01"
                type="number"
                placeholder="Precio ($)"
                value={formData.precio}
                className="campo-sistema w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none"
                onChange={(evento) => setFormData({ ...formData, precio: evento.target.value })}
              />
              <select
                value={formData.duracion}
                onChange={(evento) => setFormData({ ...formData, duracion: evento.target.value })}
                className="campo-sistema w-full rounded-xl border border-white/10 bg-[#151515] p-3 text-white outline-none"
              >
                {opcionesDuracion.map((duracion) => (
                  <option key={duracion} value={duracion}>{duracion}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-white/5 pt-4">
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">Beneficios</label>
              {formData.beneficios.map((beneficio, indice) => (
                <div key={`${beneficio}-${indice}`} className="mb-2 flex gap-2">
                  <input
                    value={beneficio}
                    onChange={(evento) => actualizarBeneficio(indice, evento.target.value)}
                    className="campo-sistema w-full rounded-lg border border-white/5 bg-[#151515] p-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, beneficios: formData.beneficios.filter((_, itemIndice) => itemIndice !== indice) })}
                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                    aria-label="Quitar beneficio"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setFormData({ ...formData, beneficios: [...formData.beneficios, ''] })}
                className="mt-2 flex items-center gap-1 text-sm font-bold text-red-600"
              >
                <Plus size={16} /> Agregar beneficio
              </button>
            </div>
          </div>

          <button type="submit" className="boton-primario mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700">
            <Save size={18} /> Guardar membresia
          </button>
        </form>

        <div className="flex w-full min-w-0 flex-col gap-6">
          <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-500">Vista previa</h3>
            <TarjetaMembresia data={formData} />
          </section>

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
                  <TarjetaMembresia data={membresia} />
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

const TarjetaMembresia = ({ data }) => {
  const beneficios = (data.beneficios || []).filter(Boolean);

  return (
    <article className="relative flex aspect-[16/10] w-full max-w-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-black p-5 shadow-2xl">
      <img src={imgMembresiaCard} className="absolute inset-0 h-full w-full object-cover opacity-80" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

      <div className="relative z-10 flex justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500">
            <Dumbbell size={10} /> Spartan Pass
          </p>
          <h4 className="truncate text-lg font-black text-white">{data.nombrePlan || 'NOMBRE DEL PLAN'}</h4>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{data.duracion || 'Personalizada'}</p>
        </div>
        <h3 className="shrink-0 text-xl font-black text-white">{formatearPrecioMembresia(data.precio)}</h3>
      </div>

      <div className="relative z-10 space-y-1 border-t border-white/10 pt-2">
        {(beneficios.length ? beneficios : ['Beneficio del plan']).slice(0, 3).map((beneficio, indice) => (
          <div key={`${beneficio}-${indice}`} className="flex items-center gap-1.5 text-[10px] text-gray-300">
            <Check size={10} className="text-green-500" />
            <span className="line-clamp-1">{beneficio}</span>
          </div>
        ))}
      </div>
    </article>
  );
};

export default Membresias;
