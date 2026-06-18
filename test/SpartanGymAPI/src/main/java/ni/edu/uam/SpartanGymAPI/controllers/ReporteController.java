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
    public ResponseEntity<ReporteResumenResponse> obtenerResumen() {
        return ResponseEntity.ok(reporteService.obtenerResumen());
    }

    @PostMapping("/generar")
    public ResponseEntity<ReporteGeneradoResponse> generar(@RequestBody GenerarReporteRequest request) {
        return ResponseEntity.ok(reporteService.generar(request.getTipo()));
    }
}
