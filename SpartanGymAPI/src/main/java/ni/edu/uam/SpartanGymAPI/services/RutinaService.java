package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RutinaService {

    private final RutinaRepository rutinaRepository;
    private final PersonalRepository personalRepository;
    private final SocioRepository socioRepository;
    private final EjercicioRepository ejercicioRepository;
    private final NotificacionService notificacionService;

    private static final DateTimeFormatter FECHA_CORREO = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarRutinas() {
        return rutinaRepository.findAll().stream()
                .map(this::mapearRutina)
                .toList();
    }

    @Transactional
    public Rutina crearRutinaPersonalizada(RutinaRequest request) {
        validarRutina(request);

        Personal entrenador = personalRepository.findById(request.getIdEntrenador())
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));

        Socio socio = socioRepository.findById(request.getIdSocio())
                .orElseThrow(() -> new RuntimeException("Socio no encontrado"));

        validarMismaSucursal(entrenador, socio);

        Rutina guardada = rutinaRepository.save(construirRutina(request, socio, entrenador, false));
        notificarRutinaAsignada(guardada);
        return guardada;
    }

    @Transactional
    public Map<String, Object> crearRutinaGlobal(RutinaRequest request) {
        validarRutina(request);

        Personal entrenador = personalRepository.findById(request.getIdEntrenador())
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));

        // Si quien asigna es un entrenador, la rutina global solo alcanza a los socios de su sucursal.
        UUID sucursalEntrenador = esEntrenador(entrenador) && entrenador.getSucursal() != null
                ? entrenador.getSucursal().getId()
                : null;

        List<Socio> sociosActivos = socioRepository.findAll().stream()
                .filter(socio -> socio.getUsuario() != null)
                .filter(socio -> Boolean.TRUE.equals(socio.getUsuario().getActivo()))
                .filter(socio -> sucursalEntrenador == null
                        || (socio.getSucursal() != null && sucursalEntrenador.equals(socio.getSucursal().getId())))
                .toList();

        if (sociosActivos.isEmpty()) {
            throw new RuntimeException("No hay socios activos para asignar la rutina global");
        }

        List<Rutina> guardadas = new ArrayList<>();
        for (Socio socio : sociosActivos) {
            Rutina guardada = rutinaRepository.save(construirRutina(request, socio, entrenador, true));
            guardadas.add(guardada);
            notificarRutinaAsignada(guardada);
        }

        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("rutinasCreadas", guardadas.size());
        resumen.put("mensaje", "Rutina global asignada correctamente");
        resumen.put("rutinas", guardadas.stream().map(this::mapearRutina).toList());
        return resumen;
    }

    private void validarRutina(RutinaRequest request) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            throw new RuntimeException("La rutina debe incluir al menos un ejercicio");
        }
        if (request.getIdEntrenador() == null) {
            throw new RuntimeException("Selecciona un entrenador");
        }
        if (!Boolean.TRUE.equals(request.getEsGlobal()) && request.getIdSocio() == null) {
            throw new RuntimeException("Selecciona un socio para la rutina personal");
        }
        if (request.getFechaInicio() != null && request.getFechaFin() != null && request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new RuntimeException("La fecha final no puede ser anterior a la fecha inicial");
        }
    }

    private Rutina construirRutina(RutinaRequest request, Socio socio, Personal entrenador, boolean esGlobal) {
        Rutina rutina = new Rutina();
        rutina.setEntrenador(entrenador);
        rutina.setSocio(socio);
        rutina.setNombre(textoOpcional(request.getNombre(), nombreRutinaDefault(request)));
        rutina.setTipoRutina(textoOpcional(request.getTipoRutina(), "General"));
        rutina.setGeneroObjetivo(textoOpcional(request.getGeneroObjetivo(), "Todos"));
        rutina.setEsGlobal(esGlobal);
        rutina.setFechaInicio(request.getFechaInicio());
        rutina.setFechaFin(request.getFechaFin());
        rutina.setObjetivo(textoOpcional(request.getObjetivo(), "Plan de entrenamiento"));
        rutina.setNotas(limpiarTexto(request.getNotas()));
        rutina.setFechaAsignacion(LocalDateTime.now());

        List<RutinaDetalle> detalles = request.getDetalles().stream().map(dto -> {
            Ejercicio ejercicio = ejercicioRepository.findById(dto.getIdEjercicio())
                    .orElseThrow(() -> new RuntimeException("Ejercicio no encontrado con ID: " + dto.getIdEjercicio()));

            RutinaDetalle detalle = new RutinaDetalle();
            detalle.setRutina(rutina);
            detalle.setEjercicio(ejercicio);
            detalle.setSeries(dto.getSeries());
            detalle.setRepeticiones(dto.getRepeticiones());
            detalle.setTipoEjercicio(textoOpcional(dto.getTipoEjercicio(), "Fuerza"));
            detalle.setDiaProgramado(dto.getDiaProgramado());
            detalle.setPesoSugeridoKg(dto.getPesoSugeridoKg());
            detalle.setTiempoDescansoSegundos(dto.getTiempoDescansoSegundos());
            detalle.setNotas(limpiarTexto(dto.getNotas()));
            detalle.setOrden(dto.getOrden());

            return detalle;
        }).collect(Collectors.toList());

        rutina.setDetalles(detalles);
        return rutina;
    }

    private String nombreRutinaDefault(RutinaRequest request) {
        String genero = textoOpcional(request.getGeneroObjetivo(), "Todos");
        String tipo = textoOpcional(request.getTipoRutina(), "General");
        return "Rutina " + genero.toLowerCase() + " - " + tipo;
    }

    private void notificarRutinaAsignada(Rutina rutina) {
        Usuario usuario = rutina.getSocio().getUsuario();
        String nombreSocio = rutina.getSocio().getNombres() + " " + rutina.getSocio().getApellidos();
        String mensaje = "Nueva rutina agregada: " + rutina.getNombre();

        notificacionService.registrarNotificacion(usuario, "RUTINA", "Nueva rutina agregada", mensaje);
        notificacionService.enviarCorreoRutinaAsignada(
                usuario != null ? usuario.getEmail() : null,
                nombreSocio,
                rutina.getNombre(),
                rutina.getObjetivo(),
                rutina.getEntrenador().getNombres() + " " + rutina.getEntrenador().getApellidos(),
                rutina.getDetalles().size(),
                fechaTexto(rutina.getFechaInicio()),
                fechaTexto(rutina.getFechaFin()),
                Boolean.TRUE.equals(rutina.getEsGlobal())
        );
    }

    // Un entrenador solo puede asignar rutinas a socios de su misma sucursal.
    // Admin y superadmin no tienen esta restriccion.
    private void validarMismaSucursal(Personal entrenador, Socio socio) {
        if (!esEntrenador(entrenador)) {
            return;
        }
        UUID sucursalEntrenador = entrenador.getSucursal() != null ? entrenador.getSucursal().getId() : null;
        UUID sucursalSocio = socio.getSucursal() != null ? socio.getSucursal().getId() : null;
        if (sucursalEntrenador == null || !sucursalEntrenador.equals(sucursalSocio)) {
            throw new RuntimeException("El socio no pertenece a tu sucursal. Solo puedes asignar rutinas a socios de tu gimnasio.");
        }
    }

    private boolean esEntrenador(Personal entrenador) {
        return entrenador.getUsuario() != null
                && entrenador.getUsuario().getRol() != null
                && "ROLE_ENTRENADOR".equals(entrenador.getUsuario().getRol().getNombre());
    }

    private String fechaTexto(LocalDate fecha) {
        return fecha == null ? "Sin fecha definida" : fecha.format(FECHA_CORREO);
    }

    private String textoOpcional(String valor, String respaldo) {
        String limpio = limpiarTexto(valor);
        return limpio == null || limpio.isBlank() ? respaldo : limpio;
    }

    private String limpiarTexto(String valor) {
        return valor == null ? null : valor.trim();
    }

    private Map<String, Object> mapearRutina(Rutina rutina) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", rutina.getId());
        data.put("socioId", rutina.getSocio().getUsuarioId());
        data.put("socio", rutina.getSocio().getNombres() + " " + rutina.getSocio().getApellidos());
        data.put("entrenadorId", rutina.getEntrenador().getUsuarioId());
        data.put("entrenador", rutina.getEntrenador().getNombres() + " " + rutina.getEntrenador().getApellidos());
        data.put("fechaAsignacion", rutina.getFechaAsignacion());
        data.put("nombre", rutina.getNombre());
        data.put("tipoRutina", rutina.getTipoRutina());
        data.put("generoObjetivo", rutina.getGeneroObjetivo());
        data.put("esGlobal", Boolean.TRUE.equals(rutina.getEsGlobal()));
        data.put("fechaInicio", rutina.getFechaInicio());
        data.put("fechaFin", rutina.getFechaFin());
        data.put("objetivo", rutina.getObjetivo());
        data.put("notas", rutina.getNotas());
        data.put("ejercicios", rutina.getDetalles().stream()
                .sorted(Comparator.comparing(detalle -> Objects.requireNonNullElse(detalle.getOrden(), 0)))
                .map(detalle -> {
            Map<String, Object> ejercicio = new LinkedHashMap<>();
            ejercicio.put("ejercicioId", detalle.getEjercicio().getId());
            ejercicio.put("ejercicio", detalle.getEjercicio().getNombre());
            ejercicio.put("grupoMuscular", detalle.getEjercicio().getGrupoMuscular().getNombre());
            ejercicio.put("grupoMuscularId", detalle.getEjercicio().getGrupoMuscular().getId());
            ejercicio.put("tipoEjercicio", detalle.getTipoEjercicio());
            ejercicio.put("diaProgramado", detalle.getDiaProgramado());
            ejercicio.put("series", detalle.getSeries());
            ejercicio.put("repeticiones", detalle.getRepeticiones());
            ejercicio.put("pesoSugeridoKg", detalle.getPesoSugeridoKg());
            ejercicio.put("tiempoDescansoSegundos", detalle.getTiempoDescansoSegundos());
            ejercicio.put("notas", detalle.getNotas());
            ejercicio.put("orden", detalle.getOrden());
            return ejercicio;
        }).toList());
        return data;
    }
}
