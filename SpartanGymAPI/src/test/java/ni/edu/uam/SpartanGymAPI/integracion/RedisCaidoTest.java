package ni.edu.uam.SpartanGymAPI.integracion;

import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.services.QrWebSessionStore;
import ni.edu.uam.SpartanGymAPI.services.RedisQrWebSessionStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Caída de Redis de punta a punta: la API arranca igual (Redis conecta de forma perezosa) y, cuando
 * alguien pide un QR, responde 503 rápido y legible. No hay caída silenciosa a memoria local, que
 * con varias instancias dejaría sesiones visibles solo en una de ellas.
 *
 * No necesita un Redis real: apunta a un puerto cerrado, que es lo mismo que un Redis caído.
 */
@SpringBootTest(properties = {
        "app.qr.session-store=redis",
        "spring.data.redis.url=redis://127.0.0.1:6399",
        "spring.data.redis.connect-timeout=1s",
        "spring.data.redis.timeout=1s"
})
class RedisCaidoTest {

    @Autowired private WebApplicationContext contexto;
    @Autowired private QrWebSessionStore almacen;
    @MockitoBean private UsuarioRepository usuarioRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(contexto).apply(springSecurity()).build();
        when(usuarioRepository.findByEmailIgnoreCase("recepcion@ejemplo.com")).thenReturn(Optional.of(new Usuario()));
    }

    @Test
    void conLaPropiedadEnRedis_seActivaElAlmacenRedisYNoElDeMemoria() {
        assertThat(almacen).isInstanceOf(RedisQrWebSessionStore.class);
    }

    @Test
    @WithMockUser(username = "recepcion@ejemplo.com", roles = "RECEPCIONISTA")
    void generarUnQrConRedisCaidoResponde503RapidoYLegible() throws Exception {
        long inicio = System.nanoTime();

        mockMvc.perform(get("/api/asistencias/qr-validacion").header("Accept", "application/problem+json, */*"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.codigo").value("SERVICIO_NO_DISPONIBLE"))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("no esta disponible")));

        long segundos = (System.nanoTime() - inicio) / 1_000_000_000;
        assertThat(segundos).as("con timeout de 1 s la petición no debe quedarse colgada").isLessThan(8);
    }
}
