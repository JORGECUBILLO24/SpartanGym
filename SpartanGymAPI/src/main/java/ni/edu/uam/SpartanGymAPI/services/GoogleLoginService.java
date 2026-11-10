package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.AuthResponse;
import ni.edu.uam.SpartanGymAPI.exceptions.NoAutenticadoException;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class GoogleLoginService {
    private final UsuarioRepository usuarios;
    private final AuthService authService;
    private final NimbusJwtDecoder decoder;
    private final String[] vinculaciones;

    public GoogleLoginService(
            UsuarioRepository usuarios,
            AuthService authService,
            @Value("${GOOGLE_CLIENT_ID:}") String cliente,
            @Value("${GOOGLE_ACCOUNT_LINKS:}") String cuentas) {
        this.usuarios = usuarios;
        this.authService = authService;
        this.vinculaciones = cuentas.split(",");
        this.decoder = cliente.isBlank() ? null : NimbusJwtDecoder
                .withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();

        if (decoder != null) {
            decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                    JwtValidators.createDefault(),
                    new JwtClaimValidator<String>("iss",
                            issuer -> "https://accounts.google.com".equals(issuer) || "accounts.google.com".equals(issuer)),
                    new JwtClaimValidator<List<String>>("aud", aud -> List.of(cliente).equals(aud)),
                    new JwtClaimValidator<Boolean>("email_verified", Boolean.TRUE::equals)));
        }
    }

    public AuthResponse login(String credential) {
        if (decoder == null || credential == null || credential.isBlank() || credential.length() > 8192) {
            throw new NoAutenticadoException("El acceso con Google no está disponible.");
        }

        Jwt identidad;
        try {
            identidad = decoder.decode(credential);
        } catch (JwtException ex) {
            throw new NoAutenticadoException("No se pudo verificar la identidad de Google.");
        }

        String sub = identidad.getSubject();
        String correoGoogle = identidad.getClaimAsString("email");
        if (sub == null || sub.isBlank() || correoGoogle == null || identidad.getExpiresAt() == null) {
            throw new NoAutenticadoException("No se pudo verificar la identidad de Google.");
        }

        // El correo no concede acceso por sí solo. Se requiere una vinculación explícita al sub.
        String correo = Arrays.stream(vinculaciones)
                .map(String::trim)
                .map(vinculacion -> vinculacion.split("=", 2))
                .filter(partes -> partes.length == 2 && sub.equals(partes[0].trim()))
                .map(partes -> partes[1].trim())
                .filter(correoGoogle::equalsIgnoreCase)
                .findFirst()
                .orElseThrow(() -> new NoAutenticadoException("Esta cuenta de Google no está vinculada a SpartanGym."));

        var usuario = usuarios.findByEmailIgnoreCase(correo)
                .filter(cuenta -> Boolean.TRUE.equals(cuenta.getActivo()))
                .orElseThrow(() -> new NoAutenticadoException("La cuenta de SpartanGym no está disponible."));
        return authService.iniciarSesion(usuario);
    }
}
