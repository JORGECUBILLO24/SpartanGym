import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode,
  RotateCcw,
  Search,
  User,
  XCircle,
} from 'lucide-react';
import {
  EVENTO_SOCIOS,
  leerSociosCompartidos,
  obtenerNombreSocio,
} from '../../../utils/sociosCompartidos';

const formularioManualInicial = {
  nombre: '',
  apellido: '',
};

const accesosIniciales = [
  { id: 1, socio: 'Juan Perez', membresia: 'Premium', sucursal: 'SpartanGym Central', hora: '09:05 AM', estado: 'Permitido', origen: 'QR' },
  { id: 2, socio: 'Maria Gomez', membresia: 'Basica', sucursal: 'SpartanGym Central', hora: '08:42 AM', estado: 'Permitido', origen: 'Manual' },
  { id: 3, socio: 'Pedro Silva', membresia: 'Basica', sucursal: 'SpartanGym Masaya', hora: '08:30 AM', estado: 'Denegado', origen: 'Manual' },
];

const normalizarTexto = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const obtenerHoraActual = () =>
  new Intl.DateTimeFormat('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

const buscarSocioPorNombre = (socios, formulario) => {
  const nombreBuscado = normalizarTexto(formulario.nombre);
  const apellidoBuscado = normalizarTexto(formulario.apellido);

  if (!nombreBuscado || !apellidoBuscado) return null;

  return socios.find((socio) => (
    normalizarTexto(socio.nombre) === nombreBuscado &&
    normalizarTexto(socio.apellido) === apellidoBuscado
  ));
};

const crearAcceso = ({ socio, estado = 'Permitido', origen = 'Manual' }) => ({
  id: `${Date.now()}-${origen}`,
  socio: socio ? obtenerNombreSocio(socio) : 'Socio no encontrado',
  membresia: socio?.membresia || 'Sin membresia',
  sucursal: socio?.sucursal || 'Sin sucursal',
  hora: obtenerHoraActual(),
  estado,
  origen,
});

const CheckIn = () => {
  const [socios, setSocios] = useState(() => leerSociosCompartidos());
  const [socioValidado, setSocioValidado] = useState(null);
  const [errorManual, setErrorManual] = useState('');
  const [formularioManual, setFormularioManual] = useState(formularioManualInicial);
  const [historialAccesos, setHistorialAccesos] = useState(accesosIniciales);

  useEffect(() => {
    const actualizarSocios = () => setSocios(leerSociosCompartidos());

    window.addEventListener('storage', actualizarSocios);
    window.addEventListener(EVENTO_SOCIOS, actualizarSocios);

    return () => {
      window.removeEventListener('storage', actualizarSocios);
      window.removeEventListener(EVENTO_SOCIOS, actualizarSocios);
    };
  }, []);

  const socioQrSimulado = useMemo(
    () => socios.find((socio) => socio.estado === 'Activo') || socios[0],
    [socios]
  );

  const actualizarCampoManual = (evento) => {
    setFormularioManual({ ...formularioManual, [evento.target.name]: evento.target.value });
    setErrorManual('');
  };

  const registrarAccesoPermitido = (socio, origen) => {
    const acceso = crearAcceso({ socio, estado: socio.estado === 'Activo' ? 'Permitido' : 'Denegado', origen });

    setSocioValidado({
      ...socio,
      estadoAcceso: acceso.estado,
      origenAcceso: origen,
      horaAcceso: acceso.hora,
    });
    setHistorialAccesos((actual) => [acceso, ...actual].slice(0, 8));
  };

  const validarQr = () => {
    if (!socioQrSimulado) {
      setSocioValidado(null);
      setErrorManual('No hay socios registrados para validar.');
      return;
    }

    setErrorManual('');
    registrarAccesoPermitido(socioQrSimulado, 'QR');
  };

  const validarManual = (evento) => {
    evento.preventDefault();
    const socioEncontrado = buscarSocioPorNombre(socios, formularioManual);

    if (!socioEncontrado) {
      const accesoDenegado = crearAcceso({ socio: null, estado: 'Denegado', origen: 'Manual' });

      setSocioValidado(null);
      setErrorManual('No encontramos un socio activo con ese nombre y apellido.');
      setHistorialAccesos((actual) => [accesoDenegado, ...actual].slice(0, 8));
      return;
    }

    setErrorManual('');
    setFormularioManual(formularioManualInicial);
    registrarAccesoPermitido(socioEncontrado, 'Manual');
  };

  const reiniciarValidacion = () => {
    setSocioValidado(null);
    setErrorManual('');
    setFormularioManual(formularioManualInicial);
  };

  return (
    <div className="pagina-stack flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <section className="tarjeta-sistema relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="brillo-panel" />

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <h3 className="text-sm font-black tracking-wide">Camara activa</h3>
              </div>
              <button
                type="button"
                onClick={validarQr}
                className="boton-primario inline-flex items-center justify-center gap-2 rounded-xl bg-[#e50914] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-700"
              >
                <QrCode size={16} />
                Validar QR
              </button>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-center">
              <div className="relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-2xl border-2 border-red-600/30 bg-red-500/5 sm:h-56 sm:w-56">
                <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-red-600" />
                <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-red-600" />
                <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-red-600" />
                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-red-600" />
                <span className="escaneo-linea absolute inset-x-4 h-0.5 bg-red-500 shadow-[0_0_15px_3px_rgba(239,68,68,0.6)]" />
                <QrCode size={96} className="text-white/10" strokeWidth={1} />
              </div>

              <p className="mt-5 max-w-sm text-sm leading-6 text-gray-400">
                Pide al socio que acerque su codigo QR. Si el celular no funciona, usa la validacion manual.
              </p>
            </div>

            <form onSubmit={validarManual} className="panel-validacion-manual rounded-2xl border border-white/10 bg-[#0a0a0a]/70 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="rounded-xl bg-red-600/10 p-2 text-red-500">
                  <Search size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">Validacion manual</h4>
                  <p className="mt-1 text-xs leading-5 text-gray-500">Busca al socio por nombre y apellido cuando no pueda usar QR.</p>
                </div>
              </div>

              {errorManual && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                  <AlertCircle size={15} />
                  {errorManual}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoManual
                  etiqueta="Nombre"
                  nombre="nombre"
                  valor={formularioManual.nombre}
                  placeholder="Ej. Carlos"
                  onChange={actualizarCampoManual}
                />
                <CampoManual
                  etiqueta="Apellido"
                  nombre="apellido"
                  valor={formularioManual.apellido}
                  placeholder="Ej. Ramirez"
                  onChange={actualizarCampoManual}
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                {(socioValidado || errorManual) && (
                  <button
                    type="button"
                    onClick={reiniciarValidacion}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw size={16} />
                    Limpiar
                  </button>
                )}
                <button
                  type="submit"
                  className="boton-primario inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-700"
                >
                  <CheckCircle2 size={16} />
                  Validar manual
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="tarjeta-sistema relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 lg:p-8">
          <h3 className="mb-6 text-sm font-black uppercase tracking-wider text-gray-400">Informacion del socio</h3>

          {socioValidado ? (
            <div className="animate-fade-in relative z-10 flex flex-1 flex-col items-center justify-center text-center">
              <div className="relative mb-5">
                <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${socioValidado.estadoAcceso === 'Permitido' ? 'bg-green-500' : 'bg-red-500'}`} />
                {socioValidado.estadoAcceso === 'Permitido' ? (
                  <CheckCircle2 size={86} className="relative z-10 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                ) : (
                  <XCircle size={86} className="relative z-10 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.45)]" />
                )}
              </div>

              <h2 className="mb-2 text-2xl font-black text-white sm:text-3xl">
                {socioValidado.estadoAcceso === 'Permitido' ? 'Acceso validado' : 'Acceso denegado'}
              </h2>
              <p className={`mb-6 rounded-full border px-4 py-1.5 text-sm font-bold ${
                socioValidado.estadoAcceso === 'Permitido'
                  ? 'border-green-500/20 bg-green-500/10 text-green-500'
                  : 'border-red-500/20 bg-red-500/10 text-red-500'
              }`}>
                {socioValidado.estadoAcceso === 'Permitido' ? 'Membresia activa' : 'Revisar estado del socio'}
              </p>

              <div className="w-full max-w-md space-y-3 text-left">
                <DatoSocio icono={User} etiqueta="Nombre completo" valor={obtenerNombreSocio(socioValidado)} />
                <DatoSocio icono={CreditCard} etiqueta="Plan actual" valor={socioValidado.membresia || 'Sin membresia'} />
                <DatoSocio icono={Building2} etiqueta="Gimnasio asignado" valor={socioValidado.sucursal || 'Sin sucursal'} />
                <DatoSocio icono={Calendar} etiqueta="Ingreso" valor={`${socioValidado.horaAcceso} - ${socioValidado.origenAcceso}`} />
              </div>
            </div>
          ) : (
            <div className="animate-fade-in flex flex-1 flex-col items-center justify-center text-center text-gray-500">
              <QrCode size={60} className="mb-4 animate-pulse opacity-30" />
              <p className="text-lg font-bold">Esperando escaneo o validacion manual...</p>
              <p className="mt-2 max-w-sm text-sm leading-6">Ingresa nombre y apellido si el socio no puede presentar el QR.</p>
            </div>
          )}
        </section>
      </div>

      <section className="tarjeta-sistema flex flex-col rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl">
        <div className="mb-4 flex items-center gap-3 text-white">
          <Clock size={20} className="text-red-500" />
          <h3 className="font-black">Historial reciente</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500">
                <th className="pb-3 pr-4 font-bold">Socio</th>
                <th className="pb-3 pr-4 font-bold">Membresia</th>
                <th className="pb-3 pr-4 font-bold">Sucursal</th>
                <th className="pb-3 pr-4 font-bold">Hora</th>
                <th className="pb-3 pr-4 font-bold">Origen</th>
                <th className="pb-3 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {historialAccesos.map((acceso) => (
                <tr key={acceso.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5">
                  <td className="flex items-center gap-3 py-3 pr-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a0808] text-red-500">
                      <User size={12} />
                    </span>
                    <span className="font-bold text-white">{acceso.socio}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{acceso.membresia}</td>
                  <td className="py-3 pr-4 text-gray-400">{acceso.sucursal}</td>
                  <td className="py-3 pr-4 text-gray-400">{acceso.hora}</td>
                  <td className="py-3 pr-4 text-gray-400">{acceso.origen}</td>
                  <td className="py-3">
                    {acceso.estado === 'Permitido' ? (
                      <span className="inline-flex items-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">
                        <CheckCircle2 size={12} /> {acceso.estado}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-500">
                        <XCircle size={12} /> {acceso.estado}
                      </span>
                    )}
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

const CampoManual = ({ etiqueta, nombre, valor, placeholder, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">{etiqueta}</span>
    <input
      type="text"
      name={nombre}
      required
      value={valor}
      onChange={onChange}
      placeholder={placeholder}
      className="campo-sistema w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:border-red-600"
    />
  </label>
);

const DatoSocio = ({ icono: Icono, etiqueta, valor }) => (
  <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#0a0a0a] p-4">
    <span className="rounded-lg bg-[#2a0808] p-2.5 text-red-500">
      <Icono size={20} />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase text-gray-500">{etiqueta}</p>
      <p className="break-words text-base font-black text-white sm:text-lg">{valor}</p>
    </div>
  </div>
);

export default CheckIn;
