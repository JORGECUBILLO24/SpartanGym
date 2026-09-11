package ni.edu.uam.SpartanGymAPI.services;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import ni.edu.uam.SpartanGymAPI.repositories.NotificacionRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * El enlace de recuperación lleva el token en texto plano. En la base solo se guarda su hash,
 * así que el log no puede entregarlo en claro: estos tests leen lo que realmente se escribe
 * en el log y verifican que el token no aparezca fuera del perfil "local".
 */
class NotificacionServiceTokenLogTest {

    private static final String TOKEN = "TOKEN-SECRETO-NO-DEBE-SALIR-EN-LOGS";
    private static final String ENLACE =
            "https://spartan-gym-khaki.vercel.app/restablecer-contrasena?token=" + TOKEN;

    private final Logger logger = (Logger) LoggerFactory.getLogger(NotificacionService.class);
    private final ListAppender<ILoggingEvent> capturados = new ListAppender<>();

    private JavaMailSender mailSender;

    @BeforeEach
    void capturarLog() {
        capturados.start();
        logger.addAppender(capturados);
        mailSender = mock(JavaMailSender.class);
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
    }

    @AfterEach
    void soltarLog() {
        logger.detachAppender(capturados);
    }

    private NotificacionService servicio(String remitente, String... perfiles) {
        MockEnvironment entorno = new MockEnvironment();
        entorno.setActiveProfiles(perfiles);
        NotificacionService servicio = new NotificacionService(
                mailSender,
                mock(NotificacionRepository.class),
                mock(UsuarioRepository.class),
                mock(ConfiguracionAppService.class),
                entorno
        );
        ReflectionTestUtils.setField(servicio, "correoEmisor", remitente);
        return servicio;
    }

    private List<String> lineas() {
        return capturados.list.stream().map(ILoggingEvent::getFormattedMessage).toList();
    }

    private boolean algunaLineaContieneElToken() {
        return lineas().stream().anyMatch(linea -> linea.contains(TOKEN));
    }

    @Test
    void envioFallido_enProduccion_registraElErrorPeroNoElToken() {
        doThrow(new MailSendException("puerto SMTP bloqueado")).when(mailSender).send(any(MimeMessage.class));

        servicio("gym@ejemplo.com", "default").enviarCorreoRecuperacionPassword("socio@ejemplo.com", "Ana", ENLACE, 30);

        assertTrue(lineas().stream().anyMatch(l -> l.contains("Error al enviar recuperacion")),
                "el fallo tiene que seguir quedando registrado");
        assertFalse(algunaLineaContieneElToken(), "el token no puede aparecer en el log: " + lineas());
    }

    @Test
    void correoSinConfigurar_enProduccion_noRegistraElToken() {
        servicio("", "default").enviarCorreoRecuperacionPassword("socio@ejemplo.com", "Ana", ENLACE, 30);

        assertTrue(lineas().stream().anyMatch(l -> l.contains("no configurado")),
                "tiene que quedar registrado que el correo no está configurado");
        assertFalse(algunaLineaContieneElToken(), "el token no puede aparecer en el log: " + lineas());
    }

    @Test
    void enPerfilLocal_siRegistraElEnlaceParaPoderProbarSinCorreo() {
        servicio("", "local").enviarCorreoRecuperacionPassword("socio@ejemplo.com", "Ana", ENLACE, 30);

        assertTrue(algunaLineaContieneElToken(), "en local el enlace debe verse para probar el flujo");
    }
}
