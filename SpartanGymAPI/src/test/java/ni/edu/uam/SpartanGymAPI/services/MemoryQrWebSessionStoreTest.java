package ni.edu.uam.SpartanGymAPI.services;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MemoryQrWebSessionStoreTest {
    private final MemoryQrWebSessionStore store = new MemoryQrWebSessionStore();

    @Test
    void guardaYRecuperaSesion() {
        UUID id = UUID.randomUUID();
        Instant expira = Instant.now().plusSeconds(180);
        store.guardar(id, "hash-token", expira);
        var actual = store.buscar(id).orElseThrow();
        assertEquals("hash-token", actual.tokenHash());
        assertEquals(expira, actual.expira());
        assertFalse(actual.expirado());
    }

    @Test
    void noDevuelveSesionesDesconocidas() {
        assertTrue(store.buscar(UUID.randomUUID()).isEmpty());
    }

    @Test
    void preservaSesionExpiradaDuranteVentanaDeConsulta() {
        UUID id = UUID.randomUUID();
        store.guardar(id, "hash", Instant.now().minusSeconds(5));
        assertTrue(store.buscar(id).orElseThrow().expirado());
    }
}
