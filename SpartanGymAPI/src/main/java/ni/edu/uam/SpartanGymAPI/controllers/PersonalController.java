package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.RegisterPersonalRequest;
import ni.edu.uam.SpartanGymAPI.services.PersonalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/personal")
@RequiredArgsConstructor
public class PersonalController {
    private final PersonalService personalService;

    @PostMapping("/registrar")
    public ResponseEntity<String> registrar(@RequestBody RegisterPersonalRequest request) {
        personalService.registrarEntrenador(request);
        return ResponseEntity.ok("Entrenador registrado exitosamente");
    }
}
