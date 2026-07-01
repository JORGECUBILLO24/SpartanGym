package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.models.PasswordResetToken;
import ni.edu.uam.SpartanGymAPI.models.Personal;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.PasswordResetTokenRepository;
import ni.edu.uam.SpartanGymAPI.repositories.PersonalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final SocioRepository socioRepository;
    private final PersonalRepository personalRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificacionService notificacionService;

    @Value("${app.web.reset-password-url:http://localhost:5173/restablecer-contrasena}")
    private String resetPasswordUrl;

    @Value("${app.password-reset.expiration-minutes:30}")
    private long expirationMinutes;

    @Transactional
    public void solicitarRestablecimiento(String email) {
        String emailNormalizado = normalizarEmail(email);
        if (emailNormalizado.isBlank()) {
            return;
        }

        usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                .filter(usuario -> Boolean.TRUE.equals(usuario.getActivo()))
                .ifPresent(this::crearYEnviarToken);
    }

    @Transactional
    public void restablecerPassword(String tokenPlano, String nuevaPassword) {
        validarPassword(nuevaPassword);
        PasswordResetToken token = tokenRepository.findByTokenHashAndUsadoFalse(hashToken(tokenPlano))
                .orElseThrow(() -> new RuntimeException("El enlace de restablecimiento no es valido o ya fue usado"));

        if (token.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            token.setUsado(true);
            tokenRepository.save(token);
            throw new RuntimeException("El enlace de restablecimiento expiro. Solicita uno nuevo.");
        }

        Usuario usuario = token.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);
        token.setUsado(true);
        tokenRepository.save(token);
        invalidarTokensActivos(usuario.getId());
    }

    @Transactional
    public void enviarRestablecimientoGestionado(UUID usuarioId, Authentication auth) {
        Usuario actor = usuarioAutenticado(auth);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        validarPermisoGestion(actor, usuario);
        crearYEnviarToken(usuario);
    }

    @Transactional
    public void cambiarPasswordGestionado(UUID usuarioId, String nuevaPassword, Authentication auth) {
        validarPassword(nuevaPassword);
        Usuario actor = usuarioAutenticado(auth);
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        validarPermisoGestion(actor, usuario);

        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);
        invalidarTokensActivos(usuario.getId());
    }

    private void crearYEnviarToken(Usuario usuario) {
        invalidarTokensActivos(usuario.getId());

        String tokenPlano = generarTokenSeguro();
        PasswordResetToken token = new PasswordResetToken();
        token.setUsuario(usuario);
        token.setTokenHash(hashToken(tokenPlano));
        token.setFechaExpiracion(LocalDateTime.now().plusMinutes(expirationMinutes));
        tokenRepository.save(token);

        String enlace = construirEnlace(tokenPlano);
        notificacionService.enviarCorreoRecuperacionPassword(
                usuario.getEmail(),
                obtenerNombreUsuario(usuario),
                enlace,
                expirationMinutes
        );
    }

    private void invalidarTokensActivos(UUID usuarioId) {
        tokenRepository.findByUsuarioIdAndUsadoFalse(usuarioId).forEach(token -> {
            token.setUsado(true);
            tokenRepository.save(token);
        });
    }

    private String generarTokenSeguro() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String tokenPlano) {
        if (tokenPlano == null || tokenPlano.isBlank()) {
            throw new RuntimeException("Token requerido");
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(tokenPlano.trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo validar el token de restablecimiento", e);
        }
    }

    private String construirEnlace(String tokenPlano) {
        String separador = resetPasswordUrl.contains("?") ? "&" : "?";
        return resetPasswordUrl + separador + "token=" + URLEncoder.encode(tokenPlano, StandardCharsets.UTF_8);
    }

    private Usuario usuarioAutenticado(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Usuario no autenticado");
        }
        return usuarioRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));
    }

    private void validarPermisoGestion(Usuario actor, Usuario objetivo) {
        String rolActor = actor.getRol().getNombre();
        String rolObjetivo = objetivo.getRol().getNombre();

        if ("ROLE_SUPERADMIN".equals(rolActor)) {
            return;
        }
        if ("ROLE_ADMIN".equals(rolActor) && !"ROLE_SUPERADMIN".equals(rolObjetivo)) {
            return;
        }
        if ("ROLE_RECEPCIONISTA".equals(rolActor) && "ROLE_SOCIO".equals(rolObjetivo)) {
            return;
        }

        throw new RuntimeException("No tienes permisos para gestionar la contraseña de este usuario");
    }

    private void validarPassword(String password) {
        if (password == null || password.length() < 6) {
            throw new RuntimeException("La nueva contraseña debe tener al menos 6 caracteres");
        }
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim();
    }

    private String obtenerNombreUsuario(Usuario usuario) {
        return socioRepository.findById(usuario.getId())
                .map(Socio::getNombres)
                .or(() -> personalRepository.findById(usuario.getId()).map(Personal::getNombres))
                .orElse("Spartan");
    }
}
