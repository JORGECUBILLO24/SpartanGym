import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, ShieldCheck, Users, Zap } from 'lucide-react';
import {
  EVENTO_MEMBRESIAS,
  formatearPrecioMembresia,
  leerMembresiasCompartidas,
} from '../../../utils/membresiasCompartidas';
import {
  EVENTO_SOCIOS,
  leerSociosCompartidos,
  obtenerNombreSocio,
} from '../../../utils/sociosCompartidos';

const Membresias = () => {
  const [catalogo, setCatalogo] = useState(() => leerMembresiasCompartidas());
  const [socios, setSocios] = useState(() => leerSociosCompartidos());

  useEffect(() => {
    const actualizarCatalogo = () => setCatalogo(leerMembresiasCompartidas());

    window.addEventListener('storage', actualizarCatalogo);
    window.addEventListener(EVENTO_MEMBRESIAS, actualizarCatalogo);

    return () => {
      window.removeEventListener('storage', actualizarCatalogo);
      window.removeEventListener(EVENTO_MEMBRESIAS, actualizarCatalogo);
    };
  }, []);

  useEffect(() => {
    const actualizarSocios = () => setSocios(leerSociosCompartidos());

    window.addEventListener('storage', actualizarSocios);
    window.addEventListener(EVENTO_SOCIOS, actualizarSocios);

    return () => {
      window.removeEventListener('storage', actualizarSocios);
      window.removeEventListener(EVENTO_SOCIOS, actualizarSocios);
    };
  }, []);

  return (
    <div className="pagina-stack mx-auto w-full max-w-6xl space-y-8">
      <section>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400">Catalogo activo</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-white">
              <Zap className="text-red-500" /> Planes de membresia
            </h2>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-gray-400">
            Sincronizado con admin
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {catalogo.map((plan) => (
            <article
              key={plan.id}
              className={`tarjeta-sistema relative rounded-2xl border bg-[#0d0d0d] p-6 shadow-2xl ${
                plan.popular ? 'border-red-600/50 shadow-red-900/10' : 'border-white/10'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  Popular
                </span>
              )}

              <h4 className="text-lg font-black text-white">{plan.nombrePlan}</h4>
              <div className="mb-6 mt-4">
                <span className="text-3xl font-black text-red-500">{formatearPrecioMembresia(plan.precio)}</span>
                <span className="ml-1 text-sm font-bold text-gray-500">/ {plan.duracion}</span>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.beneficios.map((beneficio) => (
                  <li key={beneficio} className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 size={16} className="text-red-600" /> {beneficio}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 border-t border-white/5 pt-5 text-xs font-bold text-gray-500">
                <Users size={14} /> Disponible para registro de socios
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tarjeta-sistema rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="mb-6">
          <h3 className="text-lg font-black text-white">Estado de socios</h3>
          <p className="mt-1 text-sm text-gray-500">Vista rapida de membresias activas y vencidas.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-500">
                <th className="pb-4 font-bold">Socio</th>
                <th className="pb-4 font-bold">Plan</th>
                <th className="pb-4 font-bold">Vencimiento</th>
                <th className="pb-4 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {socios.map((socio) => (
                <tr key={socio.id} className="hover:bg-white/[0.02]">
                  <td className="py-5 font-bold text-white">{obtenerNombreSocio(socio)}</td>
                  <td className="py-5">{socio.membresia}</td>
                  <td className="flex items-center gap-2 py-5 text-gray-400">
                    <Calendar size={14} /> {new Date(socio.creadoEn).toLocaleDateString('es-NI')}
                  </td>
                  <td className="py-5">
                    <EtiquetaEstado estado={socio.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const EtiquetaEstado = ({ estado }) => {
  const activo = estado === 'Activo';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
      activo ? 'border-green-500/20 bg-green-500/10 text-green-500' : 'border-red-500/20 bg-red-500/10 text-red-500'
    }`}>
      {activo ? <ShieldCheck size={12} /> : <AlertCircle size={12} />} {estado}
    </span>
  );
};

export default Membresias;
