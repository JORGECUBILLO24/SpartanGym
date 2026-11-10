package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.integracion.RedisPruebas;
import ni.edu.uam.SpartanGymAPI.integracion.RedisPruebas.ConexionRedis;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * RedisQrWebSessionStore contra un Redis REAL (la CI lo levanta como servicio; en local:
 * docker run -d -p 127.0.0.1:6390:6379 redis:7-alpine y SPARTAN_IT_REDIS_URL=redis://localhost:6390).
 * Cada ConexionRedis simula una instancia distinta de la API.
 */
@EnabledIfEnvironmentVariable(named = "SPARTAN_IT_REDIS_URL", matches = ".+")
class RedisQrWebSessionStoreIntegrationTest {

    private static final String PREFIJO = "spartangym:qr:web:";

    private final List<ConexionRedis> abiertas = new ArrayList<>();
    private final List<UUID> sesiones = new ArrayList<>();
    private ConexionRedis instanciaA;

    @BeforeEach
    void conectar() {
        instanciaA = nueva();
    }

    @AfterEach
    void limpiar() {
        sesiones.forEach(id -> instanciaA.plantilla().delete(PREFIJO + id));
        abiertas.forEach(ConexionRedis::close);
    }

    private ConexionRedis nueva() {
        ConexionRedis conexion = RedisPruebas.conectar(RedisPruebas.url());
        abiertas.add(conexion);
        return conexion;
    }

    private UUID sesion() {
        UUID id = UUID.randomUUID();
        sesiones.add(id);
        return id;
    }

    @Test
    void guardaYRecuperaLaSesion() {
        RedisQrWebSessionStore almacen = new RedisQrWebSessionStore(instanciaA.plantilla());
        UUID id = sesion();
        Instant expira = Instant.now().plusSeconds(180);

        almacen.guardar(id, "hash-del-token", expira);

        QrWebSessionStore.Session recuperada = almacen.buscar(id).orElseThrow();
        assertThat(recuperada.tokenHash()).isEqualTo("hash-del-token");
        assertThat(recuperada.expira().toEpochMilli()).isEqualTo(expira.toEpochMilli());
        assertThat(recuperada.expirado()).isFalse();
    }

    @Test
    void sesionDesconocida_devuelveVacio() {
        assertThat(new RedisQrWebSessionStore(instanciaA.plantilla()).buscar(UUID.randomUUID())).isEmpty();
    }

    @Test
    void laClaveTieneTtlIgualAlVencimientoMasLaRetencion() {
        RedisQrWebSessionStore almacen = new RedisQrWebSessionStore(instanciaA.plantilla());
        UUID id = sesion();

        almacen.guardar(id, "h", Instant.now().plusSeconds(180));

        Long ttl = instanciaA.plantilla().getExpire(PREFIJO + id, TimeUnit.SECONDS);
        assertThat(ttl).as("TTL en segundos: 180 de vigencia + 600 de retencion").isBetween(770L, 781L);
    }

    @Test
    void laSesionDesapareceRealmenteCuandoVenceElTtl() throws Exception {
        RedisQrWebSessionStore almacen = new RedisQrWebSessionStore(instanciaA.plantilla(), Duration.ofSeconds(1));
        UUID id = sesion();

        almacen.guardar(id, "h", Instant.now().plusSeconds(1)); // TTL real: 2 s
        assertThat(almacen.buscar(id)).isPresent();

        Thread.sleep(2600);

        assertThat(almacen.buscar(id)).as("Redis la elimina sola al vencer el TTL").isEmpty();
    }

    @Test
    void unaSesionVencidaSigueConsultableDuranteLaRetencion() {
        RedisQrWebSessionStore almacen = new RedisQrWebSessionStore(instanciaA.plantilla());
        UUID id = sesion();

        almacen.guardar(id, "h", Instant.now().minusSeconds(5));

        assertThat(almacen.buscar(id).orElseThrow().expirado())
                .as("permite responder 'Expirado' en vez de 'no encontrada'").isTrue();
    }

    @Test
    void unaSesionQueYaPasoLaRetencionNoSeGuarda() {
        RedisQrWebSessionStore almacen = new RedisQrWebSessionStore(instanciaA.plantilla());

        assertThatThrownBy(() -> almacen.guardar(sesion(), "h", Instant.now().minusSeconds(3600)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void otraInstanciaDeLaApiVeLaMismaSesion() {
        UUID id = sesion();
        Instant expira = Instant.now().plusSeconds(180);
        new RedisQrWebSessionStore(instanciaA.plantilla()).guardar(id, "hash-compartido", expira);

        ConexionRedis instanciaB = nueva(); // otra conexion = otra replica de la API
        QrWebSessionStore.Session vista = new RedisQrWebSessionStore(instanciaB.plantilla()).buscar(id).orElseThrow();

        assertThat(vista.tokenHash()).isEqualTo("hash-compartido");
    }

    @Test
    void laSesionSobreviveAlReinicioDeLaApi() {
        UUID id = sesion();
        ConexionRedis antesDelReinicio = nueva();
        new RedisQrWebSessionStore(antesDelReinicio.plantilla()).guardar(id, "persistente", Instant.now().plusSeconds(180));
        antesDelReinicio.close(); // la API se apaga

        ConexionRedis despuesDelReinicio = nueva(); // arranca de nuevo
        assertThat(new RedisQrWebSessionStore(despuesDelReinicio.plantilla()).buscar(id)).isPresent();
    }

    @Test
    void estadoCorruptoEnRedisFallaConUnMensajeClaroYNoConUnNullPointer() {
        RedisQrWebSessionStore almacen = new RedisQrWebSessionStore(instanciaA.plantilla());
        UUID id = sesion();

        instanciaA.plantilla().opsForValue().set(PREFIJO + id, "basura-sin-separador");
        assertThatThrownBy(() -> almacen.buscar(id)).isInstanceOf(IllegalStateException.class);

        instanciaA.plantilla().opsForValue().set(PREFIJO + id, "hash|no-es-un-numero");
        assertThatThrownBy(() -> almacen.buscar(id)).isInstanceOf(IllegalStateException.class);
    }
}
