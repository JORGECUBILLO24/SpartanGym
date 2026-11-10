package ni.edu.uam.SpartanGymAPI.integracion;

import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.net.URI;
import java.time.Duration;

/** Crea conexiones independientes a un Redis real; cada una simula una instancia de la API. */
public final class RedisPruebas {

    private RedisPruebas() {
    }

    /** URL del Redis de pruebas (redis://host:puerto) o null si no se configuro. */
    public static String url() {
        return System.getenv("SPARTAN_IT_REDIS_URL");
    }

    public static ConexionRedis conectar(String url) {
        URI uri = URI.create(url);
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(
                uri.getHost(), uri.getPort() > 0 ? uri.getPort() : 6379);
        LettuceClientConfiguration cliente = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(2))
                .build();
        LettuceConnectionFactory fabrica = new LettuceConnectionFactory(config, cliente);
        fabrica.afterPropertiesSet();
        return new ConexionRedis(fabrica, new StringRedisTemplate(fabrica));
    }

    public record ConexionRedis(LettuceConnectionFactory fabrica, StringRedisTemplate plantilla)
            implements AutoCloseable {
        @Override
        public void close() {
            fabrica.destroy();
        }
    }
}
