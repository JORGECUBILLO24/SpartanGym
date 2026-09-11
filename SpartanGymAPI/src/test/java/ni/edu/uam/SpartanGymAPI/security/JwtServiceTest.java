package ni.edu.uam.SpartanGymAPI.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private JwtService crearServicio(String secretConfigurado, String... perfilesActivos) {
        MockEnvironment environment = new MockEnvironment();
        if (perfilesActivos.length > 0) {
            environment.setActiveProfiles(perfilesActivos);
        }
        JwtService service = new JwtService(environment);
        ReflectionTestUtils.setField(service, "secretKey", secretConfigurado);
        return service;
    }

    private void validarSecret(JwtService service) {
        ReflectionTestUtils.invokeMethod(service, "validarSecret");
    }

    @Test
    void validarSecret_lanzaExcepcionSiJwtSecretVacioFueraDePerfilLocal() {
        JwtService service = crearServicio("", "default");

        assertThrows(IllegalStateException.class, () -> validarSecret(service));
    }

    @Test
    void validarSecret_noLanzaExcepcionSiJwtSecretVacioEnPerfilLocal() {
        JwtService service = crearServicio("", "local");

        assertDoesNotThrow(() -> validarSecret(service));
    }

    @Test
    void validarSecret_noLanzaExcepcionSiJwtSecretConfiguradoFueraDePerfilLocal() {
        JwtService service = crearServicio("un-secreto-real-configurado-por-variable-de-entorno", "default");

        assertDoesNotThrow(() -> validarSecret(service));
    }
}
