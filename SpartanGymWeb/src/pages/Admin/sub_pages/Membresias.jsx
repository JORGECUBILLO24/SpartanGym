import { useState } from 'react';
import { Save, Plus, X, Check, Dumbbell, Trash2 } from 'lucide-react';
import imgMembresiaCard from "../../../assets/MembresiaSpartan.png";

const Membresias = () => {
  const [formData, setFormData] = useState({
    nombrePlan: '',
    precio: '',
    beneficios: ['Acceso a pesas y cardio']
  });

  const [listaMembresias, setListaMembresias] = useState([]);

  const TarjetaMembresia = ({ data }) => (
    <div className="w-[320px] h-[200px] rounded-2xl border border-white/10 relative overflow-hidden shadow-2xl flex flex-col justify-between p-5 bg-black">
      <img src={imgMembresiaCard} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="background"/>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
      
      <div className="relative z-10 flex justify-between">
        <div>
          <p className="text-[9px] uppercase font-black text-red-500 flex items-center gap-1"><Dumbbell size={10} /> Spartan Pass</p>
          <h4 className="text-lg font-black text-white">{data.nombrePlan || 'NOMBRE DEL PLAN'}</h4>
        </div>
        <h3 className="text-xl font-black text-white">${data.precio ? parseFloat(data.precio).toFixed(2) : '0.00'}</h3>
      </div>

      <div className="relative z-10 border-t border-white/10 pt-2 space-y-1">
        {(data.beneficios || []).map((b, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-300">
            <Check size={10} className="text-green-500" />
            {b}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-8 text-white w-full">
      {/* Usamos flexbox para asegurar el control de las dos columnas */}
      <div className="flex gap-12 items-start justify-start">
        
        {/* IZQUIERDA: FORMULARIO - Ancho fijo para que no se expanda */}
        <div className="w-[450px] shrink-0">
          <form className="bg-[#0a0a0a] p-8 rounded-2xl border border-white/10 shadow-2xl">
            <div className="space-y-4">
              <input placeholder="Nombre del Plan" value={formData.nombrePlan} className="w-full bg-[#151515] p-3 rounded-xl border border-white/10" onChange={(e) => setFormData({...formData, nombrePlan: e.target.value})} />
              <input type="number" placeholder="Precio ($)" value={formData.precio} className="w-full bg-[#151515] p-3 rounded-xl border border-white/10" onChange={(e) => setFormData({...formData, precio: e.target.value})} />
              
              <div className="pt-4">
                <label className="text-xs text-gray-500 font-bold mb-2 block">BENEFICIOS</label>
                {formData.beneficios.map((b, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={b} onChange={(e) => {
                      const nuevos = [...formData.beneficios];
                      nuevos[i] = e.target.value;
                      setFormData({...formData, beneficios: nuevos});
                    }} className="w-full bg-[#151515] p-2 rounded-lg border border-white/5 text-sm" />
                    <button type="button" onClick={() => setFormData({...formData, beneficios: formData.beneficios.filter((_, idx) => idx !== i)})} className="text-red-500"><X size={18}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({...formData, beneficios: [...formData.beneficios, '']})} className="text-red-600 text-sm font-bold flex items-center gap-1 mt-2">
                  <Plus size={16}/> Agregar beneficio
                </button>
              </div>
            </div>
            <button type="button" onClick={() => { setListaMembresias([...listaMembresias, formData]); setFormData({ nombrePlan: '', precio: '', beneficios: [] }); }} className="w-full mt-6 bg-red-600 py-3 rounded-xl font-bold hover:bg-red-700">Guardar Membresía</button>
          </form>
        </div>

        {/* DERECHA: VISTA PREVIA (Fija arriba) y LISTA */}
        <div className="w-[350px] flex flex-col gap-8">
          <div className="sticky top-0">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Vista Previa</h3>
            <TarjetaMembresia data={formData} />
          </div>

          {listaMembresias.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Membresías Guardadas</h3>
              {listaMembresias.map((m, index) => (
                <div key={index} className="relative group">
                  <TarjetaMembresia data={m} />
                  <button onClick={() => setListaMembresias(listaMembresias.filter((_, i) => i !== index))} className="absolute top-2 right-2 p-2 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16}/>
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