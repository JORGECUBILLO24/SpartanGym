package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
import ni.edu.uam.SpartanGymAPI.services.RutinaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rutinas")
@RequiredArgsConstructor
public class RutinaController {

    private final RutinaService rutinaService;

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
}
