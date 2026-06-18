package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.ReporteGeneradoResponse;
import ni.edu.uam.SpartanGymAPI.dto.ReporteResumenResponse;
import ni.edu.uam.SpartanGymAPI.repositories.AsistenciaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.PagoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private static final Map<String, String> TITULOS = Map.of(
            "fin", "Reporte Financiero Consolidado",
            "soc", "Análisis de Socios y Retención",
            "inv", "Auditoría de Inventario y Stock",
            "asi", "Control de Asistencia y Horarios"
    );

    private final SocioRepository socioRepository;
    private final MembresiaSocioRepository membresiaSocioRepository;
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;

    public ReporteResumenResponse obtenerResumen() {
        long totalSocios = socioRepository.count();
        long membresiasActivas = membresiaSocioRepository.countByEstado("Activa");
        long asistencias = asistenciaRepository.count();
        BigDecimal ingresos = pagoRepository.sumMontoTotal();

        double tasaRetencion = totalSocios == 0 ? 0 : (membresiasActivas * 100.0) / totalSocios;
        double margenNeto = ingresos.compareTo(BigDecimal.ZERO) == 0 ? 0 : 82.4;

        return ReporteResumenResponse.builder()
                .totalSocios(totalSocios)
                .membresiasActivas(membresiasActivas)
                .asistenciasRegistradas(asistencias)
                .ingresosTotales(ingresos)
                .tasaRetencion(redondear(tasaRetencion))
                .margenNeto(margenNeto)
                .build();
    }

    public ReporteGeneradoResponse generar(String tipo) {
        String tipoNormalizado = tipo == null || tipo.isBlank() ? "fin" : tipo.toLowerCase(Locale.ROOT);
        String titulo = TITULOS.getOrDefault(tipoNormalizado, "Reporte Operativo Spartan Gym");

        return ReporteGeneradoResponse.builder()
                .id("REP-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT))
                .titulo(titulo + " (Generado)")
                .tipo(tipoNormalizado)
                .formato("PDF")
                .fecha(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm", new Locale("es", "ES"))))
                .tamano("1.5 MB")
                .build();
    }

    private double redondear(double valor) {
        return BigDecimal.valueOf(valor).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
