package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.exceptions.AccesoDenegadoException;
import ni.edu.uam.SpartanGymAPI.exceptions.NoAutenticadoException;
import ni.edu.uam.SpartanGymAPI.exceptions.RecursoNoEncontradoException;
import ni.edu.uam.SpartanGymAPI.exceptions.ReglaNegocioException;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.PasswordResetTokenRepository;
import ni.edu.uam.SpartanGymAPI.repositories.PersonalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Un mismo servicio lanza cuatro tipos distintos según qué falló. Antes todos eran
 * RuntimeException y salían como 400; ahora cada uno lleva su status HTTP.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ExcepcionesTipadasTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private SocioRepository socioRepository;
    @Mock private PersonalRepository personalRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private NotificacionService notificacionService;

    @InjectMocks private PasswordResetService servicio;

    private Usuario usuarioConRol(String email, String rol) {
        Rol r = new Rol();
        r.setNombre(rol);
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        u.setRol(r);
        return u;
    }

    private Authentication auth(String email) {
        Authentication a = mock(Authentication.class);
        when(a.getName()).thenReturn(email);
        return a;
    }

    @Test
    void sinAutenticacion_esNoAutenticado() {
        assertThrows(NoAutenticadoException.class,
                () -> servicio.enviarRestablecimientoGestionado(UUID.randomUUID(), null));
    }

    @Test
    void usuarioDelTokenQueYaNoExiste_esNoAutenticado() {
        when(usuarioRepository.findByEmailIgnoreCase("borrado@ejemplo.com")).thenReturn(Optional.empty());

        assertThrows(NoAutenticadoException.class,
                () -> servicio.enviarRestablecimientoGestionado(UUID.randomUUID(), auth("borrado@ejemplo.com")));
    }

    @Test
    void usuarioObjetivoInexistente_esNoEncontrado() {
        when(usuarioRepository.findByEmailIgnoreCase("admin@ejemplo.com"))
                .thenReturn(Optional.of(usuarioConRol("admin@ejemplo.com", "ROLE_ADMIN")));
        when(usuarioRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class,
                () -> servicio.enviarRestablecimientoGestionado(UUID.randomUUID(), auth("admin@ejemplo.com")));
    }

    @Test
    void recepcionistaSobreAdmin_esAccesoDenegado() {
        Usuario recepcion = usuarioConRol("recep@ejemplo.com", "ROLE_RECEPCIONISTA");
        Usuario admin = usuarioConRol("admin@ejemplo.com", "ROLE_ADMIN");
        when(usuarioRepository.findByEmailIgnoreCase("recep@ejemplo.com")).thenReturn(Optional.of(recepcion));
        when(usuarioRepository.findById(admin.getId())).thenReturn(Optional.of(admin));

        assertThrows(AccesoDenegadoException.class,
                () -> servicio.enviarRestablecimientoGestionado(admin.getId(), auth("recep@ejemplo.com")));
    }

    @Test
    void enlaceInvalido_esReglaDeNegocio() {
        when(tokenRepository.findByTokenHashAndUsadoFalse(any())).thenReturn(Optional.empty());

        assertThrows(ReglaNegocioException.class, () -> servicio.restablecerPassword("token-falso", "ClaveNueva123"));
    }

    @Test
    void passwordCorta_esReglaDeNegocio() {
        assertThrows(ReglaNegocioException.class, () -> servicio.restablecerPassword("token", "123"));
    }
}
