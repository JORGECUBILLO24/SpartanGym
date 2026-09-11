package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.DashboardResponse;
import ni.edu.uam.SpartanGymAPI.services.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // El socioId viene por URL: sin el chequeo de propiedad, un socio podía cambiar el
    // UUID y ver el inicio de cualquier otro. La app siempre manda el suyo, así que
    // esta regla no cambia su comportamiento.
    @GetMapping("/inicio/{socioId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA', 'ENTRENADOR') "
            + "or @accesoSocio.esElMismo(authentication, #socioId)")
    public ResponseEntity<DashboardResponse> obtenerInicio(@PathVariable UUID socioId) {
        return ResponseEntity.ok(dashboardService.obtenerDashboardInicio(socioId));
    }
}