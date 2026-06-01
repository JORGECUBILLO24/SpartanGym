package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.AuthResponse;
import ni.edu.uam.SpartanGymAPI.dto.LoginRequest;
import ni.edu.uam.SpartanGymAPI.dto.RegisterRequest;
import ni.edu.uam.SpartanGymAPI.dto.RegisterPersonalRequest;
import ni.edu.uam.SpartanGymAPI.services.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // <-- NUEVO ENDPOINT PARA PERSONAL -->
    @PostMapping("/register-personal")
    public ResponseEntity<AuthResponse> registerPersonal(@RequestBody RegisterPersonalRequest request) {
        // Asumiendo que en tu AuthService tienes un método llamado registerPersonal
        return ResponseEntity.ok(authService.registerPersonal(request));
    }
}