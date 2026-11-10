package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.VentaProductoDetalleRequest;
import ni.edu.uam.SpartanGymAPI.dto.VentaProductoRequest;
import ni.edu.uam.SpartanGymAPI.exceptions.ReglaNegocioException;
import ni.edu.uam.SpartanGymAPI.integracion.IntegracionPostgresBase;
import ni.edu.uam.SpartanGymAPI.models.ProductoInventario;
import ni.edu.uam.SpartanGymAPI.models.Sucursal;
import ni.edu.uam.SpartanGymAPI.repositories.ProductoInventarioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SucursalRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

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
 * Ventas simultáneas contra un PostgreSQL real (ver IntegracionPostgresBase para correrla en local).
 * Antes de bloquear las filas de producto, 12 ventas de 1 unidad con stock 5 se facturaban todas,
 * y dos ventas con los mismos productos en orden opuesto terminaban en deadlock.
 */
// La condicion va en cada clase: JUnit no la hereda de IntegracionPostgresBase.
@EnabledIfEnvironmentVariable(named = "SPARTAN_IT_DB_URL", matches = ".+")
class VentaProductoConcurrenciaIntegrationTest extends IntegracionPostgresBase {

    @Autowired private VentaProductoService ventaProductoService;
    @Autowired private ProductoInventarioRepository productoRepository;
    @Autowired private SucursalRepository sucursalRepository;
    @Autowired private JdbcTemplate jdbc;

    private Sucursal sucursal;
    private final List<UUID> productosCreados = new ArrayList<>();

    @BeforeEach
    void prepararSucursal() {
        Sucursal nueva = new Sucursal();
        nueva.setNombre("Sucursal IT " + UUID.randomUUID());
        nueva.setUbicacion("Prueba de integración");
        nueva.setCapacidad(10);
        nueva.setHorarioApertura("06:00");
        nueva.setHorarioCierre("21:00");
        sucursal = sucursalRepository.save(nueva);
    }

    @AfterEach
    void limpiar() {
        for (UUID id : productosCreados) {
            jdbc.update("DELETE FROM detalle_ventas_productos WHERE producto_id = ?", id);
        }
        jdbc.update("DELETE FROM ventas_productos WHERE sucursal_id = ?", sucursal.getId());
        jdbc.update("DELETE FROM movimientos_financieros WHERE sucursal_id = ?", sucursal.getId());
        for (UUID id : productosCreados) {
            jdbc.update("DELETE FROM productos_inventario WHERE id = ?", id);
        }
        jdbc.update("DELETE FROM sucursales WHERE id = ?", sucursal.getId());
        productosCreados.clear();
    }

    private ProductoInventario producto(String nombre, int stock) {
        ProductoInventario producto = new ProductoInventario();
        producto.setNombre(nombre);
        producto.setCategoria("Prueba");
        producto.setPrecio(new BigDecimal("10.00"));
        producto.setStock(stock);
        producto.setSucursal(sucursal);
        ProductoInventario guardado = productoRepository.save(producto);
        productosCreados.add(guardado.getId());
        return guardado;
    }

    private VentaProductoRequest venta(UUID... productos) {
        VentaProductoRequest request = new VentaProductoRequest();
        request.setClienteEventual(true);
        request.setClienteNombre("Cliente de prueba");
        request.setSucursalId(sucursal.getId());
        request.setMetodoPago("Tarjeta");
        List<VentaProductoDetalleRequest> detalles = new ArrayList<>();
        for (UUID id : productos) {
            VentaProductoDetalleRequest detalle = new VentaProductoDetalleRequest();
            detalle.setProductoId(id);
            detalle.setCantidad(1);
            detalles.add(detalle);
        }
        request.setDetalles(detalles);
        return request;
    }

    private static UsernamePasswordAuthenticationToken vendedor() {
        return new UsernamePasswordAuthenticationToken("vendedor-it@ejemplo.com", null);
    }

    /** Lanza todas las tareas a la vez (cerrojo de salida) y devuelve cuántas terminaron sin error. */
    private Resultado ejecutarEnParalelo(int hilos, Callable<Void> tarea) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(hilos);
        CountDownLatch listos = new CountDownLatch(hilos);
        CountDownLatch salida = new CountDownLatch(1);
        AtomicInteger exitos = new AtomicInteger();
        AtomicInteger sinStock = new AtomicInteger();
        List<String> otrosErrores = new ArrayList<>();
        List<Future<?>> futuros = new ArrayList<>();
        for (int i = 0; i < hilos; i++) {
            futuros.add(pool.submit(() -> {
                listos.countDown();
                salida.await();
                try {
                    tarea.call();
                    exitos.incrementAndGet();
                } catch (ReglaNegocioException e) {
                    sinStock.incrementAndGet();
                } catch (Exception e) {
                    synchronized (otrosErrores) {
                        otrosErrores.add(e.getClass().getSimpleName() + ": " + e.getMessage());
                    }
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
        return new Resultado(exitos.get(), sinStock.get(), otrosErrores);
    }

    private record Resultado(int exitos, int sinStock, List<String> otrosErrores) {
    }

    private int stockActual(UUID productoId) {
        return jdbc.queryForObject("SELECT stock FROM productos_inventario WHERE id = ?", Integer.class, productoId);
    }

    private int unidadesVendidas(UUID productoId) {
        Integer total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(cantidad), 0) FROM detalle_ventas_productos WHERE producto_id = ?",
                Integer.class, productoId);
        return total == null ? 0 : total;
    }

    @RepeatedTest(3)
    void ventasSimultaneasNuncaVendenMasUnidadesDeLasQueHay() throws Exception {
        ProductoInventario producto = producto("Proteína " + UUID.randomUUID(), 5);

        Resultado resultado = ejecutarEnParalelo(12, () -> {
            ventaProductoService.vender(venta(producto.getId()), vendedor());
            return null;
        });

        assertThat(resultado.otrosErrores()).as("errores inesperados").isEmpty();
        assertThat(resultado.exitos()).as("ventas exitosas con stock 5 y 12 intentos").isEqualTo(5);
        assertThat(resultado.sinStock()).isEqualTo(7);
        assertThat(stockActual(producto.getId())).as("stock final").isZero();
        assertThat(unidadesVendidas(producto.getId())).as("unidades facturadas").isEqualTo(5);
    }

    @Test
    void ventasConLosMismosProductosEnOrdenOpuestoNoSeBloqueanEntreSi() throws Exception {
        ProductoInventario a = producto("Producto A " + UUID.randomUUID(), 30);
        ProductoInventario b = producto("Producto B " + UUID.randomUUID(), 30);
        AtomicInteger contador = new AtomicInteger();

        Resultado resultado = ejecutarEnParalelo(16, () -> {
            boolean alReves = contador.incrementAndGet() % 2 == 0;
            ventaProductoService.vender(
                    alReves ? venta(b.getId(), a.getId()) : venta(a.getId(), b.getId()), vendedor());
            return null;
        });

        assertThat(resultado.otrosErrores()).as("un deadlock aparecería aquí").isEmpty();
        assertThat(resultado.exitos()).isEqualTo(16);
        assertThat(stockActual(a.getId())).isEqualTo(14);
        assertThat(stockActual(b.getId())).isEqualTo(14);
    }
}
