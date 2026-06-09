import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, CheckCircle2, Sparkles, Users } from 'lucide-react';
import LogoSpartan from '../assets/Logo Web.png';
import { beneficiosInicio } from '../data/homeBenefits';

const frases = [
  'Entrena como guerrero. Vive como campeón.',
  'Tu disciplina de hoy construye tu fuerza de mañana.',
  'Cada repetición te acerca a tu mejor versión.',
  'Spartan Gym: fuerza, constancia y actitud.',
  'Hoy se entrena. Mañana se nota.',
];

const Home = () => {
  const [indiceFrase, setIndiceFrase] = useState(0);

  useEffect(() => {
    const temporizador = setInterval(() => {
      setIndiceFrase((indiceActual) => (indiceActual + 1) % frases.length);
    }, 3500);

    return () => clearInterval(temporizador);
  }, []);

  return (
    <div className="home-page min-h-screen overflow-x-hidden bg-black text-white">
      <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-[url('/src/assets/fondo_login.png')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.76),rgba(0,0,0,0.82)_55%,#050505_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-[linear-gradient(180deg,rgba(0,0,0,0),#050505)]" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <img
            src={LogoSpartan}
            alt="Logo Spartan Gym Web"
            className="h-auto w-40 max-w-[44vw] object-contain drop-shadow-[0_0_18px_rgba(220,38,38,0.7)] transition duration-300 hover:scale-[1.02] sm:w-56 lg:w-64"
          />

          <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href="#quienes-somos"
              className="hidden text-sm font-bold text-gray-200 transition-colors duration-300 hover:text-white sm:inline-flex"
            >
              Quiénes Somos
            </a>
            <a
              href="#beneficios"
              className="hidden text-sm font-bold text-gray-200 transition-colors duration-300 hover:text-white sm:inline-flex"
            >
              Beneficios
            </a>
            <Link
              to="/login"
              className="whitespace-nowrap text-xs font-bold text-gray-200 transition-colors duration-300 hover:text-white sm:text-sm"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="whitespace-nowrap rounded-lg border border-red-600/70 bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-500 sm:px-4 sm:text-sm"
            >
              Regístrate
            </Link>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 pb-8 pt-2 text-center sm:px-6 lg:px-8">
          <div className="w-full max-w-5xl animate-[homeReveal_650ms_ease_both]">
            <p className="mb-4 text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-red-400 sm:text-sm">
              Bienvenido a Spartan Gym
            </p>
            <h1
              key={indiceFrase}
              className="mx-auto min-h-[8.5rem] max-w-5xl animate-[phraseSwap_700ms_ease] text-balance text-[clamp(2.25rem,10vw,4.8rem)] font-black uppercase leading-[0.98] text-white drop-shadow-[0_0_25px_rgba(220,38,38,0.42)] sm:min-h-[9.5rem] lg:min-h-[10rem]"
            >
              {frases[indiceFrase]}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              Mejora tu fuerza, tu energía y tu disciplina con un espacio hecho para entrenar constante.
            </p>
            <div className="mx-auto mt-7 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#beneficios"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_35px_rgba(220,38,38,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-500 sm:w-auto"
              >
                Ver beneficios
                <ArrowDown className="h-4 w-4 transition duration-300 group-hover:translate-y-0.5" />
              </a>
              <Link
                to="/registro"
                className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-5 text-sm font-black uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/70 hover:bg-red-600/15 sm:w-auto"
              >
                Unirme ahora
              </Link>
            </div>
          </div>
        </main>
      </section>

      <section
        id="quienes-somos"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-16">
          <div className="w-full lg:w-1/2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-600/10 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-red-300">
              <Users className="h-4 w-4" />
              Nuestra Esencia
            </div>
            <h2 className="text-3xl font-black uppercase leading-tight text-white sm:text-4xl lg:text-5xl">
              Quiénes Somos
            </h2>
            <p className="mt-6 text-base leading-relaxed text-zinc-400 sm:text-lg">
              En Spartan Gym no solo somos un gimnasio, somos una comunidad forjada en hierro y disciplina. Nacimos con la visión de crear un espacio donde la excusa no tiene lugar y el esfuerzo diario es nuestra mejor recompensa.
            </p>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
              Contamos con entrenadores capacitados, equipo de primera línea y un ambiente que te motivará a superar tus límites. Aquí cada gota de sudor cuenta y cada entrenamiento te acerca a tus objetivos. Únete a la familia Spartan y descubre de qué estás hecho.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm font-medium text-zinc-300 sm:text-base">
                <CheckCircle2 className="h-5 w-5 text-red-500" />
                Comunidad enfocada en el progreso
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-zinc-300 sm:text-base">
                <CheckCircle2 className="h-5 w-5 text-red-500" />
                Instalaciones de alto rendimiento
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-zinc-300 sm:text-base">
                <CheckCircle2 className="h-5 w-5 text-red-500" />
                Entrenadores comprometidos contigo
              </li>
            </ul>
          </div>

          <div className="relative w-full lg:w-1/2">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50">
              <img
                src="/src/assets/fondo_login.png"
                alt="Instalaciones Spartan Gym"
                className="h-full w-full object-cover object-center opacity-80 transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden h-24 w-24 rounded-lg bg-red-600/20 backdrop-blur-md lg:block" />
            <div className="absolute -right-6 -top-6 hidden h-32 w-32 rounded-full border border-red-500/30 bg-transparent lg:block" />
          </div>
        </div>
      </section>

      <section
        id="beneficios"
        className="relative isolate flex min-h-screen items-center overflow-hidden bg-[#050505] px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(220,38,38,0.08),transparent_28%,transparent_72%,rgba(220,38,38,0.08))]" />

        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-600/10 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-red-300">
              <Sparkles className="h-4 w-4" />
              Lo bueno del gym
            </div>
            <h2 className="text-3xl font-black uppercase leading-tight text-white sm:text-4xl lg:text-5xl">
              Beneficios que se sienten desde el primer entrenamiento
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Tres razones para empezar, mantener el ritmo y convertir el entrenamiento en parte de tu vida.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {beneficiosInicio.map((beneficio, indice) => {
              const Icono = beneficio.icono;

              return (
                <article
                  key={beneficio.ruta}
                  className="benefit-card group flex min-h-[28rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0c]/95 shadow-2xl shadow-black/35 transition-all duration-500 hover:-translate-y-1.5 hover:border-red-500/60 hover:shadow-red-950/20"
                  style={{ animationDelay: `${indice * 110}ms` }}
                >
                  <div className="relative h-40 overflow-hidden border-b border-white/10">
                    <img
                      src={beneficio.imagen}
                      alt={beneficio.imagenAlt}
                      className="h-full w-full object-cover object-center opacity-80 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-95"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.7))]" />
                    <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-lg border border-red-500/50 bg-black/55 text-red-300 backdrop-blur-sm transition duration-300 group-hover:scale-105">
                      <Icono className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <h3 className="text-xl font-black leading-tight text-white">{beneficio.titulo}</h3>
                      <span className="max-w-28 text-right text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-zinc-500">
                        {beneficio.etiqueta}
                      </span>
                    </div>

                    <p className="flex-1 text-sm leading-6 text-zinc-400">
                      {beneficio.resumen}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-sm font-bold text-zinc-300">
                      <CheckCircle2 className="h-4 w-4 text-red-400" />
                      {beneficio.estadistica}
                    </div>

                    <Link
                      to={`/beneficios/${beneficio.ruta}`}
                      className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-black uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/70 hover:bg-red-600/20"
                    >
                      Ver más
                      <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
