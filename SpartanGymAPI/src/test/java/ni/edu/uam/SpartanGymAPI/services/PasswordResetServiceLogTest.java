package ni.edu.uam.SpartanGymAPI.services;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import ni.edu.uam.SpartanGymAPI.models.PasswordResetToken;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.PasswordResetTokenRepository;
import ni.edu.uam.SpartanGymAPI.repositories.PersonalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * El flujo de restablecimiento tiene que dejar rastro en el log de cada paso exitoso,
 * y ninguno de esos pasos puede escribir el token.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PasswordResetServiceLogTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private SocioRepository socioRepository;
    @Mock private PersonalRepository personalRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private NotificacionService notificacionService;

    @InjectMocks
    private PasswordResetService servicio;

    private final Logger logger = (Logger) LoggerFactory.getLogger(PasswordResetService.class);
    private final ListAppender<ILoggingEvent> capturados = new ListAppender<>();

    @BeforeEach
    void preparar() {
        capturados.start();
        logger.addAppender(capturados);
        ReflectionTestUtils.setField(servicio, "resetPasswordUrl", "https://ejemplo.vercel.app/restablecer-contrasena");
        ReflectionTestUtils.setField(servicio, "expirationMinutes", 30L);
        when(tokenRepository.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void soltarLog() {
        logger.detachAppender(capturados);
    }

    private List<String> lineas() {
        return capturados.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
    }

    @Test
    void solicitudValida_registraQueSeEmitioElEnlace_sinElToken() {
        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setEmail("socio@ejemplo.com");
        usuario.setActivo(true);
        when(usuarioRepository.findByEmailIgnoreCase("socio@ejemplo.com")).thenReturn(Optional.of(usuario));

        servicio.solicitarRestablecimiento("socio@ejemplo.com");

        // El enlace que se le pasa al servicio de correo trae el token real: lo capturamos
        // para buscarlo literalmente en todo lo que escribió el log.
        ArgumentCaptor<String> enlace = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreoRecuperacionPassword(eq("socio@ejemplo.com"), anyString(), enlace.capture(), anyLong());
        String token = enlace.getValue().substring(enlace.getValue().indexOf("token=") + "token=".length());

        assertTrue(lineas().stream().anyMatch(l -> l.contains("Enlace de restablecimiento emitido para socio@ejemplo.com")),
                "el paso exitoso tiene que quedar registrado: " + lineas());
        assertFalse(lineas().stream().anyMatch(l -> l.contains(token)), "el token no puede aparecer en el log");
    }

    @Test
    void correoNoRegistrado_quedaEnElLog_paraPoderResponderUnNoMeLlego() {
        when(usuarioRepository.findByEmailIgnoreCase("mal-escrito@ejemplo.com")).thenReturn(Optional.empty());

        servicio.solicitarRestablecimiento("mal-escrito@ejemplo.com");

        assertTrue(lineas().stream().anyMatch(l -> l.contains("no registrado o inactivo: mal-escrito@ejemplo.com")),
                "tiene que quedar registrado: " + lineas());
    }
}
