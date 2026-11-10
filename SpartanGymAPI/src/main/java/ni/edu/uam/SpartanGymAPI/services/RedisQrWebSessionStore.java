package ni.edu.uam.SpartanGymAPI.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Estado de las sesiones QR web en Redis, compartido entre instancias de la API.
 *
 * Solo guarda datos efimeros (hash del token + expiracion) con TTL. La verdad sobre si un QR ya
 * se uso sigue en PostgreSQL (indice unico sobre asistencias.qr_token_hash).
 *
 * Si Redis no responde NO se cae silenciosamente a memoria local: con varias instancias eso
 * produciria sesiones visibles solo en una de ellas. La excepcion sube y la API responde 503.
 */
@Component
@ConditionalOnProperty(name = "app.qr.session-store", havingValue = "redis")
public class RedisQrWebSessionStore implements QrWebSessionStore {
    private static final String PREFIX = "spartangym:qr:web:";
    private static final Duration RETENCION_POR_DEFECTO = Duration.ofSeconds(600);

    private final StringRedisTemplate redis;
    private final Duration retencion;

    @Autowired
    public RedisQrWebSessionStore(StringRedisTemplate redis) {
        this(redis, RETENCION_POR_DEFECTO);
    }

    /** Retencion configurable solo para poder probar la expiracion real sin esperar 10 minutos. */
    RedisQrWebSessionStore(StringRedisTemplate redis, Duration retencion) {
        this.redis = redis;
        this.retencion = retencion;
    }

    @Override
    public void guardar(UUID sessionId, String tokenHash, Instant expira) {
        // La sesion sigue consultable un rato despues de vencer para poder responder "Expirado"
        // en vez de "no encontrada" (mismo comportamiento que el almacen en memoria).
        Duration ttl = Duration.between(Instant.now(), expira.plus(retencion));
        if (ttl.isNegative() || ttl.isZero()) {
            throw new IllegalArgumentException("La sesion QR ya vencio");
        }
        redis.opsForValue().set(PREFIX + sessionId, tokenHash + "|" + expira.toEpochMilli(), ttl);
    }

    @Override
    public Optional<Session> buscar(UUID sessionId) {
        String data = redis.opsForValue().get(PREFIX + sessionId);
        if (data == null) {
            return Optional.empty();
        }
        int separator = data.lastIndexOf('|');
        if (separator <= 0 || separator >= data.length() - 1) {
            throw new IllegalStateException("Estado QR invalido en Redis");
        }
        try {
            return Optional.of(new Session(
                    data.substring(0, separator),
                    Instant.ofEpochMilli(Long.parseLong(data.substring(separator + 1)))));
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Expiracion QR invalida en Redis", e);
        }
    }
}
