package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.FacturaDetalleResponse;
import ni.edu.uam.SpartanGymAPI.dto.VentaProductoDetalleRequest;
import ni.edu.uam.SpartanGymAPI.dto.VentaProductoRequest;
import ni.edu.uam.SpartanGymAPI.dto.VentaProductoResponse;
import ni.edu.uam.SpartanGymAPI.models.MovimientoFinanciero;
import ni.edu.uam.SpartanGymAPI.models.ProductoInventario;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Sucursal;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.models.VentaProducto;
import ni.edu.uam.SpartanGymAPI.models.VentaProductoDetalle;
import ni.edu.uam.SpartanGymAPI.repositories.MovimientoFinancieroRepository;
import ni.edu.uam.SpartanGymAPI.repositories.ProductoInventarioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SucursalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.VentaProductoRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VentaProductoService {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    private final VentaProductoRepository ventaRepository;
    private final ProductoInventarioRepository productoRepository;
    private final SocioRepository socioRepository;
    private final SucursalRepository sucursalRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoFinancieroRepository movimientoRepository;
    private final ConfiguracionAppService configuracionAppService;

    @Transactional(readOnly = true)
    public List<VentaProductoResponse> listar() {
        return ventaRepository.findAllByOrderByFechaCreacionDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VentaProductoResponse obtener(UUID id) {
        return ventaRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
    }

    @Transactional
    public VentaProductoResponse vender(VentaProductoRequest request, Authentication auth) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            throw new RuntimeException("Agrega al menos un producto a la venta");
        }
        if (request.getSucursalId() == null) {
            throw new RuntimeException("Selecciona una sucursal para facturar");
        }

        boolean clienteEventual = Boolean.TRUE.equals(request.getClienteEventual());
        if (!clienteEventual && request.getSocioId() == null) {
            throw new RuntimeException("Selecciona un socio o marca la venta como cliente eventual");
        }

        Sucursal sucursal = sucursalRepository.findById(request.getSucursalId())
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));
        Socio socio = clienteEventual || request.getSocioId() == null
                ? null
                : socioRepository.findById(request.getSocioId())
                        .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        Usuario vendedor = obtenerVendedor(auth);

        String clienteNombre = clienteEventual
                ? textoRequerido(request.getClienteNombre(), "Ingresa el nombre del cliente eventual")
                : socio.getNombres() + " " + socio.getApellidos();

        VentaProducto venta = new VentaProducto();
        venta.setNumeroFactura(generarNumeroFactura());
        venta.setClienteEventual(clienteEventual);
        venta.setSocio(socio);
        venta.setSucursal(sucursal);
        venta.setVendedor(vendedor);
        venta.setClienteNombre(clienteNombre);
        venta.setClienteDocumento(limpiarTexto(request.getClienteDocumento()));
        venta.setMetodoPago(textoOpcional(request.getMetodoPago(), "Efectivo"));
        venta.setObservaciones(limpiarTexto(request.getObservaciones()));
        venta.setFechaCreacion(LocalDateTime.now());

        BigDecimal subtotal = BigDecimal.ZERO;
        for (VentaProductoDetalleRequest detalleRequest : request.getDetalles()) {
            ProductoInventario producto = productoRepository.findById(detalleRequest.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            int cantidad = detalleRequest.getCantidad() == null ? 0 : detalleRequest.getCantidad();
            if (cantidad <= 0) {
                throw new RuntimeException("La cantidad debe ser mayor a cero");
            }
            if (producto.getStock() < cantidad) {
                throw new RuntimeException("Stock insuficiente para " + producto.getNombre());
            }

            producto.setStock(producto.getStock() - cantidad);
            productoRepository.save(producto);

            BigDecimal totalLinea = producto.getPrecio().multiply(BigDecimal.valueOf(cantidad));
            VentaProductoDetalle detalle = new VentaProductoDetalle();
            detalle.setVenta(venta);
            detalle.setProducto(producto);
            detalle.setProductoNombre(producto.getNombre());
            detalle.setCantidad(cantidad);
            detalle.setPrecioUnitario(producto.getPrecio());
            detalle.setTotalLinea(totalLinea);
            venta.getDetalles().add(detalle);
            subtotal = subtotal.add(totalLinea);
        }

        BigDecimal impuesto = subtotal.multiply(obtenerTasaImpuesto())
                .divide(CIEN, 2, RoundingMode.HALF_UP);
        venta.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        venta.setImpuesto(impuesto);
        venta.setTotal(subtotal.add(impuesto).setScale(2, RoundingMode.HALF_UP));
        aplicarPagoEfectivo(venta, request);

        VentaProducto ventaGuardada = ventaRepository.save(venta);
        registrarMovimiento(ventaGuardada, auth);
        return toResponse(ventaGuardada);
    }

    // Compra desde la app: el socio (del token) reserva un producto de su sucursal para
    // retirarlo en recepcion. Reutiliza toda la logica de venta (stock, impuesto, factura).
    @Transactional
    public VentaProductoResponse comprarComoSocio(VentaProductoDetalleRequest detalle, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("Usuario no autenticado");
        }
        Usuario usuario = usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Socio socio = socioRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Perfil de socio no encontrado"));
        if (socio.getSucursal() == null) {
            throw new RuntimeException("Tu perfil no tiene una sucursal asignada. Acércate a recepción.");
        }
        if (detalle == null || detalle.getProductoId() == null) {
            throw new RuntimeException("Selecciona un producto para comprar");
        }

        VentaProductoRequest request = new VentaProductoRequest();
        request.setClienteEventual(false);
        request.setSocioId(socio.getUsuarioId());
        request.setSucursalId(socio.getSucursal().getId());
        request.setMetodoPago("Pendiente en recepción");
        request.setObservaciones("Compra desde la app - retiro en recepción");
        request.setDetalles(List.of(detalle));

        return vender(request, auth);
    }

    private Usuario obtenerVendedor(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return null;
        }

        return usuarioRepository.findByEmail(auth.getName()).orElse(null);
    }

    private BigDecimal obtenerTasaImpuesto() {
        Map<String, Object> configuracion = configuracionAppService.obtener();
        Object valor = configuracion.get("taxRate");
        try {
            return new BigDecimal(String.valueOf(valor == null ? "0" : valor));
        } catch (NumberFormatException ex) {
            return BigDecimal.ZERO;
        }
    }

    private String obtenerMonedaVenta(VentaProductoRequest request) {
        String monedaRequest = limpiarTexto(request.getMonedaVenta());
        if (monedaRequest != null && !monedaRequest.isBlank()) {
            return monedaRequest.toUpperCase(Locale.ROOT);
        }

        Object moneda = configuracionAppService.obtener().get("currency");
        return moneda == null ? "USD" : String.valueOf(moneda).toUpperCase(Locale.ROOT);
    }

    private void aplicarPagoEfectivo(VentaProducto venta, VentaProductoRequest request) {
        if (!"Efectivo".equalsIgnoreCase(venta.getMetodoPago())) {
            venta.setMonedaPago(null);
            venta.setTipoCambio(null);
            venta.setMontoRecibido(null);
            venta.setMontoRecibidoConvertido(null);
            venta.setCambio(null);
            return;
        }

        String monedaVenta = obtenerMonedaVenta(request);
        String monedaPago = textoOpcional(request.getMonedaPago(), monedaVenta).toUpperCase(Locale.ROOT);
        BigDecimal montoRecibido = request.getMontoRecibido();
        if (montoRecibido == null || montoRecibido.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Ingresa el monto recibido en efectivo");
        }

        BigDecimal tipoCambio = monedaPago.equals(monedaVenta)
                ? BigDecimal.ONE
                : request.getTipoCambio();
        if (tipoCambio == null || tipoCambio.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Ingresa un tipo de cambio valido para pago en efectivo");
        }

        BigDecimal montoConvertido = montoRecibido.multiply(tipoCambio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal cambio = montoConvertido.subtract(venta.getTotal()).setScale(2, RoundingMode.HALF_UP);
        if (cambio.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El monto recibido no cubre el total de la factura");
        }

        venta.setMonedaPago(monedaPago);
        venta.setTipoCambio(tipoCambio.setScale(4, RoundingMode.HALF_UP));
        venta.setMontoRecibido(montoRecibido.setScale(2, RoundingMode.HALF_UP));
        venta.setMontoRecibidoConvertido(montoConvertido);
        venta.setCambio(cambio);
    }

    private void registrarMovimiento(VentaProducto venta, Authentication auth) {
        MovimientoFinanciero movimiento = new MovimientoFinanciero();
        movimiento.setConcepto("Venta de productos " + venta.getNumeroFactura());
        movimiento.setMonto(venta.getTotal());
        movimiento.setTipo("ingreso");
        movimiento.setMetodo(venta.getMetodoPago());
        movimiento.setCategoria("Venta de productos");
        movimiento.setUsuario(auth != null && auth.getName() != null ? auth.getName() : "Sistema");
        movimiento.setSucursal(venta.getSucursal());
        movimiento.setFechaTransaccion(venta.getFechaCreacion());
        movimientoRepository.save(movimiento);
    }

    private String generarNumeroFactura() {
        String fecha = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss", Locale.ROOT).format(LocalDateTime.now());
        return "FAC-" + fecha + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
    }

    private String textoRequerido(String valor, String mensaje) {
        String limpio = limpiarTexto(valor);
        if (limpio == null || limpio.isBlank()) {
            throw new RuntimeException(mensaje);
        }
        return limpio;
    }

    private String textoOpcional(String valor, String respaldo) {
        String limpio = limpiarTexto(valor);
        return limpio == null || limpio.isBlank() ? respaldo : limpio;
    }

    private String limpiarTexto(String valor) {
        return valor == null ? null : valor.trim();
    }

    private VentaProductoResponse toResponse(VentaProducto venta) {
        Socio socio = venta.getSocio();
        Usuario vendedor = venta.getVendedor();

        return VentaProductoResponse.builder()
                .id(venta.getId())
                .numeroFactura(venta.getNumeroFactura())
                .clienteEventual(venta.getClienteEventual())
                .socioId(socio != null ? socio.getUsuarioId() : null)
                .socio(socio != null ? socio.getNombres() + " " + socio.getApellidos() : null)
                .sucursalId(venta.getSucursal().getId())
                .sucursal(venta.getSucursal().getNombre())
                .vendedorId(vendedor != null ? vendedor.getId() : null)
                .vendedor(vendedor != null ? vendedor.getEmail() : null)
                .clienteNombre(venta.getClienteNombre())
                .clienteDocumento(venta.getClienteDocumento())
                .metodoPago(venta.getMetodoPago())
                .monedaPago(venta.getMonedaPago())
                .tipoCambio(venta.getTipoCambio())
                .montoRecibido(venta.getMontoRecibido())
                .montoRecibidoConvertido(venta.getMontoRecibidoConvertido())
                .cambio(venta.getCambio())
                .subtotal(venta.getSubtotal())
                .impuesto(venta.getImpuesto())
                .total(venta.getTotal())
                .observaciones(venta.getObservaciones())
                .fechaCreacion(venta.getFechaCreacion())
                .detalles(venta.getDetalles().stream().map(this::detalleResponse).toList())
                .build();
    }

    private FacturaDetalleResponse detalleResponse(VentaProductoDetalle detalle) {
        return FacturaDetalleResponse.builder()
                .id(detalle.getId())
                .productoId(detalle.getProducto().getId())
                .productoNombre(detalle.getProductoNombre())
                .cantidad(detalle.getCantidad())
                .precioUnitario(detalle.getPrecioUnitario())
                .totalLinea(detalle.getTotalLinea())
                .build();
    }
}
