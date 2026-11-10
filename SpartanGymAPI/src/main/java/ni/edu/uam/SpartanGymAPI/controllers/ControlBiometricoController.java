package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.ControlBiometricoRequest;
import ni.edu.uam.SpartanGymAPI.dto.ControlBiometricoResponse;
import ni.edu.uam.SpartanGymAPI.services.ControlBiometricoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/progreso")
@RequiredArgsConstructor
public class ControlBiometricoController {

    private final ControlBiometricoService controlService;

    // Endpoint para registrar un nuevo pesaje.
    // El idSocio viaja en el body: sin el chequeo de propiedad, un socio podía registrarle
    // progreso a otro con solo cambiarlo.
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA', 'ENTRENADOR') "
            + "or @accesoSocio.esElMismo(authentication, #request.idSocio)")
    public ResponseEntity<ControlBiometricoResponse> registrar(@RequestBody ControlBiometricoRequest request) {
        return ResponseEntity.ok(ControlBiometricoResponse.desde(controlService.registrarProgreso(request)));
    }

    // Endpoint para obtener la gráfica de historial
    @GetMapping("/socio/{socioId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA', 'ENTRENADOR') "
            + "or @accesoSocio.esElMismo(authentication, #socioId)")
    public ResponseEntity<List<ControlBiometricoResponse>> obtenerHistorial(@PathVariable UUID socioId) {
        return ResponseEntity.ok(controlService.obtenerHistorialProgreso(socioId).stream()
                .map(ControlBiometricoResponse::desde)
                .toList());
    }
}