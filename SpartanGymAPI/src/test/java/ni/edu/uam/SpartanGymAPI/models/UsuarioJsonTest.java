package ni.edu.uam.SpartanGymAPI.models;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UsuarioJsonTest {
    @Test
    void laMembresiaNoExponeElHashDelUsuarioAnidado() {
        Usuario usuario = new Usuario();
        usuario.setEmail("socio@example.test");
        usuario.setPasswordHash("hash-privado-de-prueba");
        Socio socio = new Socio();
        socio.setUsuario(usuario);
        MembresiaSocio membresia = new MembresiaSocio();
        membresia.setSocio(socio);

        String json = JsonMapper.builder().build().writeValueAsString(membresia);

        assertTrue(json.contains("socio@example.test"));
        assertFalse(json.contains("passwordHash"));
        assertFalse(json.contains("hash-privado-de-prueba"));
    }
}
