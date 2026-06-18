import { useState } from 'react';
import { Save, Plus, X, Check, Dumbbell, Trash2 } from 'lucide-react';
import imgMembresiaCard from "../../../assets/MembresiaSpartan.png";

const TarjetaMembresia = ({ data }) => {
  const precio = Number(data.precio);
  const precioFormateado = data.precio && Number.isFinite(precio) ? precio.toFixed(2) : '0.00';
  const beneficios = (data.beneficios || []).filter(Boolean);

  return (
    <div className="relative flex aspect-[16/10] w-full max-w-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-black p-5 shadow-2xl">
      <img src={imgMembresiaCard} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

      <div className="relative z-10 flex justify-between">
        <div>
          <p className="text-[9px] uppercase font-black text-red-500 flex items-center gap-1"><Dumbbell size={10} /> Spartan Pass</p>
          <h4 className="text-lg font-black text-white">{data.nombrePlan || 'NOMBRE DEL PLAN'}</h4>
        </div>
        <h3 className="text-xl font-black text-white">${precioFormateado}</h3>
      </div>

      <div className="relative z-10 border-t border-white/10 pt-2 space-y-1">
        {(beneficios.length ? beneficios : ['Beneficio del plan']).map((beneficio, i) => (
          <div key={`${beneficio}-${i}`} className="flex items-center gap-1.5 text-[10px] text-gray-300">
            <Check size={10} className="text-green-500" />
            {beneficio}
          </div>
        ))}
      </div>
    </div>
  );
};

const Membresias = () => {
  const [formData, setFormData] = useState({
    nombrePlan: '',
    precio: '',
    beneficios: ['Acceso a pesas y cardio'],
  });

  const [listaMembresias, setListaMembresias] = useState([]);

  const actualizarBeneficio = (index, value) => {
    const beneficios = [...formData.beneficios];
    beneficios[index] = value;
    setFormData({ ...formData, beneficios });
  };

  const guardarMembresia = (e) => {
    e.preventDefault();

    const membresia = {
      ...formData,
      nombrePlan: formData.nombrePlan.trim(),
      beneficios: formData.beneficios.map((beneficio) => beneficio.trim()).filter(Boolean),
    };

    if (!membresia.nombrePlan || !membresia.precio) return;

    setListaMembresias([...listaMembresias, membresia]);
    setFormData({ nombrePlan: '', precio: '', beneficios: ['Acceso a pesas y cardio'] });
  };

  return (
    <div className="w-full text-white">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div className="w-full">
          <form onSubmit={guardarMembresia} className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl sm:p-6 lg:p-8">
            <div className="space-y-4">
              <input
                required
                placeholder="Nombre del Plan"
                value={formData.nombrePlan}
                className="w-full bg-[#151515] p-3 rounded-xl border border-white/10"
                onChange={(e) => setFormData({ ...formData, nombrePlan: e.target.value })}
              />
              <input
                required
                min="0"
                step="0.01"
                type="number"
                placeholder="Precio ($)"
                value={formData.precio}
                className="w-full bg-[#151515] p-3 rounded-xl border border-white/10"
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              />

              <div className="pt-4">
                <label className="text-xs text-gray-500 font-bold mb-2 block">BENEFICIOS</label>
                {formData.beneficios.map((beneficio, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={beneficio}
                      onChange={(e) => actualizarBeneficio(i, e.target.value)}
                      className="w-full bg-[#151515] p-2 rounded-lg border border-white/5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, beneficios: formData.beneficios.filter((_, idx) => idx !== i) })}
                      className="text-red-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, beneficios: [...formData.beneficios, ''] })}
                  className="text-red-600 text-sm font-bold flex items-center gap-1 mt-2"
                >
                  <Plus size={16} /> Agregar beneficio
                </button>
              </div>
            </div>
            <button type="submit" className="w-full mt-6 bg-red-600 py-3 rounded-xl font-bold hover:bg-red-700 flex items-center justify-center gap-2">
              <Save size={18} /> Guardar Membresía
            </button>
          </form>
        </div>

        <div className="flex w-full min-w-0 flex-col items-center gap-8 xl:items-start">
          <div className="w-full max-w-[320px] xl:sticky xl:top-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Vista Previa</h3>
            <TarjetaMembresia data={formData} />
          </div>

          {listaMembresias.length > 0 && (
            <div className="flex w-full max-w-[320px] flex-col gap-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Membresías Guardadas</h3>
              {listaMembresias.map((membresia, index) => (
                <div key={`${membresia.nombrePlan}-${index}`} className="relative group">
                  <TarjetaMembresia data={membresia} />
                  <button
                    onClick={() => setListaMembresias(listaMembresias.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 p-2 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Membresias;
