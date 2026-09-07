package ni.edu.uam.SpartanGymAPI.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * La propiedad que lee SecurityConfig tiene que estar alimentada por la variable de entorno
 * APP_CORS_ORIGINS, que es la que documenta render.yaml y la que esta cargada en Render.
 *
 * Sin el puente en application.properties, Spring buscaba APP_CORS_ALLOWED_ORIGINS (asi
 * traduce el nombre de la propiedad) y APP_CORS_ORIGINS se ignoraba en silencio: el web
 * desplegado quedaba fuera de la lista y todas sus llamadas fallaban por CORS.
 */
@SpringBootTest
@TestPropertySource(properties = "APP_CORS_ORIGINS=https://ejemplo.vercel.app,http://localhost:5173")
class CorsOrigenesTest {

    @Value("${app.cors.allowed-origins}")
    private String origenesConfigurados;

    @Test
    void laPropiedadDeCorsSeAlimentaDeLaVariableAppCorsOrigins() {
        assertEquals("https://ejemplo.vercel.app,http://localhost:5173", origenesConfigurados);
    }
}
