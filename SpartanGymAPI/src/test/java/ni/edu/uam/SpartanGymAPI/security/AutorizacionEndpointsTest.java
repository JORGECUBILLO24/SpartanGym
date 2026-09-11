package ni.edu.uam.SpartanGymAPI.security;

import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.services.DashboardService;
import ni.edu.uam.SpartanGymAPI.services.ReporteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifica que las reglas de autorización se apliquen de verdad en el filtro de seguridad.
 *
 * Un test unitario del método del controller NO sirve para esto: las @PreAuthorize las aplica
 * el proxy de Spring, así que ese test pasaría igual aunque la anotación no existiera.
 */
@SpringBootTest
class AutorizacionEndpointsTest {

    private static final UUID ID_SOCIO = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ID_OTRO_SOCIO = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Autowired private WebApplicationContext contexto;

    @MockitoBean private ReporteService reporteService;
    @MockitoBean private DashboardService dashboardService;
    @MockitoBean private UsuarioRepository usuarioRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
                .apply(springSecurity())
                .build();

        Usuario socio = new Usuario();
        socio.setId(ID_SOCIO);
        socio.setEmail("socio@ejemplo.com");
        org.mockito.Mockito.when(usuarioRepository.findByEmailIgnoreCase("socio@ejemplo.com"))
                .thenReturn(Optional.of(socio));
        // Los servicios quedan mockeados devolviendo null: acá solo importa el status,
        // no el cuerpo. Si la autorización deja pasar, el status es 200 igual.
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_noPuedeLeerLosIngresosDelGimnasio() throws Exception {
        mockMvc.perform(get("/api/reportes/resumen"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@ejemplo.com", roles = "ADMIN")
    void admin_siPuedeLeerLosIngresosDelGimnasio() throws Exception {
        mockMvc.perform(get("/api/reportes/resumen"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_noPuedeVerElDashboardDeOtroSocio() throws Exception {
        mockMvc.perform(get("/api/dashboard/inicio/" + ID_OTRO_SOCIO))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_siPuedeVerSuPropioDashboard() throws Exception {
        mockMvc.perform(get("/api/dashboard/inicio/" + ID_SOCIO))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_noPuedeVerElHistorialDeProgresoDeOtro() throws Exception {
        mockMvc.perform(get("/api/progreso/socio/" + ID_OTRO_SOCIO))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_noPuedeVerLosPagosDeOtro() throws Exception {
        mockMvc.perform(get("/api/operacion/pagos/socio/" + ID_OTRO_SOCIO))
                .andExpect(status().isForbidden());
    }
}
