package ni.edu.uam.SpartanGymAPI.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sin entry point configurado, Spring Security respondía 403 a lo no autenticado, y el web
 * solo cierra la sesión ante un 401: una sesión vencida nunca llevaba al login.
 */
@SpringBootTest
class EntryPointTest {

    @Autowired private WebApplicationContext contexto;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(contexto).apply(springSecurity()).build();
    }

    @Test
    void sinToken_es401ConTextoPlano() throws Exception {
        mockMvc.perform(get("/api/operacion/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(containsString("sesión")));
    }

    @Test
    void tokenInvalido_es401() throws Exception {
        mockMvc.perform(get("/api/operacion/me").header("Authorization", "Bearer basura.basura.basura"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void conOptIn_es401ProblemJson() throws Exception {
        mockMvc.perform(get("/api/operacion/me").header("Accept", "application/problem+json"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.codigo").value("NO_AUTENTICADO"));
    }

    @Test
    void endpointPublico_noEmpiezaADar401ConTokenBasura() throws Exception {
        // Evita un loop en /login del web: un token viejo guardado no puede volver 401 lo público.
        mockMvc.perform(get("/api/configuracion").header("Authorization", "Bearer basura.basura.basura"))
                .andExpect(status().is(not(401)));
    }
}
