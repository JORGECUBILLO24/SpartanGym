package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.MarcarEjercicioRequest;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
import ni.edu.uam.SpartanGymAPI.services.EjercicioCompletadoService;
import ni.edu.uam.SpartanGymAPI.services.RutinaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/rutinas")
@RequiredArgsConstructor
public class RutinaController {

    private final RutinaService rutinaService;
    private final EjercicioCompletadoService ejercicioCompletadoService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<List<Map<String, Object>>> listarRutinas() {
        return ResponseEntity.ok(rutinaService.listarRutinas());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<Object> crearRutina(@RequestBody RutinaRequest request) {
        if (Boolean.TRUE.equals(request.getEsGlobal())) {
            return ResponseEntity.ok(rutinaService.crearRutinaGlobal(request));
        }

        return ResponseEntity.ok(rutinaService.crearRutinaPersonalizada(request));
    }

    @PostMapping("/global")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPERADMIN', 'ROLE_ADMIN', 'ROLE_ENTRENADOR')")
    public ResponseEntity<Map<String, Object>> crearRutinaGlobal(@RequestBody RutinaRequest request) {
        return ResponseEntity.ok(rutinaService.crearRutinaGlobal(request));
    }

    // El socio marca/desmarca su propio ejercicio de la rutina (socio sale del token, no del body).
    @PostMapping("/{rutinaId}/ejercicios/{ejercicioId}/completar")
    @PreAuthorize("hasAuthority('ROLE_SOCIO')")
    public ResponseEntity<Void> marcarEjercicioCompletado(
            @PathVariable UUID rutinaId,
            @PathVariable Long ejercicioId,
            @RequestBody MarcarEjercicioRequest request,
            Authentication auth
    ) {
        ejercicioCompletadoService.marcarCompletado(auth.getName(), rutinaId, ejercicioId, request);
        return ResponseEntity.ok().build();
    }
}
