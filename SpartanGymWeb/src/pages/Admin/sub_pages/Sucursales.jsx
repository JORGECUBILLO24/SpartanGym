import { useEffect, useState } from 'react';
import { 
  Building2, MapPin, Clock, Users2, Phone, 
  Save, CheckCircle2, Activity, ShieldCheck, Dumbbell, AlertCircle, Trash2
} from 'lucide-react';
import { sucursalesApi } from '../../../services/api';

// Reutilizamos la imagen de estadísticas o laptop como fondo de tarjeta, o puedes cambiarla por una de la infraestructura
import imgGymCard from "../../../assets/EstadisticasSpartan.webp";

const Sucursales = () => {
  const [formData, setFormData] = useState({
    nombreSucursal: '',
    ubicacion: '',
    telefono: '',
    capacidad: '',
    horarioApertura: '05:00 AM',
    horarioCierre: '10:00 PM',
    estado: 'Operativa'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [errorApi, setErrorApi] = useState('');

  const cargarSucursales = async () => {
    setSucursales(await sucursalesApi.listar());
  };

  useEffect(() => {
    Promise.resolve()
      .then(cargarSucursales)
      .catch(() => setErrorApi('No se pudieron cargar las sucursales desde la API.'));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorApi('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorApi('');
    
    try {
      await sucursalesApi.crear({
        nombre: formData.nombreSucursal,
        ubicacion: formData.ubicacion,
        telefono: formData.telefono,
        capacidad: Number(formData.capacidad),
        horarioApertura: formData.horarioApertura,
        horarioCierre: formData.horarioCierre,
        estado: formData.estado,
      });
      await cargarSucursales();
      setIsSaved(true);
      setTimeout(() => {
        setFormData({
          nombreSucursal: '',
          ubicacion: '',
          telefono: '',
          capacidad: '',
          horarioApertura: '05:00 AM',
          horarioCierre: '10:00 PM',
          estado: 'Operativa'
        });
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      setErrorApi(error.message || 'No se pudo guardar la sucursal en la API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarSucursal = async (id) => {
    setErrorApi('');
    try {
      await sucursalesApi.eliminar(id);
      await cargarSucursales();
    } catch (error) {
      setErrorApi(error.message || 'No se pudo eliminar la sucursal.');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full text-white">
      {errorApi && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
          <AlertCircle size={15} />
          {errorApi}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-2 bg-[#090909] rounded-2xl border border-white/10 p-6 lg:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            
            {/* NOMBRE Y UBICACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Nombre de la Sucursal</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" name="nombreSucursal" required value={formData.nombreSucursal} onChange={handleChange}
                    placeholder="Ej. Spartan Central, Spartan Norte..." 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Dirección / Ubicación</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" name="ubicacion" required value={formData.ubicacion} onChange={handleChange}
                    placeholder="Ej. Km 10.5 Carretera a Masaya, Managua" 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* TELÉFONO Y CAPACIDAD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                    placeholder="Ej. +505 2222 0000" 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Capacidad Máxima (Aforo)</label>
                <div className="relative">
                  <Users2 className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="number" name="capacidad" required value={formData.capacidad} onChange={handleChange}
                    placeholder="Ej. 150 socios" 
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 focus:bg-[#151515] transition-all" 
                  />
                </div>
              </div>
            </div>

            <hr className="border-white/5 my-6" />

            {/* HORARIOS Y ESTADO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Hora de Apertura</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-3.5 text-gray-500 z-10" size={18} />
                  <select 
                    name="horarioApertura" value={formData.horarioApertura} onChange={handleChange}
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-all appearance-none cursor-pointer relative z-0"
                  >
                    <option value="05:00 AM">05:00 AM</option>
                    <option value="06:00 AM">06:00 AM</option>
                    <option value="07:00 AM">07:00 AM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Hora de Cierre</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-3.5 text-gray-500 z-10" size={18} />
                  <select 
                    name="horarioCierre" value={formData.horarioCierre} onChange={handleChange}
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-all appearance-none cursor-pointer relative z-0"
                  >
                    <option value="09:00 PM">09:00 PM</option>
                    <option value="10:00 PM">10:00 PM</option>
                    <option value="11:00 PM">11:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Estado Inicial</label>
                <div className="relative">
                  <Activity className="absolute left-4 top-3.5 text-gray-500 z-10" size={18} />
                  <select 
                    name="estado" value={formData.estado} onChange={handleChange}
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-600 transition-all appearance-none cursor-pointer relative z-0"
                  >
                    <option value="Operativa">Operativa (Activa)</option>
                    <option value="Mantenimiento">En Mantenimiento</option>
                    <option value="Próximamente">Próxima Apertura</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BOTÓN GUARDAR */}
            <div className="pt-4 flex justify-end">
              <button 
                type="submit" disabled={isSubmitting || isSaved}
                className={`flex items-center gap-2 font-bold py-3 px-8 rounded-xl transition-all shadow-lg text-sm
                  ${isSaved ? 'bg-green-600 text-white shadow-green-900/20' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20'} 
                  ${isSubmitting ? 'opacity-70 cursor-wait' : ''}
                `}
              >
                {isSubmitting ? (<>Registrando...</>) : isSaved ? (<><CheckCircle2 size={18} /> ¡Sucursal Guardada!</>) : (<><Save size={18} /> Guardar Sucursal</>)}
              </button>
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA DE TARJETA DE SUCURSAL */}
        <div className="bg-[#090909] rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center shadow-2xl h-full min-h-[500px] relative overflow-hidden group">
          <h3 className="font-bold text-xs text-gray-500 w-full mb-8 uppercase tracking-widest text-center absolute top-8">Tarjeta de Sucursal</h3>
          
          {/* Tarjeta de Sucursal Digital */}
          <div className="w-full max-w-sm bg-gradient-to-b from-[#151515] to-[#050505] rounded-2xl border border-white/10 p-6 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300 h-auto">
            <img
              src={imgGymCard}
              className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black pointer-events-none" />
            
            {/* Header de tarjeta */}
            <div className="flex justify-between items-start w-full gap-4 mb-4 relative z-10">
              <div className="overflow-hidden flex-1">
                <p className="text-[9px] uppercase font-black text-red-500 tracking-widest mb-1 flex items-center gap-1">
                  <Dumbbell size={10} /> Spartan HQ
                </p>
                <h4 className="text-lg font-black text-white tracking-tight leading-tight break-words w-full">
                  {formData.nombreSucursal || 'NOMBRE DE SUCURSAL'}
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 mt-1
                ${formData.estado === 'Operativa' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                  formData.estado === 'Mantenimiento' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                  'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}
              >
                {formData.estado}
              </span>
            </div>

            {/* Cuerpo de la tarjeta con dirección y contacto */}
            <div className="space-y-3 w-full border-t border-white/5 pt-3 relative z-10">
              <div className="flex items-start gap-2.5 text-xs text-gray-400">
                <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="break-words w-full leading-5">{formData.ubicacion || 'Dirección de la sucursal...'}</p>
              </div>

              {formData.telefono && (
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <Phone size={14} className="text-gray-500 shrink-0" />
                  <p className="font-mono">{formData.telefono}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2.5 text-xs text-gray-400">
                <Clock size={14} className="text-gray-500 shrink-0" />
                <p>Lu - Do: <span className="text-white font-bold">{formData.horarioApertura} - {formData.horarioCierre}</span></p>
              </div>
            </div>

            {/* Medidor de Capacidad y aforo */}
            <div className="w-full bg-[#0a0a0a] rounded-xl p-3 border border-white/5 mt-4 relative z-10">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">
                <span>Capacidad Asignada</span>
                <span className="text-white font-mono">{formData.capacidad || '0'} Socios</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full rounded-full transition-all duration-500 ${formData.capacidad ? 'w-2/3 bg-red-600' : 'w-0'}`}></div>
              </div>
            </div>

            {/* Footer interno de validación */}
            <div className="w-full mt-4 flex items-center gap-1.5 text-gray-600 text-[10px] relative z-10">
              <ShieldCheck size={12} className="text-red-600" />
              <span className="uppercase font-bold tracking-wider">Sincronización de Turnos Activa</span>
            </div>

          </div>
        </div>

      </div>

      <section className="rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Base de datos</p>
            <h3 className="text-lg font-black text-white">Sucursales registradas</h3>
            <p className="mt-1 text-xs text-gray-500">Gimnasios disponibles para administracion y operacion.</p>
          </div>
          <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-gray-400">
            {sucursales.length} sucursales
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sucursales.map((sucursal) => (
            <article key={sucursal.id} className="rounded-2xl border border-white/10 bg-[#111]/60 p-4 transition-all hover:border-white/20">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="break-words text-sm font-black text-white">{sucursal.nombre}</h4>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-gray-500">
                    <MapPin size={11} />
                    <span className="truncate">{sucursal.ubicacion}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarSucursal(sucursal.id)}
                  className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-600 hover:text-white"
                  aria-label={`Eliminar ${sucursal.nombre}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <DatoSucursal etiqueta="Capacidad" valor={`${sucursal.capacidad} socios`} />
                <DatoSucursal etiqueta="Estado" valor={sucursal.estado} />
                <DatoSucursal etiqueta="Apertura" valor={sucursal.horarioApertura} />
                <DatoSucursal etiqueta="Cierre" valor={sucursal.horarioCierre} />
              </div>
            </article>
          ))}
          {!sucursales.length && (
            <div className="rounded-2xl border border-white/5 bg-[#111]/60 p-8 text-center text-sm text-gray-500 md:col-span-2 xl:col-span-3">
              No hay sucursales registradas en la base de datos.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const DatoSucursal = ({ etiqueta, valor }) => (
  <div className="rounded-xl border border-white/5 bg-black/20 p-3">
    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{etiqueta}</p>
    <p className="mt-1 truncate font-bold text-white">{valor}</p>
  </div>
);

export default Sucursales;
