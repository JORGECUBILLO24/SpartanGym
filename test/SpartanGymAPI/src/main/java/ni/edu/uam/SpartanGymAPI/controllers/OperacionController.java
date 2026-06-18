package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/operacion")
@RequiredArgsConstructor
public class OperacionController {
    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final PersonalRepository personalRepository;
    private final PagoRepository pagoRepository;
    private final MembresiaSocioRepository membresiaRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final RutinaRepository rutinaRepository;
    private final NotificacionRepository notificacionRepository;

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> perfilActual(Authentication auth) {
        Usuario usuario = usuarioAutenticado(auth);
        Map<String, Object> data = usuarioBase(usuario);
        socioRepository.findById(usuario.getId()).ifPresent(socio -> {
            data.put("nombres", socio.getNombres());
            data.put("apellidos", socio.getApellidos());
            data.put("telefono", socio.getTelefono());
            data.put("estadoAcceso", socio.getEstadoAcceso());
            data.put("tipo", "socio");
        });
        personalRepository.findById(usuario.getId()).ifPresent(personal -> {
            data.put("nombres", personal.getNombres());
            data.put("apellidos", personal.getApellidos());
            data.put("especialidad", personal.getEspecialidad());
            data.put("tipo", "personal");
        });
        return ResponseEntity.ok(data);
    }

    @GetMapping("/recepcion/inicio")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> inicioRecepcion() {
        LocalDate hoy = LocalDate.now();
        List<MembresiaSocio> vencimientos = membresiaRepository
                .findByEstadoAndFechaVencimientoBetweenOrderByFechaVencimientoAsc("Activa", hoy, hoy.plusDays(15));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("sociosActivos", socioRepository.count());
        data.put("membresiasActivas", membresiaRepository.countByEstado("Activa"));
        data.put("pagosRecientes", pagoRepository.findAllByOrderByFechaTransaccionDesc().stream().limit(8).map(this::pagoMap).toList());
        data.put("proximosVencimientos", vencimientos.stream().limit(8).map(this::membresiaMap).toList());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/asistencias/recientes")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> asistenciasRecientes() {
        return ResponseEntity.ok(asistenciaRepository.findAll().stream()
                .sorted(Comparator.comparing(Asistencia::getFechaHora).reversed())
                .limit(50)
                .map(this::asistenciaMap)
                .toList());
    }

    @GetMapping("/pagos")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> pagos() {
        return ResponseEntity.ok(pagoRepository.findAllByOrderByFechaTransaccionDesc().stream().map(this::pagoMap).toList());
    }

    @GetMapping("/pagos/socio/{socioId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> pagosSocio(@PathVariable UUID socioId) {
        return ResponseEntity.ok(pagoRepository.findBySocioUsuarioIdOrderByFechaTransaccionDesc(socioId).stream().map(this::pagoMap).toList());
    }

    @GetMapping("/membresias")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> membresias() {
        return ResponseEntity.ok(membresiaRepository.findAllByOrderByFechaVencimientoAsc().stream().map(this::membresiaMap).toList());
    }

    @GetMapping("/notificaciones")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> notificaciones(Authentication auth) {
        Usuario usuario = usuarioAutenticado(auth);
        return ResponseEntity.ok(notificacionRepository.findByUsuarioIdOrUsuarioIsNullOrderByFechaCreacionDesc(usuario.getId()).stream()
                .map(this::notificacionMap)
                .toList());
    }

    @PatchMapping("/notificaciones/{id}/leer")
    @Transactional
    public ResponseEntity<Map<String, Object>> marcarLeida(@PathVariable UUID id) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));
        notificacion.setLeida(true);
        return ResponseEntity.ok(notificacionMap(notificacionRepository.save(notificacion)));
    }

    @GetMapping("/socio/{socioId}/rutinas")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> rutinasSocio(@PathVariable UUID socioId) {
        return ResponseEntity.ok(rutinaRepository.findBySocioUsuarioIdOrderByFechaAsignacionDesc(socioId).stream().map(this::rutinaMap).toList());
    }

    @GetMapping("/entrenador/perfil")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ENTRENADOR')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> perfilEntrenador(Authentication auth) {
        Usuario usuario = usuarioAutenticado(auth);
        Personal personal = personalRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));
        Map<String, Object> data = usuarioBase(usuario);
        data.put("nombres", personal.getNombres());
        data.put("apellidos", personal.getApellidos());
        data.put("especialidad", personal.getEspecialidad());
        data.put("rutinasCreadas", rutinaRepository.findByEntrenadorUsuarioIdOrderByFechaAsignacionDesc(usuario.getId()).size());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/entrenador/dashboard")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ENTRENADOR')")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> dashboardEntrenador(Authentication auth) {
        Usuario usuario = usuarioAutenticado(auth);
        List<Rutina> rutinas = rutinaRepository.findByEntrenadorUsuarioIdOrderByFechaAsignacionDesc(usuario.getId());
        long clientes = rutinas.stream().map(r -> r.getSocio().getUsuarioId()).distinct().count();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("clientesAsignados", clientes);
        data.put("rutinasCreadas", rutinas.size());
        data.put("evaluacionesPendientes", clientes);
        data.put("rutinasRecientes", rutinas.stream().limit(8).map(this::rutinaMap).toList());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/entrenador/clientes")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'ENTRENADOR')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> clientesEntrenador(Authentication auth) {
        Usuario usuario = usuarioAutenticado(auth);
        return ResponseEntity.ok(rutinaRepository.findByEntrenadorUsuarioIdOrderByFechaAsignacionDesc(usuario.getId()).stream()
                .map(Rutina::getSocio)
                .filter(distinctById())
                .map(this::socioMap)
                .toList());
    }

    private java.util.function.Predicate<Socio> distinctById() {
        Set<UUID> ids = new HashSet<>();
        return socio -> ids.add(socio.getUsuarioId());
    }

    private Usuario usuarioAutenticado(Authentication auth) {
        if (auth == null || auth.getName() == null) throw new RuntimeException("Usuario no autenticado");
        return usuarioRepository.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private Map<String, Object> usuarioBase(Usuario usuario) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", usuario.getId());
        data.put("email", usuario.getEmail());
        data.put("rol", usuario.getRol().getNombre());
        data.put("activo", usuario.getActivo());
        return data;
    }

    private Map<String, Object> socioMap(Socio socio) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", socio.getUsuarioId());
        data.put("nombres", socio.getNombres());
        data.put("apellidos", socio.getApellidos());
        data.put("telefono", socio.getTelefono());
        data.put("estadoAcceso", socio.getEstadoAcceso());
        data.put("email", socio.getUsuario().getEmail());
        return data;
    }

    private Map<String, Object> pagoMap(Pago pago) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", pago.getId());
        data.put("socioId", pago.getSocio().getUsuarioId());
        data.put("socio", pago.getSocio().getNombres() + " " + pago.getSocio().getApellidos());
        data.put("monto", pago.getMonto());
        data.put("metodoPago", pago.getMetodoPago());
        data.put("fechaTransaccion", pago.getFechaTransaccion());
        return data;
    }

    private Map<String, Object> membresiaMap(MembresiaSocio membresia) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", membresia.getId());
        data.put("socioId", membresia.getSocio().getUsuarioId());
        data.put("socio", membresia.getSocio().getNombres() + " " + membresia.getSocio().getApellidos());
        data.put("tipoMembresia", membresia.getTipoMembresia().getNombre());
        data.put("fechaInicio", membresia.getFechaInicio());
        data.put("fechaVencimiento", membresia.getFechaVencimiento());
        data.put("estado", membresia.getEstado());
        return data;
    }

    private Map<String, Object> asistenciaMap(Asistencia asistencia) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", asistencia.getId());
        data.put("socioId", asistencia.getSocio().getUsuarioId());
        data.put("socio", asistencia.getSocio().getNombres() + " " + asistencia.getSocio().getApellidos());
        data.put("fechaHora", asistencia.getFechaHora());
        return data;
    }

    private Map<String, Object> rutinaMap(Rutina rutina) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", rutina.getId());
        data.put("socioId", rutina.getSocio().getUsuarioId());
        data.put("socio", rutina.getSocio().getNombres() + " " + rutina.getSocio().getApellidos());
        data.put("entrenador", rutina.getEntrenador().getNombres() + " " + rutina.getEntrenador().getApellidos());
        data.put("fechaAsignacion", rutina.getFechaAsignacion());
        data.put("objetivo", rutina.getObjetivo());
        data.put("ejercicios", rutina.getDetalles().stream().map(detalle -> {
            Map<String, Object> ejercicio = new LinkedHashMap<>();
            ejercicio.put("ejercicio", detalle.getEjercicio().getNombre());
            ejercicio.put("series", detalle.getSeries());
            ejercicio.put("repeticiones", detalle.getRepeticiones());
            ejercicio.put("pesoSugeridoKg", detalle.getPesoSugeridoKg());
            ejercicio.put("tiempoDescansoSegundos", detalle.getTiempoDescansoSegundos());
            return ejercicio;
        }).toList());
        return data;
    }

    private Map<String, Object> notificacionMap(Notificacion notificacion) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", notificacion.getId());
        data.put("tipo", notificacion.getTipo());
        data.put("titulo", notificacion.getTitulo());
        data.put("mensaje", notificacion.getMensaje());
        data.put("leida", notificacion.getLeida());
        data.put("fechaCreacion", notificacion.getFechaCreacion());
        return data;
    }
}
