package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.ReporteGeneradoResponse;
import ni.edu.uam.SpartanGymAPI.dto.ReporteResumenResponse;
import ni.edu.uam.SpartanGymAPI.dto.ReporteTablaResponse;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private static final Map<String, String> TITULOS = Map.of(
            "fin", "Reporte Financiero Consolidado",
            "soc", "Analisis de Socios y Retencion",
            "inv", "Auditoria de Inventario y Stock",
            "asi", "Control de Asistencia y Horarios"
    );

    private final SocioRepository socioRepository;
    private final MembresiaSocioRepository membresiaSocioRepository;
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final MovimientoFinancieroRepository movimientoRepository;
    private final ProductoInventarioRepository productoRepository;
    private final SucursalRepository sucursalRepository;
    private final VentaProductoRepository ventaRepository;

    public ReporteResumenResponse obtenerResumen(String sucursalId) {
        long totalSocios = socioRepository.findAll().stream()
                .filter(s -> sucursalId == null || sucursalId.isBlank() || (s.getSucursal() != null && s.getSucursal().getId().toString().equals(sucursalId)))
                .count();
        long membresiasActivas = membresiaSocioRepository.findAll().stream()
                .filter(m -> sucursalId == null || sucursalId.isBlank() || (m.getSocio().getSucursal() != null && m.getSocio().getSucursal().getId().toString().equals(sucursalId)))
                .filter(m -> "Activa".equalsIgnoreCase(m.getEstado()))
                .count();
        long asistencias = asistenciaRepository.findAll().stream()
                .filter(a -> sucursalId == null || sucursalId.isBlank() || (a.getSocio().getSucursal() != null && a.getSocio().getSucursal().getId().toString().equals(sucursalId)))
                .count();

        BigDecimal ingresosPagos = pagoRepository.findAll().stream()
                .filter(p -> sucursalId == null || sucursalId.isBlank() || (p.getSocio().getSucursal() != null && p.getSocio().getSucursal().getId().toString().equals(sucursalId)))
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ingresosMovimientos = sumarMovimientos("ingreso", sucursalId);
        BigDecimal ingresos = ingresosPagos.add(ingresosMovimientos);
        BigDecimal gastos = sumarMovimientos("gasto", sucursalId);

        double tasaRetencion = totalSocios == 0 ? 0 : (membresiasActivas * 100.0) / totalSocios;
        double margenNeto = ingresos.compareTo(BigDecimal.ZERO) == 0
                ? 0
                : ingresos.subtract(gastos).multiply(BigDecimal.valueOf(100))
                        .divide(ingresos, 1, RoundingMode.HALF_UP)
                        .doubleValue();

        return ReporteResumenResponse.builder()
                .totalSocios(totalSocios)
                .membresiasActivas(membresiasActivas)
                .asistenciasRegistradas(asistencias)
                .ingresosTotales(ingresos)
                .tasaRetencion(redondear(tasaRetencion))
                .margenNeto(margenNeto)
                .build();
    }

    public ReporteGeneradoResponse generar(String tipo, String sucursalId) {
        String tipoNormalizado = tipo == null || tipo.isBlank() ? "fin" : tipo.toLowerCase(Locale.ROOT);
        String titulo = TITULOS.getOrDefault(tipoNormalizado, "Reporte Operativo Spartan Gym");
        ReporteContenido contenido = contenido(tipoNormalizado, sucursalId);

        return ReporteGeneradoResponse.builder()
                .id("REP-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT))
                .titulo(titulo + " (Generado)")
                .tipo(tipoNormalizado)
                .formato("PDF")
                .fecha(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm", new Locale("es", "ES"))))
                .tamano("Datos API")
                .headers(contenido.headers())
                .rows(contenido.rows())
                .summary(contenido.summary())
                .detalles(contenido.detalles())
                .build();
    }

    private ReporteContenido contenido(String tipo, String sucursalId) {
        return switch (tipo) {
            case "soc" -> reporteSocios(sucursalId);
            case "inv" -> reporteInventario(sucursalId);
            case "asi" -> reporteAsistencia(sucursalId);
            default -> reporteFinanzas(sucursalId);
        };
    }

    private ReporteContenido reporteFinanzas(String sucursalId) {
        List<Pago> pagos = pagoRepository.findAll().stream()
                .filter(p -> sucursalId == null || sucursalId.isBlank() || (p.getSocio().getSucursal() != null && p.getSocio().getSucursal().getId().toString().equals(sucursalId)))
                .toList();
        BigDecimal pagosMembresia = pagos.stream()
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ingresosMovimientos = sumarMovimientos("ingreso", sucursalId);
        BigDecimal gastos = sumarMovimientos("gasto", sucursalId);
        BigDecimal neto = pagosMembresia.add(ingresosMovimientos).subtract(gastos);

        List<MovimientoFinanciero> movimientos = movimientoRepository.findAll().stream()
                .filter(m -> sucursalId == null || sucursalId.isBlank() || (m.getSucursal() != null && m.getSucursal().getId().toString().equals(sucursalId)))
                .sorted((a, b) -> b.getFechaTransaccion().compareTo(a.getFechaTransaccion()))
                .limit(12)
                .toList();

        return new ReporteContenido(
                List.of("Categoria", "Cantidad", "Total", "Detalle"),
                List.of(
                        List.of("Pagos de membresia", String.valueOf(pagos.size()), money(pagosMembresia), "Pagos registrados en caja"),
                        List.of("Ingresos operativos", String.valueOf(contarMovimientos("ingreso", sucursalId)), money(ingresosMovimientos), "Incluye venta de productos"),
                        List.of("Gastos operativos", String.valueOf(contarMovimientos("gasto", sucursalId)), money(gastos), "Movimientos administrativos"),
                        List.of("Balance neto", "Corte actual", money(neto), "Ingresos menos gastos")
                ),
                List.of(
                        List.of("Ingresos totales", money(pagosMembresia.add(ingresosMovimientos))),
                        List.of("Gastos", money(gastos)),
                        List.of("Balance", money(neto))
                ),
                List.of(ReporteTablaResponse.builder()
                        .titulo("Movimientos recientes")
                        .headers(List.of("Concepto", "Tipo", "Metodo", "Monto", "Sucursal"))
                        .rows(movimientos.stream()
                                .map(m -> List.of(
                                        valor(m.getConcepto()),
                                        valor(m.getTipo()),
                                        valor(m.getMetodo()),
                                        money(m.getMonto()),
                                        m.getSucursal() != null ? m.getSucursal().getNombre() : "Sin sucursal"
                                ))
                                .toList())
                        .build())
        );
    }

    private ReporteContenido reporteSocios(String sucursalId) {
        long totalSocios = socioRepository.findAll().stream()
                .filter(s -> sucursalId == null || sucursalId.isBlank() || (s.getSucursal() != null && s.getSucursal().getId().toString().equals(sucursalId)))
                .count();

        List<MembresiaSocio> membresias = membresiaSocioRepository.findAll().stream()
                .filter(m -> sucursalId == null || sucursalId.isBlank() || (m.getSocio().getSucursal() != null && m.getSocio().getSucursal().getId().toString().equals(sucursalId)))
                .toList();

        long membresiasActivas = membresias.stream().filter(m -> "Activa".equalsIgnoreCase(m.getEstado())).count();
        long sinMembresia = Math.max(totalSocios - membresiasActivas, 0);
        
        long renovadas = membresias.stream().filter(m -> "Renovada".equalsIgnoreCase(m.getEstado())).count();
        long abandonos = membresias.stream().filter(m -> "Vencida".equalsIgnoreCase(m.getEstado()) || "Cancelada".equalsIgnoreCase(m.getEstado())).count();
        
        long asistencias = asistenciaRepository.findAll().stream()
                .filter(a -> sucursalId == null || sucursalId.isBlank() || (a.getSocio().getSucursal() != null && a.getSocio().getSucursal().getId().toString().equals(sucursalId)))
                .count();
        String tasaAsistencia = totalSocios == 0 ? "0%" : redondear((double) asistencias / totalSocios * 100) + "%";

        return new ReporteContenido(
                List.of("Metrica", "Resultado", "Detalle"),
                List.of(
                        List.of("Socios registrados", String.valueOf(totalSocios), "Cuentas tipo socio"),
                        List.of("Membresias activas", String.valueOf(membresiasActivas), "Acceso activo"),
                        List.of("Sin membresia activa", String.valueOf(sinMembresia), "Requieren seguimiento")
                ),
                List.of(
                        List.of("Total socios", String.valueOf(totalSocios)),
                        List.of("Activos", String.valueOf(membresiasActivas)),
                        List.of("Retencion", redondear(totalSocios == 0 ? 0 : membresiasActivas * 100.0 / totalSocios) + "%")
                ),
                List.of(ReporteTablaResponse.builder()
                        .titulo("Detalles de Socios y Retencion")
                        .headers(List.of("Metrica", "Cantidad / Valor", "Descripcion"))
                        .rows(List.of(
                                List.of("Altas de nuevos socios", String.valueOf(totalSocios), "Socios inscritos historicamente"),
                                List.of("Membresias renovadas", String.valueOf(renovadas), "Membresias procesadas como renovacion"),
                                List.of("Abandonos", String.valueOf(abandonos), "Suma de membresias vencidas o canceladas"),
                                List.of("Tasas de asistencia", tasaAsistencia, "Promedio de check-ins vs Total de socios")
                        ))
                        .build())
        );
    }

    private ReporteContenido reporteInventario(String sucursalId) {
        List<ProductoInventario> productos = productoRepository.findAll().stream()
                .filter(p -> sucursalId == null || sucursalId.isBlank() || (p.getSucursal() != null && p.getSucursal().getId().toString().equals(sucursalId)))
                .toList();

        long alertas = productos.stream().filter(p -> p.getStock() <= 5).count();
        BigDecimal valorInventario = productos.stream()
                .map(p -> p.getPrecio().multiply(BigDecimal.valueOf(p.getStock())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<VentaProducto> ventas = ventaRepository.findAllByOrderByFechaCreacionDesc().stream()
                .filter(v -> sucursalId == null || sucursalId.isBlank() || (v.getSucursal() != null && v.getSucursal().getId().toString().equals(sucursalId)))
                .toList();

        return new ReporteContenido(
                List.of("Producto", "Categoria", "Stock", "Precio", "Sucursal"),
                productos.stream()
                        .map(p -> List.of(
                                valor(p.getNombre()),
                                valor(p.getCategoria()),
                                String.valueOf(p.getStock()),
                                money(p.getPrecio()),
                                p.getSucursal() != null ? p.getSucursal().getNombre() : "Sin sucursal"
                        ))
                        .toList(),
                List.of(
                        List.of("Productos", String.valueOf(productos.size())),
                        List.of("Alertas stock", String.valueOf(alertas)),
                        List.of("Valor inventario", money(valorInventario)),
                        List.of("Facturas producto", String.valueOf(ventas.size()))
                ),
                List.of(ReporteTablaResponse.builder()
                        .titulo("Ventas de productos recientes")
                        .headers(List.of("Factura", "Cliente", "Sucursal", "Total"))
                        .rows(ventas.stream()
                                .limit(12)
                                .map(v -> List.of(
                                        valor(v.getNumeroFactura()),
                                        valor(v.getClienteNombre()),
                                        v.getSucursal() != null ? v.getSucursal().getNombre() : "Sin sucursal",
                                        money(v.getTotal())
                                ))
                                .toList())
                        .build())
        );
    }

    private ReporteContenido reporteAsistencia(String sucursalId) {
        List<Asistencia> asistenciasList = asistenciaRepository.findAll();
        if (sucursalId != null && !sucursalId.isBlank()) {
            asistenciasList = asistenciasList.stream()
                    .filter(a -> a.getSocio().getSucursal() != null && a.getSocio().getSucursal().getId().toString().equals(sucursalId))
                    .toList();
        }
        
        long asistenciasCount = asistenciasList.size();

        // Calcular hora pico
        String horaPicoStr = "N/A";
        if (!asistenciasList.isEmpty()) {
            Map<Integer, Long> conteoHoras = asistenciasList.stream()
                    .collect(Collectors.groupingBy(a -> a.getFechaHora().getHour(), Collectors.counting()));
            int horaPico = conteoHoras.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(0);
            horaPicoStr = String.format("%02d:00 hrs", horaPico);
        }

        long totalSocios = socioRepository.findAll().stream()
                .filter(s -> sucursalId == null || sucursalId.isBlank() || (s.getSucursal() != null && s.getSucursal().getId().toString().equals(sucursalId)))
                .count();

        long membresiasActivas = membresiaSocioRepository.findAll().stream()
                .filter(m -> sucursalId == null || sucursalId.isBlank() || (m.getSocio().getSucursal() != null && m.getSocio().getSucursal().getId().toString().equals(sucursalId)))
                .filter(m -> "Activa".equalsIgnoreCase(m.getEstado()))
                .count();

        return new ReporteContenido(
                List.of("Metrica", "Resultado", "Detalle"),
                List.of(
                        List.of("Asistencias registradas", String.valueOf(asistenciasCount), "Check-ins guardados"),
                        List.of("Socios registrados", String.valueOf(totalSocios), "Base actual"),
                        List.of("Membresias activas", String.valueOf(membresiasActivas), "Acceso habilitado"),
                        List.of("Hora pico de ingresos", horaPicoStr, "Hora con más check-ins registrados")
                ),
                List.of(
                        List.of("Check-ins", String.valueOf(asistenciasCount)),
                        List.of("Socios", String.valueOf(totalSocios))
                ),
                List.of()
        );
    }

    private BigDecimal sumarMovimientos(String tipo, String sucursalId) {
        return movimientoRepository.findAll().stream()
                .filter(m -> tipo.equalsIgnoreCase(m.getTipo()))
                .filter(m -> sucursalId == null || sucursalId.isBlank() || (m.getSucursal() != null && m.getSucursal().getId().toString().equals(sucursalId)))
                .map(MovimientoFinanciero::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private long contarMovimientos(String tipo, String sucursalId) {
        return movimientoRepository.findAll().stream()
                .filter(m -> tipo.equalsIgnoreCase(m.getTipo()))
                .filter(m -> sucursalId == null || sucursalId.isBlank() || (m.getSucursal() != null && m.getSucursal().getId().toString().equals(sucursalId)))
                .count();
    }

    private double redondear(double valor) {
        return BigDecimal.valueOf(valor).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private String money(BigDecimal valor) {
        return "$" + (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }

    private String valor(String texto) {
        return texto == null || texto.isBlank() ? "N/A" : texto;
    }

    private record ReporteContenido(
            List<String> headers,
            List<List<String>> rows,
            List<List<String>> summary,
            List<ReporteTablaResponse> detalles
    ) {
    }
}
