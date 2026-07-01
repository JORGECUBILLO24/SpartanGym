package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.FacturaMembresiaResponse;
import ni.edu.uam.SpartanGymAPI.dto.PagoRequest;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Pago;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.TipoMembresia;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.PagoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.TipoMembresiaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PagoService {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    private final SocioRepository socioRepository;
    private final TipoMembresiaRepository tipoMembresiaRepository;
    private final PagoRepository pagoRepository;
    private final MembresiaSocioRepository membresiaSocioRepository;
    private final ConfiguracionAppService configuracionAppService;

    @Transactional
    public FacturaMembresiaResponse registrarPagoYMembresia(PagoRequest request) {
        // 1. Validamos que el socio y la membresía existan
        Socio socio = socioRepository.findById(request.getIdSocio())
                .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        TipoMembresia tipoMembresia = tipoMembresiaRepository.findById(request.getIdTipoMembresia())
                .orElseThrow(() -> new RuntimeException("Tipo de membresía no encontrado"));

        // 2. Apagamos membresías anteriores para no violar el UNIQUE INDEX de SQL.
        //    Usamos saveAndFlush para que el UPDATE (Activa -> Renovada) se ejecute
        //    ANTES del INSERT de la nueva membresía; de lo contrario Hibernate inserta
        //    primero y viola el índice único idx_membresia_activa_unica (una activa por socio).
        Optional<MembresiaSocio> membresiaActiva = membresiaSocioRepository.findBySocioUsuarioIdAndEstado(socio.getUsuarioId(), "Activa");
        if (membresiaActiva.isPresent()) {
            MembresiaSocio vieja = membresiaActiva.get();
            vieja.setEstado("Renovada");
            membresiaSocioRepository.saveAndFlush(vieja);
        }

        // 3. La membresia se cobra al precio del plan (IVA incluido): el socio paga exactamente
        //    el precio y la factura desglosa el impuesto por dentro (subtotal + impuesto = total = precio).
        BigDecimal total = tipoMembresia.getPrecio().setScale(2, RoundingMode.HALF_UP);
        BigDecimal tasa = obtenerTasaImpuesto();
        BigDecimal factor = BigDecimal.ONE.add(tasa.divide(CIEN, 6, RoundingMode.HALF_UP));
        BigDecimal subtotal = total.divide(factor, 2, RoundingMode.HALF_UP);
        BigDecimal impuesto = total.subtract(subtotal).setScale(2, RoundingMode.HALF_UP);

        // 4. Registramos el recibo de Pago con su numero de factura
        Pago pago = new Pago();
        pago.setSocio(socio);
        pago.setMonto(total);
        pago.setMetodoPago(request.getMetodoPago());
        pago.setNumeroFactura(generarNumeroFactura());
        pago.setFechaTransaccion(LocalDateTime.now());
        pago = pagoRepository.save(pago);

        // 5. Creamos la nueva Membresía sumando los días exactos
        MembresiaSocio nuevaMembresia = new MembresiaSocio();
        nuevaMembresia.setSocio(socio);
        nuevaMembresia.setTipoMembresia(tipoMembresia);
        nuevaMembresia.setPago(pago);
        nuevaMembresia.setFechaInicio(LocalDate.now());
        nuevaMembresia.setFechaVencimiento(LocalDate.now().plusDays(tipoMembresia.getDuracionDias()));
        nuevaMembresia.setEstado("Activa");
        MembresiaSocio guardada = membresiaSocioRepository.save(nuevaMembresia);

        // 6. ¡LE ABRIMOS EL TORNIQUETE!
        socio.setEstadoAcceso("Activo");
        socioRepository.save(socio);

        // 7. Devolvemos la factura de la renovacion
        return FacturaMembresiaResponse.builder()
                .id(pago.getId())
                .numeroFactura(pago.getNumeroFactura())
                .socioId(socio.getUsuarioId())
                .socio(socio.getNombres() + " " + socio.getApellidos())
                .tipoMembresia(tipoMembresia.getNombre())
                .subtotal(subtotal)
                .impuesto(impuesto)
                .total(total)
                .metodoPago(pago.getMetodoPago())
                .fechaInicio(guardada.getFechaInicio())
                .fechaVencimiento(guardada.getFechaVencimiento())
                .fechaTransaccion(pago.getFechaTransaccion())
                .build();
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

    private String generarNumeroFactura() {
        String fecha = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss", Locale.ROOT).format(LocalDateTime.now());
        return "MEM-" + fecha + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
    }
}
