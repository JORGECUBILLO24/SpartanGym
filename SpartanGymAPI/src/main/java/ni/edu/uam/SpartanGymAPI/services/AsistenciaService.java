package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrRequest;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrTokenResponse;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaQrValidationResponse;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaRequest;
import ni.edu.uam.SpartanGymAPI.models.Asistencia;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.AsistenciaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
public class AsistenciaService {

    private static final String QR_SOCIO_PREFIX = "SPARTAN_GYM_ASISTENCIA";
    private static final String QR_WEB_PREFIX = "SPARTAN_GYM_VALIDACION_WEB";
    private static final long QR_TTL_SECONDS = 180;
    private static final long QR_SESSION_RETENTION_SECONDS = 600;
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final AsistenciaRepository asistenciaRepository;
    private final SocioRepository socioRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaSocioRepository membresiaSocioRepository;
    private final ConcurrentMap<UUID, QrWebSession> sesionesQrWeb = new ConcurrentHashMap<>();

    @Transactional
    public Asistencia registrarEntrada(AsistenciaRequest request) {
        Socio socio = socioRepository.findById(request.getIdSocio())
                .orElseThrow(() -> new RuntimeException("Error: Socio no encontrado."));

        return registrarAsistencia(socio);
    }

    public AsistenciaQrTokenResponse generarQrAsistencia(String emailUsuario) {
        Usuario usuario = buscarUsuarioAutenticado(emailUsuario);
        Socio socio = socioRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("El usuario autenticado no tiene perfil de socio."));
        Instant generado = Instant.now();
        Instant expira = generado.plusSeconds(QR_TTL_SECONDS);
        String nonce = UUID.randomUUID().toString();
        String datos = socio.getUsuarioId() + "|" + nonce + "|" + expira.getEpochSecond();
        String firma = firmar(datos);
        String token = QR_SOCIO_PREFIX + "|" + datos + "|" + firma;

        return AsistenciaQrTokenResponse.builder()
                .token(token)
                .socioId(socio.getUsuarioId())
                .socio(socio.getNombres() + " " + socio.getApellidos())
                .generadoEn(LocalDateTime.ofInstant(generado, ZoneId.systemDefault()))
                .expiraEn(LocalDateTime.ofInstant(expira, ZoneId.systemDefault()))
                .ttlSegundos(QR_TTL_SECONDS)
                .build();
    }

    public AsistenciaQrTokenResponse generarQrValidacionWeb(String emailUsuario) {
        buscarUsuarioAutenticado(emailUsuario);
        limpiarSesionesQrWeb();

        Instant generado = Instant.now();
        Instant expira = generado.plusSeconds(QR_TTL_SECONDS);
        UUID sessionId = UUID.randomUUID();
        String nonce = UUID.randomUUID().toString();
        String datos = sessionId + "|" + nonce + "|" + expira.getEpochSecond();
        String firma = firmar(datos);
        String token = QR_WEB_PREFIX + "|" + datos + "|" + firma;
        String tokenHash = hashToken(token);
        sesionesQrWeb.put(sessionId, new QrWebSession(sessionId, tokenHash, expira));

        return AsistenciaQrTokenResponse.builder()
                .token(token)
                .sessionId(sessionId)
                .generadoEn(LocalDateTime.ofInstant(generado, ZoneId.systemDefault()))
                .expiraEn(LocalDateTime.ofInstant(expira, ZoneId.systemDefault()))
                .ttlSegundos(QR_TTL_SECONDS)
                .build();
    }

    @Transactional
    public AsistenciaQrValidationResponse registrarEntradaQr(AsistenciaQrRequest request, String emailUsuario) {
        buscarUsuarioAutenticado(emailUsuario);

        QrSocioPayload payload = validarTokenQrSocio(request != null ? request.getToken() : null);

        if (asistenciaRepository.existsByQrTokenHash(payload.tokenHash())) {
            throw new RuntimeException("QR ya utilizado. Solicita al socio generar uno nuevo.");
        }

        Socio socio = socioRepository.findById(payload.socioId())
                .orElseThrow(() -> new RuntimeException("QR invalido: socio no encontrado."));

        try {
            Asistencia asistencia = registrarAsistencia(socio, payload.tokenHash());
            return construirRespuestaValidacion(asistencia, socio, "Asistencia validada.");
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("QR ya utilizado. Solicita al socio generar uno nuevo.");
        }
    }

    @Transactional
    public AsistenciaQrValidationResponse registrarEntradaQrWeb(AsistenciaQrRequest request, String emailUsuario) {
        Usuario usuario = buscarUsuarioAutenticado(emailUsuario);
        Socio socio = socioRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("El usuario autenticado no tiene perfil de socio."));
        QrWebPayload payload = validarTokenQrWeb(request != null ? request.getToken() : null, true);
        QrWebSession sesion = buscarSesionQrWeb(payload.sessionId());

        if (!sesion.tokenHash().equals(payload.tokenHash())) {
            throw new RuntimeException("QR invalido: sesion no coincide con el token.");
        }

        if (asistenciaRepository.existsByQrTokenHash(payload.tokenHash())) {
            throw new RuntimeException("QR ya utilizado. Solicita a recepcion generar uno nuevo.");
        }

        try {
            Asistencia asistencia = registrarAsistencia(socio, payload.tokenHash());
            return construirRespuestaValidacion(asistencia, socio, "Asistencia validada.", payload.sessionId());
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("QR ya utilizado. Solicita a recepcion generar uno nuevo.");
        }
    }

    public AsistenciaQrValidationResponse consultarEstadoQrValidacion(AsistenciaQrRequest request) {
        QrWebPayload payload = validarTokenQrWeb(request != null ? request.getToken() : null, false);
        QrWebSession sesion = sesionesQrWeb.get(payload.sessionId());

        if (sesion != null && !sesion.tokenHash().equals(payload.tokenHash())) {
            throw new RuntimeException("QR invalido: sesion no coincide con el token.");
        }

        return consultarEstadoQrValidacion(payload.sessionId(), payload.tokenHash(), payload.expirado());
    }

    public AsistenciaQrValidationResponse consultarEstadoQrValidacion(UUID sessionId) {
        limpiarSesionesQrWeb();

        QrWebSession sesion = sesionesQrWeb.get(sessionId);
        if (sesion == null) {
            return AsistenciaQrValidationResponse.builder()
                    .sessionId(sessionId)
                    .estado("Expirado")
                    .mensaje("QR expirado o sesion no encontrada. Genera uno nuevo.")
                    .build();
        }

        return consultarEstadoQrValidacion(sessionId, sesion.tokenHash(), sesion.expirado());
    }

    public List<Asistencia> obtenerHistorial(UUID socioId) {
        return asistenciaRepository.findBySocioUsuarioIdOrderByFechaHoraDesc(socioId);
    }

    private Usuario buscarUsuarioAutenticado(String emailUsuario) {
        return usuarioRepository.findByEmailIgnoreCase(emailUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado."));
    }

    private Asistencia registrarAsistencia(Socio socio) {
        return registrarAsistencia(socio, null);
    }

    private Asistencia registrarAsistencia(Socio socio, String qrTokenHash) {
        // Permitir el registro de asistencia sin bloquear por estado_acceso.
        // El recepcionista verá en pantalla si la membresía está activa o vencida.

        Asistencia asistencia = new Asistencia();
        asistencia.setSocio(socio);
        asistencia.setFechaHora(LocalDateTime.now());
        asistencia.setQrTokenHash(qrTokenHash);

        Asistencia asistenciaGuardada = asistenciaRepository.save(asistencia);
        if (qrTokenHash != null) {
            asistenciaRepository.flush();
        }
        return asistenciaGuardada;
    }

    private AsistenciaQrValidationResponse consultarEstadoQrValidacion(UUID sessionId, String tokenHash, boolean expirado) {
        return asistenciaRepository.findByQrTokenHash(tokenHash)
                .map((asistencia) -> construirRespuestaValidacion(
                        asistencia,
                        asistencia.getSocio(),
                        "Asistencia validada.",
                        sessionId
                ))
                .orElseGet(() -> AsistenciaQrValidationResponse.builder()
                        .sessionId(sessionId)
                        .estado(expirado ? "Expirado" : "Pendiente")
                        .mensaje(expirado
                                ? "QR expirado. Genera uno nuevo."
                                : "Esperando validacion desde la app movil.")
                        .build());
    }

    private AsistenciaQrValidationResponse construirRespuestaValidacion(Asistencia asistencia, Socio socio, String mensaje) {
        return construirRespuestaValidacion(asistencia, socio, mensaje, null);
    }

    private AsistenciaQrValidationResponse construirRespuestaValidacion(Asistencia asistencia, Socio socio, String mensaje, UUID sessionId) {
        MembresiaSocio membresiaActiva = membresiaSocioRepository
                .findBySocioUsuarioIdAndEstado(socio.getUsuarioId(), "Activa")
                .orElse(null);
        String tipoMembresia = membresiaActiva != null
                ? membresiaActiva.getTipoMembresia().getNombre()
                : "Sin membresia";

        return AsistenciaQrValidationResponse.builder()
                .id(asistencia.getId())
                .sessionId(sessionId)
                .socioId(socio.getUsuarioId())
                .socio(socio.getNombres() + " " + socio.getApellidos())
                .membresia(tipoMembresia)
                .tipoMembresia(tipoMembresia)
                .estadoAcceso(socio.getEstadoAcceso())
                .fechaVencimiento(membresiaActiva != null ? membresiaActiva.getFechaVencimiento() : null)
                .estado("Permitido")
                .fechaHora(asistencia.getFechaHora())
                .mensaje(mensaje)
                .build();
    }

    private QrSocioPayload validarTokenQrSocio(String token) {
        String[] partes = validarEstructuraToken(token, QR_SOCIO_PREFIX);

        UUID socioId;
        try {
            socioId = UUID.fromString(partes[1]);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("QR invalido: socio incorrecto.");
        }

        validarFirmaYExpiracion(partes[1] + "|" + partes[2] + "|" + partes[3], partes[3], partes[4], true);
        return new QrSocioPayload(socioId, hashToken(token));
    }

    private QrWebPayload validarTokenQrWeb(String token, boolean rechazarExpirado) {
        String[] partes = validarEstructuraToken(token, QR_WEB_PREFIX);

        UUID sessionId;
        try {
            sessionId = UUID.fromString(partes[1]);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("QR invalido: sesion incorrecta.");
        }

        boolean expirado = validarFirmaYExpiracion(
                partes[1] + "|" + partes[2] + "|" + partes[3],
                partes[3],
                partes[4],
                rechazarExpirado
        );
        return new QrWebPayload(sessionId, hashToken(token), expirado);
    }

    private String[] validarEstructuraToken(String token, String prefijoEsperado) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("QR invalido: no se recibio token.");
        }

        String[] partes = token.split("\\|");
        if (partes.length != 5 || !prefijoEsperado.equals(partes[0])) {
            throw new RuntimeException("QR invalido para Spartan Gym.");
        }
        return partes;
    }

    private boolean validarFirmaYExpiracion(String datos, String expiraTexto, String firmaRecibida, boolean rechazarExpirado) {
        String firmaEsperada = firmar(datos);
        if (!MessageDigest.isEqual(firmaEsperada.getBytes(StandardCharsets.UTF_8), firmaRecibida.getBytes(StandardCharsets.UTF_8))) {
            throw new RuntimeException("QR invalido o alterado.");
        }

        long expiraEpoch;
        try {
            expiraEpoch = Long.parseLong(expiraTexto);
        } catch (NumberFormatException e) {
            throw new RuntimeException("QR invalido: expiracion incorrecta.");
        }

        boolean expirado = Instant.now().getEpochSecond() > expiraEpoch;
        if (expirado && rechazarExpirado) {
            throw new RuntimeException("QR expirado. Solicita generar uno nuevo.");
        }
        return expirado;
    }

    private QrWebSession buscarSesionQrWeb(UUID sessionId) {
        limpiarSesionesQrWeb();
        QrWebSession sesion = sesionesQrWeb.get(sessionId);

        if (sesion == null) {
            throw new RuntimeException("QR expirado o sesion no encontrada. Genera uno nuevo.");
        }

        if (sesion.expirado()) {
            throw new RuntimeException("QR expirado. Solicita generar uno nuevo.");
        }

        return sesion;
    }

    private void limpiarSesionesQrWeb() {
        Instant ahora = Instant.now();
        sesionesQrWeb.entrySet().removeIf((entry) ->
                ahora.isAfter(entry.getValue().expira().plusSeconds(QR_SESSION_RETENTION_SECONDS))
        );
    }

    private String firmar(String datos) {
        try {
            String secreto = System.getenv().getOrDefault("ATTENDANCE_QR_SECRET", "spartan-gym-attendance-secret");
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] firma = mac.doFinal(datos.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(firma);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo firmar el QR de asistencia.", e);
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo validar el QR de asistencia.", e);
        }
    }

    private record QrSocioPayload(UUID socioId, String tokenHash) {
    }

    private record QrWebPayload(UUID sessionId, String tokenHash, boolean expirado) {
    }

    private record QrWebSession(UUID sessionId, String tokenHash, Instant expira) {
        private boolean expirado() {
            return Instant.now().isAfter(expira);
        }
    }
}
