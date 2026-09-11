package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.GenerarReporteRequest;
import ni.edu.uam.SpartanGymAPI.dto.ReporteGeneradoResponse;
import ni.edu.uam.SpartanGymAPI.dto.ReporteResumenResponse;
import ni.edu.uam.SpartanGymAPI.services.ReporteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Datos de negocio del gimnasio (ingresos totales, margen neto, retención).
 * Solo dirección: no es información que deba ver un socio ni recepción.
 */
@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/resumen")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<ReporteResumenResponse> obtenerResumen(
            @RequestHeader(value = "X-Sucursal-Id", required = false) String sucursalId) {
        return ResponseEntity.ok(reporteService.obtenerResumen(sucursalId));
    }

    @PostMapping("/generar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<ReporteGeneradoResponse> generar(
            @RequestBody GenerarReporteRequest request,
            @RequestHeader(value = "X-Sucursal-Id", required = false) String sucursalId) {
        return ResponseEntity.ok(reporteService.generar(request.getTipo(), sucursalId));
    }
}
