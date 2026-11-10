package ni.edu.uam.SpartanGymAPI.integracion;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Base de las pruebas de integración contra un PostgreSQL REAL (concurrencia, bloqueos,
 * restricciones de la base). Con mocks no se puede probar una carrera: lo que importa es cómo
 * se comportan las transacciones y los bloqueos de la base de datos.
 *
 * Solo corren si SPARTAN_IT_DB_URL está definida: cada subclase debe declarar también
 * @EnabledIfEnvironmentVariable, porque JUnit no hereda esa condición de esta clase base. La CI la define con un servicio postgres:16.
 * En local, apuntarla a una base DESCARTABLE con el esquema ya cargado, nunca a una de verdad:
 *
 *   SPARTAN_IT_DB_URL=jdbc:postgresql://localhost:5432/spartangym_it
 *   SPARTAN_IT_DB_USER=postgres  SPARTAN_IT_DB_PASSWORD=...
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "SPARTAN_IT_DB_URL", matches = ".+")
public abstract class IntegracionPostgresBase {

    @DynamicPropertySource
    static void baseDeDatos(DynamicPropertyRegistry registro) {
        registro.add("spring.datasource.url", () -> System.getenv("SPARTAN_IT_DB_URL"));
        registro.add("spring.datasource.username", () -> System.getenv().getOrDefault("SPARTAN_IT_DB_USER", "postgres"));
        registro.add("spring.datasource.password", () -> System.getenv().getOrDefault("SPARTAN_IT_DB_PASSWORD", "postgres"));
    }
}
