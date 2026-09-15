package ni.edu.uam.SpartanGymAPI.security;

import ni.edu.uam.SpartanGymAPI.exceptions.ReglaNegocioException;
import ni.edu.uam.SpartanGymAPI.services.PasswordResetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Fija el contrato con el header Accept EXACTO que mandan la web (api.js) y la app
 * (ErroresApi.kt). Con problem+json primero en la lista, Spring negociaba también las
 * respuestas exitosas como application/problem+json, y la web dejaba de parsear el JSON:
 * pasó en producción. Si alguien vuelve a cambiar el orden, estos tests lo detectan.
 */
@SpringBootTest
class AcceptDeLosClientesTest {

    /** Copiado literal de api.js y ErroresApi.kt: si cambia allá, hay que cambiarlo acá. */
    static final String ACCEPT_CLIENTES = "application/json, application/problem+json;q=0.9, */*;q=0.8";

    @Autowired private WebApplicationContext contexto;
    @MockitoBean private PasswordResetService passwordResetService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(contexto).apply(springSecurity()).build();
    }

    @Test
    void respuestaExitosa_esApplicationJsonYNoProblemJson() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .header("Accept", ACCEPT_CLIENTES)
                        .contentType("application/json")
                        .content("{\"email\":\"socio@ejemplo.com\"}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"));
    }

    @Test
    void error_esProblemJsonConCodigo() throws Exception {
        doThrow(new ReglaNegocioException("El enlace de restablecimiento no es valido o ya fue usado"))
                .when(passwordResetService).restablecerPassword(anyString(), anyString());

        mockMvc.perform(post("/api/auth/reset-password")
                        .header("Accept", ACCEPT_CLIENTES)
                        .contentType("application/json")
                        .content("{\"token\":\"falso\",\"password\":\"ClaveNueva123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.codigo").value("REGLA_NEGOCIO"));
    }
}
