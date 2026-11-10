package ni.edu.uam.SpartanGymAPI.security;

import ni.edu.uam.SpartanGymAPI.models.Asistencia;
import ni.edu.uam.SpartanGymAPI.models.ControlBiometrico;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Pago;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.TipoMembresia;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.services.AsistenciaService;
import ni.edu.uam.SpartanGymAPI.services.ControlBiometricoService;
import ni.edu.uam.SpartanGymAPI.services.MembresiaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Serializa de verdad, por HTTP, las respuestas que antes devolvían entidades JPA.
 *
 * Asistencia, MembresiaSocio y ControlBiometrico arrastraban Socio -> Usuario, y Usuario trae
 * passwordHash. Sin @JsonIgnore ese hash salía en el JSON. Estos tests usan el grafo completo
 * (con un hash reconocible) y exigen que NADA de eso llegue al cliente.
 */
@SpringBootTest
class ExposicionDeDatosTest {

    private static final String HASH = "$2a$10$HASH-BCRYPT-QUE-NO-DEBE-SALIR-NUNCA";
    private static final UUID ID_SOCIO = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Autowired private WebApplicationContext contexto;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private AsistenciaService asistenciaService;
    @MockitoBean private MembresiaService membresiaService;
    @MockitoBean private ControlBiometricoService controlBiometricoService;

    private MockMvc mockMvc;
    private Socio socio;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(contexto).apply(springSecurity()).build();

        Rol rol = new Rol();
        rol.setId(4);
        rol.setNombre("ROLE_SOCIO");

        Usuario usuario = new Usuario();
        usuario.setId(ID_SOCIO);
        usuario.setEmail("socio@ejemplo.com");
        usuario.setPasswordHash(HASH);
        usuario.setRol(rol);
        usuario.setFotoUrl("data:image/png;base64,AAAA");

        socio = new Socio();
        socio.setUsuarioId(ID_SOCIO);
        socio.setUsuario(usuario);
        socio.setNombres("Ana");
        socio.setApellidos("Pérez");
        socio.setEstadoAcceso("Activo");
    }

    private void assertSinDatosSensibles(MvcResult resultado) throws Exception {
        String cuerpo = resultado.getResponse().getContentAsString();
        assertThat(cuerpo)
                .as("cuerpo de la respuesta: %s", cuerpo)
                .doesNotContain("passwordHash")
                .doesNotContain(HASH)
                .doesNotContain("password")
                .doesNotContain("socio@ejemplo.com")
                .doesNotContain("fotoUrl")
                .doesNotContain("qrTokenHash");
    }

    private Asistencia asistencia() {
        Asistencia asistencia = new Asistencia();
        asistencia.setId(UUID.randomUUID());
        asistencia.setSocio(socio);
        asistencia.setFechaHora(LocalDateTime.of(2026, 10, 15, 9, 30));
        asistencia.setQrTokenHash("abc123-hash-del-qr");
        return asistencia;
    }

    @Test
    @WithMockUser(username = "recepcion@ejemplo.com", roles = "RECEPCIONISTA")
    void checkIn_noExponeElHashNiLosDatosDeLaCuenta() throws Exception {
        when(asistenciaService.registrarEntrada(any())).thenReturn(asistencia());

        MvcResult resultado = mockMvc.perform(post("/api/asistencias/check-in")
                        .contentType("application/json")
                        .content("{\"idSocio\":\"" + ID_SOCIO + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.socioId").value(ID_SOCIO.toString()))
                .andExpect(jsonPath("$.socio").value("Ana Pérez"))
                .andReturn();

        assertSinDatosSensibles(resultado);
    }

    @Test
    @WithMockUser(username = "recepcion@ejemplo.com", roles = "RECEPCIONISTA")
    void historialDeAsistencias_noExponeElHashNiLosDatosDeLaCuenta() throws Exception {
        when(asistenciaService.obtenerHistorial(ID_SOCIO)).thenReturn(List.of(asistencia(), asistencia()));

        MvcResult resultado = mockMvc.perform(get("/api/asistencias/socio/" + ID_SOCIO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fechaHora").exists())
                .andReturn();

        assertSinDatosSensibles(resultado);
    }

    @Test
    @WithMockUser(username = "socio@ejemplo.com", roles = "SOCIO")
    void comprarMembresia_noExponeElHashNiLosDatosDeLaCuenta() throws Exception {
        TipoMembresia tipo = new TipoMembresia();
        tipo.setId(1);
        tipo.setNombre("Mensual");
        tipo.setDuracionDias(30);
        tipo.setPrecio(new BigDecimal("25.00"));

        Pago pago = new Pago();
        pago.setId(UUID.randomUUID());
        pago.setSocio(socio);
        pago.setMonto(new BigDecimal("25.00"));
        pago.setMetodoPago("Efectivo");

        MembresiaSocio membresia = new MembresiaSocio();
        membresia.setId(UUID.randomUUID());
        membresia.setSocio(socio);
        membresia.setTipoMembresia(tipo);
        membresia.setPago(pago);
        membresia.setFechaInicio(LocalDate.of(2026, 10, 15));
        membresia.setFechaVencimiento(LocalDate.of(2026, 11, 14));
        membresia.setEstado("Activa");
        when(membresiaService.comprarMembresia(anyString(), any())).thenReturn(membresia);

        MvcResult resultado = mockMvc.perform(post("/api/membresias/comprar")
                        .contentType("application/json")
                        .content("{\"tipoMembresiaId\":1,\"metodoPago\":\"Efectivo\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoMembresia").value("Mensual"))
                .andExpect(jsonPath("$.estado").value("Activa"))
                .andExpect(jsonPath("$.fechaVencimiento").value("2026-11-14"))
                .andReturn();

        assertSinDatosSensibles(resultado);
    }

    @Test
    @WithMockUser(username = "entrenador@ejemplo.com", roles = "ENTRENADOR")
    void historialDeProgreso_noExponeElHashPeroConservaLosCamposQueLeeLaApp() throws Exception {
        ControlBiometrico control = new ControlBiometrico();
        control.setId(UUID.randomUUID());
        control.setSocio(socio);
        control.setPesoKg(72.5);
        control.setMedidasNotas("Cintura 80cm");
        control.setFechaRegistro(LocalDateTime.of(2026, 10, 1, 8, 0));
        when(controlBiometricoService.obtenerHistorialProgreso(ID_SOCIO)).thenReturn(List.of(control));

        MvcResult resultado = mockMvc.perform(get("/api/progreso/socio/" + ID_SOCIO))
                .andExpect(status().isOk())
                // Estos 4 campos son los únicos que lee ControlBiometricoResponse en la app Android.
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].fechaRegistro").exists())
                .andExpect(jsonPath("$[0].pesoKg").value(72.5))
                .andExpect(jsonPath("$[0].medidasNotas").value("Cintura 80cm"))
                .andReturn();

        assertSinDatosSensibles(resultado);
    }

    @Test
    @WithMockUser(username = "entrenador@ejemplo.com", roles = "ENTRENADOR")
    void registrarProgreso_noExponeElHash() throws Exception {
        ControlBiometrico control = new ControlBiometrico();
        control.setId(UUID.randomUUID());
        control.setSocio(socio);
        control.setPesoKg(70.0);
        when(controlBiometricoService.registrarProgreso(any())).thenReturn(control);

        MvcResult resultado = mockMvc.perform(post("/api/progreso")
                        .contentType("application/json")
                        .content("{\"idSocio\":\"" + ID_SOCIO + "\",\"pesoKg\":70.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pesoKg").value(70.0))
                .andReturn();

        assertSinDatosSensibles(resultado);
    }

    /**
     * Defensa en profundidad: aunque un endpoint futuro vuelva a devolver una entidad JPA, el
     * hash de la contraseña no puede serializarse ni aparecer en toString() (logs).
     */
    @Test
    void usuario_nuncaSerializaNiImprimeElHash() {
        String json = objectMapper.writeValueAsString(socio);

        assertThat(json).doesNotContain("passwordHash").doesNotContain(HASH);
        assertThat(socio.getUsuario().toString()).doesNotContain(HASH);
        assertThat(socio.toString()).doesNotContain(HASH);
    }
}
