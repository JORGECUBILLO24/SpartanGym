package ni.edu.uam.SpartanGymAPI.services;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/** Single-instance fallback for local development; do not use for multiple API replicas. */
@Component
@ConditionalOnProperty(name = "app.qr.session-store", havingValue = "memory", matchIfMissing = true)
public class MemoryQrWebSessionStore implements QrWebSessionStore {
    private static final long RETENCION_SEGUNDOS = 600;
    private final ConcurrentMap<UUID, Session> sessions = new ConcurrentHashMap<>();

    @Override
    public void guardar(UUID sessionId, String tokenHash, Instant expira) {
        limpiar();
        sessions.put(sessionId, new Session(tokenHash, expira));
    }

    @Override
    public Optional<Session> buscar(UUID sessionId) {
        limpiar();
        return Optional.ofNullable(sessions.get(sessionId));
    }

    private void limpiar() {
        Instant ahora = Instant.now();
        sessions.entrySet().removeIf(e ->
                ahora.isAfter(e.getValue().expira().plusSeconds(RETENCION_SEGUNDOS)));
    }
}
