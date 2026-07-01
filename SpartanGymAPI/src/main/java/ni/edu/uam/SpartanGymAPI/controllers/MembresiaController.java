package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.CompraMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.dto.TipoMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.TipoMembresia;
import ni.edu.uam.SpartanGymAPI.services.MembresiaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membresias")
@RequiredArgsConstructor
public class MembresiaController {

    private final MembresiaService membresiaService;

    @GetMapping("/tipos")
    public ResponseEntity<List<TipoMembresia>> listarTipos() {
        return ResponseEntity.ok(membresiaService.listarTipos());
    }

    @PostMapping("/tipos")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<TipoMembresia> crearTipo(@RequestBody TipoMembresiaRequest request) {
        return ResponseEntity.ok(membresiaService.crearTipo(request));
    }

    @DeleteMapping("/tipos/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> eliminarTipo(@PathVariable Integer id) {
        membresiaService.eliminarTipo(id);
        return ResponseEntity.noContent().build();
    }

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
