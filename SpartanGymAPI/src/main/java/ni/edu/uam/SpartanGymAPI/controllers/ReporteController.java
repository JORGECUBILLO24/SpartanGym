package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.GenerarReporteRequest;
import ni.edu.uam.SpartanGymAPI.dto.ReporteGeneradoResponse;
import ni.edu.uam.SpartanGymAPI.dto.ReporteResumenResponse;
import ni.edu.uam.SpartanGymAPI.services.ReporteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/resumen")
    public ResponseEntity<ReporteResumenResponse> obtenerResumen(
            @RequestHeader(value = "X-Sucursal-Id", required = false) String sucursalId) {
        return ResponseEntity.ok(reporteService.obtenerResumen(sucursalId));
    }

    @PostMapping("/generar")
    public ResponseEntity<ReporteGeneradoResponse> generar(
            @RequestBody GenerarReporteRequest request,
            @RequestHeader(value = "X-Sucursal-Id", required = false) String sucursalId) {
        return ResponseEntity.ok(reporteService.generar(request.getTipo(), sucursalId));
    }
}
