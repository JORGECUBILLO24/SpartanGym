import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Flame, ShieldCheck } from 'lucide-react';
import FondoLogin from '../assets/fondo_login.webp';
import { beneficiosInicio } from '../data/homeBenefits';
import { useLogosApp } from '../utils/logosApp';

const DetalleBeneficio = () => {
  const { slug: rutaBeneficio } = useParams();
  const beneficio = beneficiosInicio.find((elemento) => elemento.ruta === rutaBeneficio);
  const logos = useLogosApp();

  if (!beneficio) {
    return <Navigate to="/#beneficios" replace />;
  }

  const Icono = beneficio.icono;

  return (
    <div className="benefit-detail min-h-screen bg-black text-white">
      <div
        className="benefit-detail-bg fixed inset-0 -z-10 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${FondoLogin})` }}
      />
      <div className="benefit-detail-overlay fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.82),rgba(0,0,0,0.96))]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Volver al inicio">
          <img
            src={logos.principal}
            alt="Logo Spartan Gym Web"
            width="320"
            height="213"
            decoding="async"
            className="h-auto w-40 object-contain drop-shadow-[0_0_14px_rgba(220,38,38,0.55)] transition duration-300 hover:scale-[1.02] sm:w-52"
          />
        </Link>

        <Link
          to="/#beneficios"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/70 hover:bg-red-600/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-6xl items-center gap-8 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <section className="animate-[homeReveal_700ms_ease_both]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-600/10 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-red-300">
            <Flame className="h-4 w-4" />
            {beneficio.etiqueta}
          </div>

          <h1 className="max-w-3xl text-4xl font-black uppercase leading-[1.02] text-white sm:text-5xl lg:text-6xl">
            {beneficio.titulo}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            {beneficio.resumen}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/registro"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_35px_rgba(220,38,38,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-500"
            >
              Registrarme
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/70 hover:bg-red-600/15"
            >
              Iniciar sesión
            </Link>
          </div>
        </section>

        <section className="animate-[homeReveal_800ms_120ms_ease_both] overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c]/90 shadow-2xl shadow-black/40 transition-all duration-300 hover:border-red-500/40">
          {beneficio.imagen && (
            <div className="h-52 overflow-hidden border-b border-white/10 sm:h-60">
              <img
                src={beneficio.imagen}
                alt={beneficio.imagenAlt}
                decoding="async"
                className="h-full w-full object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
              />
            </div>
          )}

          <div className="p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-red-500/50 bg-red-600/15 text-red-300 transition duration-300 hover:scale-105">
                <Icono className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-zinc-500">
                  Spartan Gym
                </p>
                <h2 className="text-xl font-black text-white">{beneficio.estadistica}</h2>
              </div>
            </div>

            <div className="space-y-3">
              {beneficio.puntos.map((punto) => (
                <div
                  key={punto}
                  className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-red-500/30 hover:bg-white/[0.05]"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <p className="text-sm leading-6 text-zinc-300">{punto}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5 text-sm text-zinc-400">
              <ShieldCheck className="h-5 w-5 text-red-400" />
              Listo para socios nuevos y miembros activos.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DetalleBeneficio;
