package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.MensajeGlobalRequest;
import ni.edu.uam.SpartanGymAPI.models.Notificacion;
import ni.edu.uam.SpartanGymAPI.repositories.NotificacionRepository;
import ni.edu.uam.SpartanGymAPI.services.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final NotificacionRepository notificacionRepository;

    @GetMapping("/globales")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<List<Notificacion>> listarGlobales() {
        return ResponseEntity.ok(notificacionRepository.findByUsuarioIsNullOrderByFechaCreacionDesc());
    }

    @PostMapping("/globales")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Notificacion> crearGlobal(@RequestBody MensajeGlobalRequest request) {
        String tipo = request.getTipo() == null || request.getTipo().isBlank() ? "General" : request.getTipo().trim();
        String titulo = request.getTitulo() == null || request.getTitulo().isBlank()
                ? "Aviso global"
                : request.getTitulo().trim();
        String mensaje = request.getMensaje() == null ? "" : request.getMensaje().trim();

        Notificacion notificacion = notificacionService.registrarNotificacion(
                null,
                tipo,
                titulo,
                mensaje
        );
        notificacionService.enviarCorreoGlobal(tipo, titulo, mensaje);
        return ResponseEntity.ok(notificacion);
    }
}
