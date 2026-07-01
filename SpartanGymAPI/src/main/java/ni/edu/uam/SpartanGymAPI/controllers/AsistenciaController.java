package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrRequest;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrTokenResponse;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrValidationResponse;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaRequest;
import ni.edu.uam.SpartanGymAPI.models.Asistencia;
import ni.edu.uam.SpartanGymAPI.services.AsistenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/asistencias", "/api/asistencia"})
@RequiredArgsConstructor
public class AsistenciaController {

    private final AsistenciaService asistenciaService;

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_RECEPCIONISTA')")
    public ResponseEntity<Asistencia> registrarCheckIn(@RequestBody AsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.registrarEntrada(request));
    }

    @GetMapping("/qr-activo")
    @PreAuthorize("hasAuthority('ROLE_SOCIO')")
    public ResponseEntity<AsistenciaQrTokenResponse> obtenerQrActivo(Principal principal) {
        return ResponseEntity.ok(asistenciaService.generarQrAsistencia(principal.getName()));
    }

    @GetMapping("/qr-validacion")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_RECEPCIONISTA')")
    public ResponseEntity<AsistenciaQrTokenResponse> obtenerQrValidacion(Principal principal) {
        return ResponseEntity.ok(asistenciaService.generarQrValidacionWeb(principal.getName()));
    }

    @PostMapping("/check-in-qr")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_RECEPCIONISTA')")
    public ResponseEntity<AsistenciaQrValidationResponse> registrarCheckInQr(
            @RequestBody AsistenciaQrRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(asistenciaService.registrarEntradaQr(request, principal.getName()));
    }

    @PostMapping("/check-in-qr-web")
    @PreAuthorize("hasAuthority('ROLE_SOCIO')")
    public ResponseEntity<AsistenciaQrValidationResponse> registrarCheckInQrWeb(
            @RequestBody AsistenciaQrRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(asistenciaService.registrarEntradaQrWeb(request, principal.getName()));
    }

    @PostMapping("/qr-validacion/estado")
    public ResponseEntity<AsistenciaQrValidationResponse> consultarEstadoQrValidacion(@RequestBody AsistenciaQrRequest request) {
        return ResponseEntity.ok(asistenciaService.consultarEstadoQrValidacion(request));
    }

    @GetMapping("/estado/{sessionId}")
    public ResponseEntity<AsistenciaQrValidationResponse> consultarEstadoQrValidacion(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(asistenciaService.consultarEstadoQrValidacion(sessionId));
    }

    @GetMapping("/socio/{socioId}")
    public ResponseEntity<List<Asistencia>> obtenerHistorialSocio(@PathVariable UUID socioId) {
        return ResponseEntity.ok(asistenciaService.obtenerHistorial(socioId));
    }
}
