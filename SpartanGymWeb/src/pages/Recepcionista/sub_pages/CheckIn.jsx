import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Smartphone,
  User,
  XCircle,
} from 'lucide-react';
import { asistenciasApi, operacionApi, sociosApi } from '../../../services/api';

const formularioManualInicial = {
  nombre: '',
  apellido: '',
};

const normalizarTexto = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const buscarSocioPorNombre = (socios, formulario) => {
  const nombreBuscado = normalizarTexto(formulario.nombre);
  const apellidoBuscado = normalizarTexto(formulario.apellido);

  if (!nombreBuscado || !apellidoBuscado) return null;

  const primeraPalabra = (texto) => normalizarTexto(texto).split(/\s+/)[0] || '';

  return socios.find((socio) => {
    const primerNombre = primeraPalabra(socio.nombres);
    const primerApellido = primeraPalabra(socio.apellidos);
    const nombresCompletos = normalizarTexto(socio.nombres);
    const apellidosCompletos = normalizarTexto(socio.apellidos);

    const coincideNombre = primerNombre === nombreBuscado || nombresCompletos === nombreBuscado;
    const coincideApellido = primerApellido === apellidoBuscado || apellidosCompletos === apellidoBuscado;

    return coincideNombre && coincideApellido;
  });
};

const extraerMensajeError = (error, respaldo) => {
  const mensaje = error?.message || '';

  try {
    const cuerpo = JSON.parse(mensaje);
    return cuerpo.message || cuerpo.error || respaldo;
  } catch {
    return mensaje || respaldo;
  }
};


const formatearFecha = (valor) => (valor ? new Date(valor).toLocaleString('es-NI') : 'N/A');

const estilosEstadoQr = {
  cargando: {
    borderColor: 'rgba(var(--accent-rgb), 0.3)',
    backgroundColor: 'rgba(var(--accent-rgb), 0.12)',
    color: 'var(--accent-color)',
  },
  pendiente: {
    borderColor: 'rgba(var(--accent-rgb), 0.3)',
    backgroundColor: 'rgba(var(--accent-rgb), 0.12)',
    color: 'var(--accent-color)',
  },
  validado: {
    borderColor: 'var(--accent-hover-color)',
    backgroundColor: 'rgba(var(--accent-rgb), 0.18)',
    color: 'var(--accent-color)',
  },
  expirado: {
    borderColor: 'var(--accent-soft-color)',
    backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
    color: 'var(--accent-hover-color)',
  },
  error: {
    borderColor: 'var(--accent-hover-color)',
    backgroundColor: 'rgba(var(--accent-rgb), 0.14)',
    color: 'var(--accent-hover-color)',
  },
};

const obtenerEstiloEstadoQr = (estado) => estilosEstadoQr[estado] || estilosEstadoQr.pendiente;

const CheckIn = () => {
  const [socios, setSocios] = useState([]);
  const [socioValidado, setSocioValidado] = useState(null);
  const [errorManual, setErrorManual] = useState('');
  const [errorQr, setErrorQr] = useState('');
  const [mensajeQr, setMensajeQr] = useState('');
  const [formularioManual, setFormularioManual] = useState(formularioManualInicial);
  const [historialAccesos, setHistorialAccesos] = useState([]);
  const [validando, setValidando] = useState(false);
  const [cargandoQr, setCargandoQr] = useState(false);
  const [estadoQr, setEstadoQr] = useState('cargando');
  const [qrSesion, setQrSesion] = useState(null);
  const [qrImagen, setQrImagen] = useState('');
  const [ahora, setAhora] = useState(Date.now());

  const cargarDatos = useCallback(async () => {
    try {
      const sociosData = await sociosApi.listar();
      setSocios(sociosData);
    } catch (e) {
      console.error("Error loading socios:", e);
      throw e;
    }
    
    try {
      const asistenciasData = await operacionApi.asistenciasRecientes();
      setHistorialAccesos(asistenciasData);
    } catch (e) {
      console.error("Error loading recent assistances:", e);
    }
  }, []);

  const registrarSocioValidado = useCallback((respuesta, origenAcceso) => {
    const socioApi = socios.find((socio) => (socio.usuarioId || socio.id) === respuesta.socioId);
    const nombreCompleto = respuesta.socio || `${socioApi?.nombres || ''} ${socioApi?.apellidos || ''}`.trim();

    setSocioValidado({
      ...socioApi,
      id: respuesta.socioId,
      nombres: socioApi?.nombres || nombreCompleto,
      apellidos: socioApi?.apellidos || '',
      nombreCompleto,
      tipoMembresia: respuesta.tipoMembresia || respuesta.membresia || socioApi?.tipoMembresia,
      fechaVencimiento: respuesta.fechaVencimiento || socioApi?.fechaVencimiento,
      estadoAcceso: respuesta.estadoAcceso || socioApi?.estadoAcceso,
      estadoAccesoValidado: respuesta.estado || 'Permitido',
      origenAcceso,
      fechaHoraValidacion: respuesta.fechaHora,
      mensajeValidacion: respuesta.mensaje || 'Asistencia validada.',
    });
  }, [socios]);

  const generarSesionQr = useCallback(async () => {
    setCargandoQr(true);
    setEstadoQr('cargando');
    setErrorQr('');
    setMensajeQr('');
    setQrSesion(null);
    setQrImagen('');

    try {
      const respuesta = await asistenciasApi.qrValidacion();
      const token = String(respuesta?.token || '').trim();

      if (!token) {
        throw new Error('La API no devolvio un token QR valido.');
      }

      const imagen = await QRCode.toDataURL(token, {
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      setQrSesion(respuesta);
      setQrImagen(imagen);
      setEstadoQr('pendiente');
      setMensajeQr('QR listo. Pide al socio escanearlo desde su app movil.');
    } catch (error) {
      setEstadoQr('error');
      setErrorQr(extraerMensajeError(error, 'No se pudo generar el QR de validacion.'));
    } finally {
      setCargandoQr(false);
      setAhora(Date.now());
    }
  }, []);

  const consultarEstadoQr = useCallback(async () => {
    if (!qrSesion?.token || estadoQr !== 'pendiente' || cargandoQr) return;

    try {
      const respuesta = await asistenciasApi.estadoQrValidacionPorToken(qrSesion.token);
      const estado = normalizarTexto(respuesta?.estado);

      if (respuesta?.id || estado === 'permitido') {
        registrarSocioValidado(respuesta, 'QR movil');
        setEstadoQr('validado');
        setMensajeQr(respuesta.mensaje || 'Asistencia validada.');
        setErrorQr('');
        await cargarDatos();
        return;
      }

      if (estado === 'expirado') {
        setEstadoQr('expirado');
        setMensajeQr(respuesta?.mensaje || 'QR expirado. Genera uno nuevo.');
      }
    } catch (error) {
      setErrorQr(extraerMensajeError(error, 'No se pudo consultar el estado del QR.'));
    }
  }, [cargandoQr, cargarDatos, estadoQr, qrSesion?.token, registrarSocioValidado]);

  useEffect(() => {
    Promise.resolve()
      .then(cargarDatos)
      .catch((error) => {
        const mensaje = error?.message || '';
        if (mensaje.includes('403') || mensaje.includes('401')) {
          setErrorManual('Sesion expirada. Cierra sesion e inicia nuevamente.');
        } else {
          setErrorManual('No se pudieron cargar socios o asistencias desde la API. Verifica que el servidor este activo.');
        }
      });
  }, [cargarDatos]);

  useEffect(() => {
    generarSesionQr();
  }, [generarSesionQr]);

  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!qrSesion?.token || estadoQr !== 'pendiente') return undefined;

    consultarEstadoQr();
    const intervalo = window.setInterval(consultarEstadoQr, 2500);
    return () => window.clearInterval(intervalo);
  }, [consultarEstadoQr, estadoQr, qrSesion?.token]);

  const expiraMs = useMemo(() => {
    const valor = qrSesion?.expiraEn ? new Date(qrSesion.expiraEn).getTime() : 0;
    return Number.isFinite(valor) ? valor : 0;
  }, [qrSesion?.expiraEn]);
  const segundosRestantes = expiraMs ? Math.max(0, Math.ceil((expiraMs - ahora) / 1000)) : 0;

  useEffect(() => {
    if (estadoQr === 'pendiente' && expiraMs && segundosRestantes <= 0) {
      setEstadoQr('expirado');
      setMensajeQr('QR expirado. Genera uno nuevo.');
    }
  }, [estadoQr, expiraMs, segundosRestantes]);

  const actualizarCampoManual = (evento) => {
    setFormularioManual({ ...formularioManual, [evento.target.name]: evento.target.value });
    setErrorManual('');
  };

  const registrarAcceso = async (socio, origen) => {
    if (!socio) {
      setSocioValidado(null);
      setErrorManual('No encontramos un socio con esos datos.');
      return;
    }

    setValidando(true);
    setErrorManual('');

    try {
      await asistenciasApi.checkIn(socio.usuarioId || socio.id);
      setSocioValidado({
        ...socio,
        nombreCompleto: `${socio.nombres} ${socio.apellidos}`,
        estadoAccesoValidado: 'Permitido',
        origenAcceso: origen,
        fechaHoraValidacion: new Date().toISOString(),
        mensajeValidacion: 'Asistencia validada.',
      });
      setFormularioManual(formularioManualInicial);
      await cargarDatos();
    } catch (error) {
      setSocioValidado({
        ...socio,
        nombreCompleto: `${socio.nombres} ${socio.apellidos}`,
        estadoAccesoValidado: 'Denegado',
        origenAcceso: origen,
      });
      setErrorManual(extraerMensajeError(error, 'Acceso denegado por la API.'));
    } finally {
      setValidando(false);
    }
  };

  const validarManual = (evento) => {
    evento.preventDefault();
    registrarAcceso(buscarSocioPorNombre(socios, formularioManual), 'Manual');
  };

  const reiniciarValidacion = () => {
    setSocioValidado(null);
    setErrorManual('');
    setErrorQr('');
    setMensajeQr('');
    setFormularioManual(formularioManualInicial);
    generarSesionQr();
  };

  const esAccesoPermitido = socioValidado?.estadoAccesoValidado === 'Permitido';
  const qrValidado = estadoQr === 'validado';

  return (
    <div className="pagina-stack flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <section className="tarjeta-sistema relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <h3 className="text-sm font-black tracking-wide">Validacion de acceso</h3>
              </div>
              {(socioValidado || errorManual || errorQr || mensajeQr) && (
                <button
                  type="button"
                  onClick={reiniciarValidacion}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw size={16} />
                  Limpiar
                </button>
              )}
            </div>

            <div className="panel-qr-validacion rounded-2xl border border-white/10 bg-[#0a0a0a]/70 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="rounded-xl bg-red-600/10 p-2 text-red-500">
                  <QrCode size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">QR para validar desde movil</h4>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Muestra este codigo en recepcion. El socio lo escanea en su app y confirma su asistencia.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr] lg:items-center">
                <div className="qr-validacion-marco relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center overflow-hidden rounded-2xl border-2 border-red-600/30 bg-white p-4">
                  {cargandoQr && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white text-[#111111]">
                      <Loader2 size={34} className="mb-3 animate-spin text-red-600" />
                      <span className="text-sm font-black">Generando QR</span>
                    </div>
                  )}

                  {qrImagen ? (
                    <img src={qrImagen} alt="QR de validacion web" className="h-full w-full object-contain" />
                  ) : (
                    <QrCode size={86} className="text-black/10" strokeWidth={1.2} />
                  )}
                </div>

                <div className="space-y-3">
                  <EstadoQr estadoQr={estadoQr} segundosRestantes={segundosRestantes} />
                  <DatoQr icono={Smartphone} etiqueta="Flujo" valor="Web muestra QR, socio escanea y valida en Android" />
                  <DatoQr icono={Clock} etiqueta="Expira" valor={qrSesion?.expiraEn ? formatearFecha(qrSesion.expiraEn) : 'N/A'} />
                  <DatoQr icono={QrCode} etiqueta="Sesion" valor={qrSesion?.sessionId || 'Pendiente'} />
                </div>
              </div>

              {mensajeQr && (
                <div
                  className="mt-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold"
                  style={obtenerEstiloEstadoQr(estadoQr)}
                >
                  {qrValidado ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {mensajeQr}
                </div>
              )}

              {errorQr && (
                <div
                  className="mt-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold"
                  style={obtenerEstiloEstadoQr('error')}
                >
                  <AlertCircle size={15} />
                  {errorQr}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={generarSesionQr}
                  disabled={cargandoQr}
                  className="boton-primario inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw size={16} />
                  {cargandoQr ? 'Generando...' : 'Generar nuevo QR'}
                </button>
              </div>
            </div>

            <form onSubmit={validarManual} className="panel-validacion-manual rounded-2xl border border-white/10 bg-[#0a0a0a]/70 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="rounded-xl bg-red-600/10 p-2 text-red-500">
                  <Search size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">Validacion manual</h4>
                  <p className="mt-1 text-xs leading-5 text-gray-500">Busca al socio por nombre y apellido registrados en la API.</p>
                </div>
              </div>

              {errorManual && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                  <AlertCircle size={15} />
                  {errorManual}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoManual etiqueta="Nombre" nombre="nombre" valor={formularioManual.nombre} placeholder="Ej. Carlos" onChange={actualizarCampoManual} />
                <CampoManual etiqueta="Apellido" nombre="apellido" valor={formularioManual.apellido} placeholder="Ej. Ramirez" onChange={actualizarCampoManual} />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  disabled={validando}
                  className="boton-primario inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  Validar manual
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="tarjeta-sistema relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
          <h3 className="mb-6 text-sm font-black uppercase tracking-wider text-gray-400">Informacion del socio</h3>

          {socioValidado ? (
            <div className="animate-fade-in relative z-10 flex flex-1 flex-col items-center pt-4">
              
              {/* Profile Photo Placeholder */}
              <div className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-3xl border-2 border-red-600/40 bg-[#1a1a1a] shadow-[0_0_20px_rgba(220,38,38,0.15)]">
                <Camera size={40} className="text-gray-500 opacity-50" />
                {esAccesoPermitido ? (
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-900/50">
                    <CheckCircle2 size={18} />
                  </div>
                ) : (
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-900/50">
                    <XCircle size={18} />
                  </div>
                )}
              </div>

              {/* Name and Subtitle */}
              <h2 className="mb-1 text-2xl font-black text-white text-center">
                {socioValidado.nombreCompleto || `${socioValidado.nombres} ${socioValidado.apellidos}`.trim()}
              </h2>
              <p className="mb-6 text-sm font-medium text-gray-400">
                {socioValidado.email || 'socio@spartangym.com'}
              </p>

              {/* Validation Status Message */}
              <div className={`mb-6 w-full rounded-xl p-3 text-center text-sm font-bold border ${esAccesoPermitido ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                {socioValidado.mensajeValidacion || (esAccesoPermitido ? 'Asistencia validada con éxito.' : 'Acceso denegado por la API.')}
              </div>

              {/* Info Cards */}
              <div className="w-full space-y-3">
                <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#1a1a1a] p-4 transition-colors hover:border-white/10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Plan actual</p>
                    <p className="font-bold text-white">{socioValidado.tipoMembresia || 'Sin membresia'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#1a1a1a] p-4 transition-colors hover:border-white/10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Vencimiento de membresía</p>
                    <p className="font-bold text-white">{socioValidado.fechaVencimiento || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#1a1a1a] p-4 transition-colors hover:border-white/10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Hora de validación</p>
                    <p className="font-bold text-white">{formatearFecha(socioValidado.fechaHoraValidacion)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in flex flex-1 flex-col items-center justify-center text-center text-gray-500">
              <QrCode size={60} className="mb-4 animate-pulse opacity-30" />
              <p className="text-lg font-bold">Esperando validacion movil o manual...</p>
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
                <th className="pb-3 pr-4 font-bold">Hora</th>
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
                  <td className="py-3 pr-4 text-gray-400">{formatearFecha(acceso.fechaHora)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">
                      <CheckCircle2 size={12} /> Permitido
                    </span>
                  </td>
                </tr>
              ))}

              {historialAccesos.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-gray-500">
                    No hay asistencias recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const EstadoQr = ({ estadoQr, segundosRestantes }) => {
  const textos = {
    cargando: 'Generando QR',
    pendiente: `Esperando app movil (${segundosRestantes}s)`,
    validado: 'Asistencia validada',
    expirado: 'QR expirado',
    error: 'Error de QR',
  };

  return (
    <div
      className="flex items-center gap-2 rounded-xl border p-3 text-xs font-black"
      style={obtenerEstiloEstadoQr(estadoQr)}
    >
      {estadoQr === 'validado' ? <CheckCircle2 size={15} /> : <Clock size={15} />}
      {textos[estadoQr] || textos.pendiente}
    </div>
  );
};

const DatoQr = ({ icono: Icono, etiqueta, valor }) => (
  <div className="dato-qr-validacion flex items-start gap-3 rounded-xl border border-white/5 bg-[#050505] p-3">
    <span className="mt-0.5 rounded-lg bg-[#2a0808] p-2 text-red-500">
      <Icono size={16} />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{etiqueta}</p>
      <p className="break-words text-sm font-bold text-white">{valor}</p>
    </div>
  </div>
);

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
