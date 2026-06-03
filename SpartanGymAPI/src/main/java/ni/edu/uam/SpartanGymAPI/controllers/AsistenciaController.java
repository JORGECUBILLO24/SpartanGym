package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaRequest;
import ni.edu.uam.SpartanGymAPI.models.Asistencia;
import ni.edu.uam.SpartanGymAPI.services.AsistenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/asistencias")
@RequiredArgsConstructor
public class AsistenciaController {

    private final AsistenciaService asistenciaService;

    @PostMapping("/check-in")
    public ResponseEntity<Asistencia> registrarCheckIn(@RequestBody AsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.registrarEntrada(request));
    }

    @GetMapping("/socio/{socioId}")
    public ResponseEntity<List<Asistencia>> obtenerHistorialSocio(@PathVariable UUID socioId) {
        return ResponseEntity.ok(asistenciaService.obtenerHistorial(socioId));
    }
}