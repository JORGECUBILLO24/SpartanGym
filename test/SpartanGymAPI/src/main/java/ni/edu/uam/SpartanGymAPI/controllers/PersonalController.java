package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.*;
import ni.edu.uam.SpartanGymAPI.services.PersonalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/personal")
@RequiredArgsConstructor
public class PersonalController {
    private final PersonalService personalService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<List<PersonalResponse>> listar() {
        return ResponseEntity.ok(personalService.listarPersonal());
    }

    @PatchMapping("/{usuarioId}/rol")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<PersonalResponse> actualizarRol(@PathVariable UUID usuarioId, @RequestBody ActualizarRolRequest request) {
        return ResponseEntity.ok(personalService.actualizarRol(usuarioId, request.getRol()));
    }

    @PostMapping("/registrar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<AuthResponse> registrar(@RequestBody RegisterPersonalRequest request) {
        return ResponseEntity.ok(personalService.registrarPersonal(request));
    }
}
