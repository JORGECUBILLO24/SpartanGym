package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.CompraMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.integracion.IntegracionPostgresBase;
import ni.edu.uam.SpartanGymAPI.models.Rol;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.TipoMembresia;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.RolRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.TipoMembresiaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Doble envío de un pago de membresía (doble clic, reintento de la app, dos pestañas) contra un
 * PostgreSQL real. Lo que se verifica es el DINERO: nunca debe quedar un pago cobrado sin la
 * membresía que le corresponde, ni dos membresías activas para el mismo socio.
 */
// La condicion va en cada clase: JUnit no la hereda de IntegracionPostgresBase.
@EnabledIfEnvironmentVariable(named = "SPARTAN_IT_DB_URL", matches = ".+")
class MembresiaPagoConcurrenciaIntegrationTest extends IntegracionPostgresBase {

    private static final String EMAIL = "socio-it-membresia@ejemplo.com";

    @Autowired private MembresiaService membresiaService;
    @Autowired private PagoService pagoService;
    @Autowired private RolRepository rolRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private SocioRepository socioRepository;
    @Autowired private TipoMembresiaRepository tipoMembresiaRepository;
    @Autowired private JdbcTemplate jdbc;

    private UUID socioId;
    private TipoMembresia tipo;

    @BeforeEach
    void prepararSocio() {
        Rol rol = rolRepository.findByNombre("ROLE_SOCIO").orElseGet(() -> {
            Rol nuevo = new Rol();
            nuevo.setNombre("ROLE_SOCIO");
            return rolRepository.save(nuevo);
        });
        Usuario usuario = new Usuario();
        usuario.setEmail(EMAIL);
        usuario.setPasswordHash("$2a$10$hash-de-prueba");
        usuario.setRol(rol);
        usuario = usuarioRepository.save(usuario);

        Socio socio = new Socio();
        socio.setUsuario(usuario);
        socio.setNombres("Socio");
        socio.setApellidos("De Prueba");
        socio.setEstadoAcceso("Inactivo");
        socioRepository.save(socio);
        socioId = usuario.getId();

        TipoMembresia nuevoTipo = new TipoMembresia();
        nuevoTipo.setNombre("Plan IT " + UUID.randomUUID().toString().substring(0, 8));
        nuevoTipo.setDuracionDias(30);
        nuevoTipo.setPrecio(new BigDecimal("25.00"));
        tipo = tipoMembresiaRepository.save(nuevoTipo);
    }

    @AfterEach
    void limpiar() {
        jdbc.update("DELETE FROM membresias_socio WHERE socio_id = ?", socioId);
        jdbc.update("DELETE FROM pagos WHERE socio_id = ?", socioId);
        jdbc.update("DELETE FROM socios WHERE usuario_id = ?", socioId);
        jdbc.update("DELETE FROM usuarios WHERE id = ?", socioId);
        jdbc.update("DELETE FROM tipos_membresia WHERE id = ?", tipo.getId());
    }

    private int contar(String sql) {
        Integer total = jdbc.queryForObject(sql, Integer.class, socioId);
        return total == null ? 0 : total;
    }

    private int membresiasActivas() {
        return contar("SELECT COUNT(*) FROM membresias_socio WHERE socio_id = ? AND estado = 'Activa'");
    }

    private int pagos() {
        return contar("SELECT COUNT(*) FROM pagos WHERE socio_id = ?");
    }

    private int ejecutarEnParalelo(int hilos, Callable<Void> tarea) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(hilos);
        CountDownLatch listos = new CountDownLatch(hilos);
        CountDownLatch salida = new CountDownLatch(1);
        AtomicInteger exitos = new AtomicInteger();
        List<Future<?>> futuros = new ArrayList<>();
        for (int i = 0; i < hilos; i++) {
            futuros.add(pool.submit(() -> {
                listos.countDown();
                salida.await();
                try {
                    tarea.call();
                    exitos.incrementAndGet();
                } catch (Exception esperado) {
                    // Los perdedores de la carrera fallan (Conflicto / integridad): es lo correcto.
                }
                return null;
            }));
        }
        listos.await(10, TimeUnit.SECONDS);
        salida.countDown();
        for (Future<?> futuro : futuros) {
            futuro.get(60, TimeUnit.SECONDS);
        }
        pool.shutdown();
        return exitos.get();
    }

    @Test
    void comprarLaMismaMembresiaVariasVecesALaVez_cobraYActivaUnaSolaVez() throws Exception {
        CompraMembresiaRequest request = new CompraMembresiaRequest();
        request.setTipoMembresiaId(tipo.getId());
        request.setMetodoPago("Efectivo");

        int exitos = ejecutarEnParalelo(6, () -> {
            membresiaService.comprarMembresia(EMAIL, request);
            return null;
        });

        assertThat(exitos).as("compras que terminaron bien").isEqualTo(1);
        assertThat(membresiasActivas()).as("membresías activas").isEqualTo(1);
        assertThat(pagos()).as("pagos cobrados (uno por membresía, ninguno huérfano)").isEqualTo(1);
    }

    @Test
    void renovarVariasVecesALaVez_noDejaDosMembresiasActivasNiPagosHuerfanos() throws Exception {
        // Parte de un socio con membresía activa, como ocurre en una renovación real.
        pagoService.renovarMembresiaSocio(EMAIL, tipo.getId(), "Efectivo");
        assertThat(membresiasActivas()).isEqualTo(1);
        assertThat(pagos()).isEqualTo(1);

        int exitos = ejecutarEnParalelo(6, () -> {
            pagoService.renovarMembresiaSocio(EMAIL, tipo.getId(), "Efectivo");
            return null;
        });

        assertThat(exitos).as("renovaciones simultáneas que terminaron bien").isEqualTo(1);
        assertThat(membresiasActivas()).as("membresías activas").isEqualTo(1);
        assertThat(pagos()).as("pagos: el inicial + exactamente 1 de la renovación").isEqualTo(2);
        assertThat(contar("SELECT COUNT(*) FROM membresias_socio WHERE socio_id = ?"))
                .as("membresías totales (la anterior queda 'Renovada')").isEqualTo(2);
    }
}
