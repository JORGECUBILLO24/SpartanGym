package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrRequest;
import ni.edu.uam.SpartanGymAPI.exceptions.ReglaNegocioException;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.AsistenciaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * El secreto que firma los QR de asistencia ya no puede ser el valor fijo del repositorio
 * ("spartan-gym-attendance-secret"): cualquiera que lea el código podría fabricar QR válidos.
 */
class AsistenciaServiceSecretoQrTest {

    /** El valor público que antes se usaba cuando ATTENDANCE_QR_SECRET no estaba definida. */
    private static final String SECRETO_PUBLICO_ANTIGUO = "spartan-gym-attendance-secret";
    private static final String SECRETO_FUERTE = "n7Qx2vLp9sTm4Ke8Rw1Yc6Hb3Zd5Fa0JuGiOeXtVnMy";

    private static final UUID ID_SOCIO = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final AsistenciaRepository asistenciaRepository = mock(AsistenciaRepository.class);
    private final SocioRepository socioRepository = mock(SocioRepository.class);
    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final MembresiaSocioRepository membresiaRepository = mock(MembresiaSocioRepository.class);
    private final QrWebSessionStore sesiones = new MemoryQrWebSessionStore();

    private AsistenciaService servicio(String secreto, String... perfiles) {
        MockEnvironment entorno = new MockEnvironment();
        entorno.setActiveProfiles(perfiles);
        AsistenciaService servicio = new AsistenciaService(
                asistenciaRepository, socioRepository, usuarioRepository, membresiaRepository, sesiones, entorno);
        ReflectionTestUtils.setField(servicio, "qrSecret", secreto);
        return servicio;
    }

    // ---------------- arranque ----------------

    @Test
    void sinSecretoFueraDelPerfilLocal_elArranqueFalla() {
        AsistenciaService servicio = servicio("", "default");

        assertThatThrownBy(servicio::validarSecreto)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ATTENDANCE_QR_SECRET");
    }

    @Test
    void secretoEnBlancoFueraDelPerfilLocal_tambienFalla() {
        assertThatThrownBy(servicio("   ", "prod")::validarSecreto).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void secretoCortoFueraDelPerfilLocal_falla() {
        assertThatThrownBy(servicio("corto-123", "default")::validarSecreto)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32");
    }

    @Test
    void elSecretoPublicoAntiguoNoSeAceptaFueraDelPerfilLocal() {
        // Aunque alguien lo configure a propósito: es público, cualquiera puede firmar con él.
        assertThatThrownBy(servicio(SECRETO_PUBLICO_ANTIGUO, "default")::validarSecreto)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void secretoFuerteFueraDelPerfilLocal_arranca() {
        assertThatCode(servicio(SECRETO_FUERTE, "default")::validarSecreto).doesNotThrowAnyException();
    }

    @Test
    void perfilLocalSinSecreto_usaUnoDeDesarrolloYArranca() {
        AsistenciaService servicio = servicio("", "local");

        assertThatCode(servicio::validarSecreto).doesNotThrowAnyException();
        assertThat(ReflectionTestUtils.getField(servicio, "qrSecret")).asString().isNotBlank();
    }

    // ---------------- el ataque ----------------

    @Test
    void unQrFirmadoConElSecretoPublicoAntiguoSeRechazaEnProduccion() {
        AsistenciaService produccion = servicio(SECRETO_FUERTE, "default");
        produccion.validarSecreto();
        when(socioRepository.findById(ID_SOCIO)).thenReturn(Optional.of(socioConId()));
        when(usuarioRepository.findByEmailIgnoreCase("recepcion@ejemplo.com")).thenReturn(Optional.of(new Usuario()));

        // Lo que haría un atacante: leer el secreto del repo y fabricar un QR válido de un socio.
        String qrFalsificado = fabricarQrSocio(ID_SOCIO, SECRETO_PUBLICO_ANTIGUO);

        AsistenciaQrRequest request = new AsistenciaQrRequest();
        request.setToken(qrFalsificado);

        assertThatThrownBy(() -> produccion.registrarEntradaQr(request, "recepcion@ejemplo.com"))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("alterado");
    }

    @Test
    void unQrGeneradoPorElPropioServicioSiSeAcepta() {
        AsistenciaService produccion = servicio(SECRETO_FUERTE, "default");
        produccion.validarSecreto();
        Usuario usuarioSocio = new Usuario();
        usuarioSocio.setId(ID_SOCIO);
        when(usuarioRepository.findByEmailIgnoreCase("socio@ejemplo.com")).thenReturn(Optional.of(usuarioSocio));
        when(usuarioRepository.findByEmailIgnoreCase("recepcion@ejemplo.com")).thenReturn(Optional.of(new Usuario()));
        when(socioRepository.findById(ID_SOCIO)).thenReturn(Optional.of(socioConId()));
        when(asistenciaRepository.save(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocacion -> invocacion.getArgument(0));

        String token = produccion.generarQrAsistencia("socio@ejemplo.com").getToken();
        AsistenciaQrRequest request = new AsistenciaQrRequest();
        request.setToken(token);

        assertThat(produccion.registrarEntradaQr(request, "recepcion@ejemplo.com").getEstado()).isEqualTo("Permitido");
    }

    private Socio socioConId() {
        Socio socio = new Socio();
        socio.setUsuarioId(ID_SOCIO);
        socio.setNombres("Ana");
        socio.setApellidos("Pérez");
        socio.setEstadoAcceso("Activo");
        return socio;
    }

    /** Replica el formato del QR de socio: PREFIJO|socioId|nonce|expira|firma. */
    private static String fabricarQrSocio(UUID socioId, String secreto) {
        try {
            String datos = socioId + "|" + UUID.randomUUID() + "|" + (Instant.now().getEpochSecond() + 120);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String firma = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(datos.getBytes(StandardCharsets.UTF_8)));
            return "SPARTAN_GYM_ASISTENCIA|" + datos + "|" + firma;
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
