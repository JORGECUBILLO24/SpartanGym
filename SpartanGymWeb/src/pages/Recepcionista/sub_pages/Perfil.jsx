import { User, Building2 } from 'lucide-react';

const Perfil = () => {
  // Datos de ejemplo para los otros recepcionistas
  const otrosRecepcionistas = [
    { nombre: 'Anthony Flores', correo: 'anthony@spartangym.com', tel: '+505 7777 7777', sucursal: 'SpartanGym Masachapa', ubicacion: 'Masachapa, Nicaragua' }
  ];

  return (
    <div className="max-w-5xl p-6 pt-0 animate-in fade-in duration-500 space-y-8">
      
      {/* SECCIÓN 1: Tu Perfil (Tal cual lo tienes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-[#0d0d0d] p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 bg-[#171717] rounded-full flex items-center justify-center text-gray-500 border-2 border-white/5 shadow-xl mb-6">
            <User size={64} className="opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-white">Jorge Cubillo</h3>
          <p className="text-red-500 text-xs font-medium uppercase tracking-widest mt-1">Recepcionista</p>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-3">
            <Building2 size={14} />
            SpartanGym Central
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#0d0d0d] p-8 rounded-3xl border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DetailField label="Nombre Completo" value="Jorge Rafael Cubillo" />
            <DetailField label="Correo Electrónico" value="jorge@spartangym.com" />
            <DetailField label="Teléfono" value="+505 8888 8888" />
            <DetailField label="Sucursal" value="SpartanGym Central" />
            <DetailField label="Ubicación" value="Managua, Nicaragua" />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Lista de otros recepcionistas con la MISMA estructura */}
      {otrosRecepcionistas.map((recep, index) => (
        <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-[#0d0d0d] p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-[#171717] rounded-full flex items-center justify-center text-gray-500 border border-white/5 mb-4">
              <User size={32} className="opacity-50" />
            </div>
            <h3 className="text-md font-bold text-white">{recep.nombre}</h3>
            <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest mt-1">Recepcionista</p>
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-3">
              <Building2 size={14} />
              {recep.sucursal}
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#0d0d0d] p-8 rounded-3xl border border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DetailField label="Nombre Completo" value={recep.nombre} />
              <DetailField label="Correo Electrónico" value={recep.correo} />
              <DetailField label="Teléfono" value={recep.tel} />
              <DetailField label="Sucursal" value={recep.sucursal} />
              <DetailField label="Ubicación" value={recep.ubicacion} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DetailField = ({ label, value }) => (
  <div className="flex flex-col">
    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">{label}</label>
    <div className="text-sm text-white py-2 border-b border-white/10">
      {value}
    </div>
  </div>
);

export default Perfil;
