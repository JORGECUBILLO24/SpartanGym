package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.CompraMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.services.MembresiaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/membresias")
@RequiredArgsConstructor
public class MembresiaController {

    private final MembresiaService membresiaService;

    @PostMapping("/comprar")
    public ResponseEntity<?> comprarMembresia(
            @RequestBody CompraMembresiaRequest request,
            Authentication authentication // Spring Security inyecta aquí los datos del usuario autenticado
    ) {
        try {
            // Sacamos el email del contexto de seguridad, no del JSON
            String emailSocio = authentication.getName();
            MembresiaSocio membresia = membresiaService.comprarMembresia(emailSocio, request);
            return ResponseEntity.ok(membresia);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}