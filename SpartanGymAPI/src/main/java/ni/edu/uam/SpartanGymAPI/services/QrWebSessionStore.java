package ni.edu.uam.SpartanGymAPI.services;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Shared abstraction for temporary web QR sessions (not the attendance ledger). */
public interface QrWebSessionStore {
    void guardar(UUID sessionId, String tokenHash, Instant expira);
    Optional<Session> buscar(UUID sessionId);

    record Session(String tokenHash, Instant expira) {
        public boolean expirado() {
            return Instant.now().isAfter(expira);
        }
    }
}
