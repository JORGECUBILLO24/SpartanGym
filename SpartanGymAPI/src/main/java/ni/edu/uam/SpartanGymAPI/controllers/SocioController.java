package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.EstadoSocioResponse;
import ni.edu.uam.SpartanGymAPI.services.SocioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/socios")
@RequiredArgsConstructor
public class SocioController {

    private final SocioService socioService;

    @GetMapping("/estado/{socioId}")
    public ResponseEntity<EstadoSocioResponse> consultarEstado(@PathVariable UUID socioId) {
        return ResponseEntity.ok(socioService.consultarEstado(socioId));
    }
}