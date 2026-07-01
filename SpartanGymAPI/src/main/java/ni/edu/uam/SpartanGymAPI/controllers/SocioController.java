package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.EstadoSocioResponse;
import ni.edu.uam.SpartanGymAPI.dto.SocioResponse;
import ni.edu.uam.SpartanGymAPI.services.SocioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/socios")
@RequiredArgsConstructor
public class SocioController {

    private final SocioService socioService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA', 'ENTRENADOR')")
    public ResponseEntity<List<SocioResponse>> listar() {
        return ResponseEntity.ok(socioService.listarSocios());
    }

    @GetMapping("/estado/{socioId}")
    public ResponseEntity<EstadoSocioResponse> consultarEstado(@PathVariable UUID socioId) {
        return ResponseEntity.ok(socioService.consultarEstado(socioId));
    }
}
