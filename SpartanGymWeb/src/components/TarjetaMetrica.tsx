import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface TarjetaMetricaProps {
  titulo: string;
  valor: ReactNode;
  detalle?: ReactNode;
  icono: LucideIcon;
  /** Clase de Tailwind con el color del icono. */
  color?: string;
}

const TarjetaMetrica = ({ titulo, valor, detalle, icono: Icono, color = 'text-gray-400' }: TarjetaMetricaProps) => (
  <article className="relative flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#090909] p-5">
    <div className="min-w-0">
      <h3 className="text-sm font-medium leading-5 text-gray-400">{titulo}</h3>
      <p className="mt-2 break-words text-3xl font-bold tracking-tight text-white tabular-nums">{valor}</p>
      {detalle && <p className="mt-2 text-xs leading-5 text-gray-400">{detalle}</p>}
    </div>
    <div aria-hidden="true" className={`shrink-0 rounded-xl bg-white/5 p-3 ${color}`}>
      <Icono size={20} />
    </div>
  </article>
);

export default TarjetaMetrica;
