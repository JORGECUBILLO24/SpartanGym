package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrRequest;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrTokenResponse;
import ni.edu.uam.SpartanGymAPI.exceptions.ConflictoException;
import ni.edu.uam.SpartanGymAPI.exceptions.ReglaNegocioException;
import ni.edu.uam.SpartanGymAPI.integracion.RedisPruebas;
import ni.edu.uam.SpartanGymAPI.integracion.RedisPruebas.ConexionRedis;
import ni.edu.uam.SpartanGymAPI.models.Asistencia;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.AsistenciaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Flujo completo del QR web con las sesiones en un Redis REAL: generar, consultar, validar,
 * reutilizar, alterar y vencer. PostgreSQL (la verdad sobre "QR ya usado") va con mocks: lo que
 * se prueba acá es que Redis como almacén de sesiones no cambia ninguna regla del flujo.
 */
@EnabledIfEnvironmentVariable(named = "SPARTAN_IT_REDIS_URL", matches = ".+")
class AsistenciaQrConRedisIntegrationTest {

    private static final String SECRETO = "n7Qx2vLp9sTm4Ke8Rw1Yc6Hb3Zd5Fa0JuGiOeXtVnMy";
    private static final UUID ID_SOCIO = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final AsistenciaRepository asistencias = mock(AsistenciaRepository.class);
    private final SocioRepository socios = mock(SocioRepository.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final MembresiaSocioRepository membresias = mock(MembresiaSocioRepository.class);

    private ConexionRedis redis;
    private AsistenciaService servicio;

    @BeforeEach
    void preparar() {
        redis = RedisPruebas.conectar(RedisPruebas.url());
        servicio = new AsistenciaService(asistencias, socios, usuarios, membresias,
                new RedisQrWebSessionStore(redis.plantilla()), new MockEnvironment());
        ReflectionTestUtils.setField(servicio, "qrSecret", SECRETO);

        Usuario recepcion = new Usuario();
        recepcion.setId(UUID.randomUUID());
        Usuario usuarioSocio = new Usuario();
        usuarioSocio.setId(ID_SOCIO);
        Socio socio = new Socio();
        socio.setUsuarioId(ID_SOCIO);
        socio.setUsuario(usuarioSocio);
        socio.setNombres("Ana");
        socio.setApellidos("Pérez");
        socio.setEstadoAcceso("Activo");

        when(usuarios.findByEmailIgnoreCase("recepcion@ejemplo.com")).thenReturn(Optional.of(recepcion));
        when(usuarios.findByEmailIgnoreCase("socio@ejemplo.com")).thenReturn(Optional.of(usuarioSocio));
        when(socios.findById(ID_SOCIO)).thenReturn(Optional.of(socio));
        when(asistencias.save(any(Asistencia.class))).thenAnswer(i -> {
            Asistencia a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
    }

    @AfterEach
    void cerrar() {
        redis.close();
    }

    private AsistenciaQrRequest request(String token) {
        AsistenciaQrRequest request = new AsistenciaQrRequest();
        request.setToken(token);
        return request;
    }

    @Test
    void flujoNormal_pendienteLuegoPermitido() {
        AsistenciaQrTokenResponse qr = servicio.generarQrValidacionWeb("recepcion@ejemplo.com");

        assertThat(servicio.consultarEstadoQrValidacion(qr.getSessionId()).getEstado()).isEqualTo("Pendiente");

        var resultado = servicio.registrarEntradaQrWeb(request(qr.getToken()), "socio@ejemplo.com");
        assertThat(resultado.getEstado()).isEqualTo("Permitido");
        assertThat(resultado.getSessionId()).isEqualTo(qr.getSessionId());
    }

    @Test
    void unQrYaUsadoSeRechazaAunqueLaSesionSigaEnRedis() {
        AsistenciaQrTokenResponse qr = servicio.generarQrValidacionWeb("recepcion@ejemplo.com");
        servicio.registrarEntradaQrWeb(request(qr.getToken()), "socio@ejemplo.com");

        // PostgreSQL (fuente de verdad) ya registró ese token: la segunda vez debe fallar.
        when(asistencias.existsByQrTokenHash(anyString())).thenReturn(true);

        assertThatThrownBy(() -> servicio.registrarEntradaQrWeb(request(qr.getToken()), "socio@ejemplo.com"))
                .isInstanceOf(ConflictoException.class).hasMessageContaining("ya utilizado");
    }

    @Test
    void unQrAlteradoSeRechazaPorLaFirma() {
        AsistenciaQrTokenResponse qr = servicio.generarQrValidacionWeb("recepcion@ejemplo.com");
        String[] partes = qr.getToken().split("\\|");
        partes[2] = UUID.randomUUID().toString(); // se cambia el nonce, la firma ya no coincide
        String alterado = String.join("|", partes);

        assertThatThrownBy(() -> servicio.registrarEntradaQrWeb(request(alterado), "socio@ejemplo.com"))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("alterado");
    }

    @Test
    void unQrConFirmaValidaPeroSinSesionEnRedisSeRechaza() {
        // Firma correcta (la hace el servidor) pero nunca se guardó la sesión: p. ej. Redis se
        // vació, o alguien fabrica un token con un sessionId nuevo.
        UUID sessionId = UUID.randomUUID();
        String token = firmarTokenWeb(sessionId, Instant.now().getEpochSecond() + 120);

        assertThatThrownBy(() -> servicio.registrarEntradaQrWeb(request(token), "socio@ejemplo.com"))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("sesion no encontrada");
        assertThat(servicio.consultarEstadoQrValidacion(sessionId).getEstado()).isEqualTo("Expirado");
    }

    @Test
    void siRedisPierdeLaSesionElSocioRecibeUnMensajeClaroYNoUnError500() {
        AsistenciaQrTokenResponse qr = servicio.generarQrValidacionWeb("recepcion@ejemplo.com");
        redis.plantilla().delete("spartangym:qr:web:" + qr.getSessionId()); // p. ej. reinicio de Redis

        assertThatThrownBy(() -> servicio.registrarEntradaQrWeb(request(qr.getToken()), "socio@ejemplo.com"))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("Genera uno nuevo");
        assertThat(servicio.consultarEstadoQrValidacion(qr.getSessionId()).getEstado()).isEqualTo("Expirado");
    }

    @Test
    void unQrVencidoSeRechazaYSuEstadoSeConsultaComoExpirado() {
        UUID sessionId = UUID.randomUUID();
        String token = firmarTokenWeb(sessionId, Instant.now().getEpochSecond() - 30);
        new RedisQrWebSessionStore(redis.plantilla()).guardar(sessionId, sha256(token), Instant.now().minusSeconds(30));

        assertThatThrownBy(() -> servicio.registrarEntradaQrWeb(request(token), "socio@ejemplo.com"))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("expirado");
        assertThat(servicio.consultarEstadoQrValidacion(sessionId).getEstado()).isEqualTo("Expirado");
    }

    @Test
    void unTokenDeOtraSesionNoSirveParaLaSesionActual() {
        AsistenciaQrTokenResponse a = servicio.generarQrValidacionWeb("recepcion@ejemplo.com");
        // Mismo sessionId pero un nonce distinto firmado correctamente: el hash no coincide con
        // el que quedó guardado en Redis para esa sesión.
        String[] partes = a.getToken().split("\\|");
        String tokenDistinto = firmarTokenWeb(UUID.fromString(partes[1]), Instant.now().getEpochSecond() + 120);

        assertThatThrownBy(() -> servicio.registrarEntradaQrWeb(request(tokenDistinto), "socio@ejemplo.com"))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("sesion no coincide");
    }

    // --- utilidades: replican el formato del token web: PREFIJO|sessionId|nonce|expira|firma ---

    private static String firmarTokenWeb(UUID sessionId, long expiraEpoch) {
        try {
            String datos = sessionId + "|" + UUID.randomUUID() + "|" + expiraEpoch;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRETO.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String firma = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(datos.getBytes(StandardCharsets.UTF_8)));
            return "SPARTAN_GYM_VALIDACION_WEB|" + datos + "|" + firma;
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String sha256(String texto) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
