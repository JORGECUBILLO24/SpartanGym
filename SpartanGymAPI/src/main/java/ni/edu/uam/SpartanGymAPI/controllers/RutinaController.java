package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
import ni.edu.uam.SpartanGymAPI.models.Rutina;
import ni.edu.uam.SpartanGymAPI.services.RutinaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rutinas")
@RequiredArgsConstructor
public class RutinaController {

    private final RutinaService rutinaService;

    @PostMapping
    public ResponseEntity<Rutina> crearRutina(@RequestBody RutinaRequest request) {
        Rutina nuevaRutina = rutinaService.crearRutina(request);
        return ResponseEntity.ok(nuevaRutina);
    }
}