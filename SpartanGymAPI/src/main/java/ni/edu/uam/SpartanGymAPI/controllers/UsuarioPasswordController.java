package ni.edu.uam.SpartanGymAPI.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.CambiarPasswordRequest;
import ni.edu.uam.SpartanGymAPI.dto.MensajeResponse;
import ni.edu.uam.SpartanGymAPI.services.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioPasswordController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/{usuarioId}/password-reset-link")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    public ResponseEntity<MensajeResponse> enviarEnlace(@PathVariable UUID usuarioId, Authentication auth) {
        passwordResetService.enviarRestablecimientoGestionado(usuarioId, auth);
        return ResponseEntity.ok(new MensajeResponse("Enlace de restablecimiento enviado al correo registrado."));
    }

    @PutMapping("/{usuarioId}/password")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    public ResponseEntity<MensajeResponse> cambiarPassword(
            @PathVariable UUID usuarioId,
            @Valid @RequestBody CambiarPasswordRequest request,
            Authentication auth
    ) {
        passwordResetService.cambiarPasswordGestionado(usuarioId, request.getPassword(), auth);
        return ResponseEntity.ok(new MensajeResponse("Contraseña actualizada correctamente."));
    }
}
