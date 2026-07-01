package ni.edu.uam.SpartanGymAPI.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.*;
import ni.edu.uam.SpartanGymAPI.services.AuthService;
import ni.edu.uam.SpartanGymAPI.services.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MensajeResponse> solicitarRestablecimiento(@Valid @RequestBody SolicitarRestablecimientoRequest request) {
        passwordResetService.solicitarRestablecimiento(request.getEmail());
        return ResponseEntity.ok(new MensajeResponse("Si el correo esta registrado, enviaremos un enlace seguro para restablecer la contraseña."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MensajeResponse> restablecerPassword(@Valid @RequestBody RestablecerPasswordRequest request) {
        passwordResetService.restablecerPassword(request.getToken(), request.getPassword());
        return ResponseEntity.ok(new MensajeResponse("Contraseña actualizada correctamente."));
    }

}
