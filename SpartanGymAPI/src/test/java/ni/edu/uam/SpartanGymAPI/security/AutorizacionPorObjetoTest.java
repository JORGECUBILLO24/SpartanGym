package ni.edu.uam.SpartanGymAPI.security;

import ni.edu.uam.SpartanGymAPI.dto.EstadoSocioResponse;
import ni.edu.uam.SpartanGymAPI.models.Notificacion;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.NotificacionRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.services.AsistenciaService;
import ni.edu.uam.SpartanGymAPI.services.CatalogoService;
import ni.edu.uam.SpartanGymAPI.services.SocioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Autorización por OBJETO: no alcanza con que el rol sea válido, el usuario tiene que poder
 * ver ESE registro. Cada caso pasa por el filtro de seguridad real (no es un test unitario
 * del controller, que ignoraría @PreAuthorize).
 *
 * Los servicios están mockeados: acá solo importa si el acceso se permite o se rechaza.
 */
@SpringBootTest
class AutorizacionPorObjetoTest {

    private static final UUID ID_SOCIO = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ID_OTRO_SOCIO = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ID_NOTIFICACION = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Autowired private WebApplicationContext contexto;

    @MockitoBean private UsuarioRepository usuarioRepository;
    @MockitoBean private AsistenciaService asistenciaService;
    @MockitoBean private SocioService socioService;
    @MockitoBean private NotificacionRepository notificacionRepository;
    @MockitoBean private CatalogoService catalogoService;
    // marcarLeida es @Transactional: sin esto la prueba abriría una conexión real a PostgreSQL y
    // fallaría con 500 en cualquier entorno sin esa base (como la CI). Acá solo importa la autorización.
    @MockitoBean private PlatformTransactionManager transactionManager;

    private MockMvc mockMvc;
    private Usuario socio;
    private Usuario otroSocio;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(contexto).apply(springSecurity()).build();

        socio = usuario(ID_SOCIO, "socio@ejemplo.com");
        otroSocio = usuario(ID_OTRO_SOCIO, "otro@ejemplo.com");
        when(usuarioRepository.findByEmailIgnoreCase("socio@ejemplo.com")).thenReturn(Optional.of(socio));
        when(usuarioRepository.findByEmail("socio@ejemplo.com")).thenReturn(Optional.of(socio));

        when(asistenciaService.obtenerHistorial(any())).thenReturn(List.of());
        when(socioService.consultarEstado(any())).thenReturn(new EstadoSocioResponse());
    }

    private static Usuario usuario(UUID id, String email) {
        Rol rol = new Rol();
        rol.setNombre("ROLE_SOCIO");
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setEmail(email);
        usuario.setRol(rol);
        return usuario;
    }

    private Notificacion notificacion(Usuario duenio) {
        Notificacion notificacion = new Notificacion();
        notificacion.setId(ID_NOTIFICACION);
        notificacion.setUsuario(duenio);
        notificacion.setTipo("Rutina");
        notificacion.setTitulo("Nueva rutina");
        notificacion.setMensaje("Mensaje privado de otra persona");
        when(notificacionRepository.findById(ID_NOTIFICACION)).thenReturn(Optional.of(notificacion));
        when(notificacionRepository.save(any(Notificacion.class))).thenAnswer(i -> i.getArgument(0));
        return notificacion;
    }

    // ---------------- /api/asistencias/socio/{socioId}: historial de asistencias ----------------

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_noPuedeVerLasAsistenciasDeOtroSocio() throws Exception {
        mockMvc.perform(get("/api/asistencias/socio/" + ID_OTRO_SOCIO)).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_siPuedeVerSusPropiasAsistencias() throws Exception {
        mockMvc.perform(get("/api/asistencias/socio/" + ID_SOCIO)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "recepcion@ejemplo.com", roles = "RECEPCIONISTA")
    void recepcion_puedeVerLasAsistenciasDeCualquierSocio() throws Exception {
        mockMvc.perform(get("/api/asistencias/socio/" + ID_OTRO_SOCIO)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@ejemplo.com", roles = "ADMIN")
    void admin_puedeVerLasAsistenciasDeCualquierSocio() throws Exception {
        mockMvc.perform(get("/api/asistencias/socio/" + ID_OTRO_SOCIO)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "entrenador@ejemplo.com", roles = "ENTRENADOR")
    void entrenador_noNecesitaElHistorialDeAsistenciasYNoLoVe() throws Exception {
        mockMvc.perform(get("/api/asistencias/socio/" + ID_OTRO_SOCIO)).andExpect(status().isForbidden());
    }

    @Test
    void sinSesion_historialDeAsistenciasDevuelve401() throws Exception {
        mockMvc.perform(get("/api/asistencias/socio/" + ID_SOCIO)).andExpect(status().isUnauthorized());
    }

    // ---------------- /api/socios/estado/{socioId} ----------------

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_noPuedeVerElEstadoDeOtroSocio() throws Exception {
        mockMvc.perform(get("/api/socios/estado/" + ID_OTRO_SOCIO)).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_siPuedeVerSuPropioEstado() throws Exception {
        mockMvc.perform(get("/api/socios/estado/" + ID_SOCIO)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "recepcion@ejemplo.com", roles = "RECEPCIONISTA")
    void personal_puedeVerElEstadoDeCualquierSocio() throws Exception {
        mockMvc.perform(get("/api/socios/estado/" + ID_OTRO_SOCIO)).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "entrenador@ejemplo.com", roles = "ENTRENADOR")
    void entrenador_puedeVerElEstadoDeSusSocios() throws Exception {
        mockMvc.perform(get("/api/socios/estado/" + ID_OTRO_SOCIO)).andExpect(status().isOk());
    }

    // ---------------- notificaciones: marcar como leída ----------------

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_noPuedeMarcarLeidaLaNotificacionDeOtro_ni_saberQueExiste() throws Exception {
        notificacion(otroSocio);

        // 404 y no 403: confirmar que el id existe ya sería filtrar información ajena.
        mockMvc.perform(patch("/api/operacion/notificaciones/" + ID_NOTIFICACION + "/leer"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_siPuedeMarcarLeidaSuPropiaNotificacion() throws Exception {
        notificacion(socio);

        mockMvc.perform(patch("/api/operacion/notificaciones/" + ID_NOTIFICACION + "/leer"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_puedeMarcarLeidaUnaNotificacionGlobal() throws Exception {
        notificacion(null);

        mockMvc.perform(patch("/api/operacion/notificaciones/" + ID_NOTIFICACION + "/leer"))
                .andExpect(status().isOk());
    }

    // ---------------- catálogo: solo el personal que arma rutinas lo modifica ----------------

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_noPuedeCrearEjerciciosNiGruposMusculares() throws Exception {
        mockMvc.perform(post("/api/catalogo/ejercicios").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/catalogo/grupos-musculares").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "recepcion@ejemplo.com", roles = "RECEPCIONISTA")
    void recepcion_noPuedeModificarElCatalogoDeEjercicios() throws Exception {
        mockMvc.perform(post("/api/catalogo/ejercicios").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "entrenador@ejemplo.com", roles = "ENTRENADOR")
    void entrenador_siPuedeCrearEjercicios() throws Exception {
        mockMvc.perform(post("/api/catalogo/ejercicios").contentType("application/json").content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void socio_siPuedeConsultarElCatalogo() throws Exception {
        mockMvc.perform(get("/api/catalogo/ejercicios")).andExpect(status().isOk());
    }
}
