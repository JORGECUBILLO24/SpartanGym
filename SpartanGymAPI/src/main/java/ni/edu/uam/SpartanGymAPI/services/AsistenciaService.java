package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.AsistenciaRequest;
import ni.edu.uam.SpartanGymAPI.models.Asistencia;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.repositories.AsistenciaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AsistenciaService {

    private final AsistenciaRepository asistenciaRepository;
    private final SocioRepository socioRepository;

    @Transactional
    public Asistencia registrarEntrada(AsistenciaRequest request) {
        // 1. Buscamos al socio
        Socio socio = socioRepository.findById(request.getIdSocio())
                .orElseThrow(() -> new RuntimeException("Error: Socio no encontrado."));

        // --- VALIDACIÓN ESTRICTA DE ACCESO ---
        // Si el estado es nulo, 'Inactivo' o 'Suspendido', bloqueamos la entrada
        if (socio.getEstadoAcceso() == null || !socio.getEstadoAcceso().equalsIgnoreCase("Activo")) {
            throw new RuntimeException("Acceso denegado: El estado actual del socio es '"
                    + (socio.getEstadoAcceso() != null ? socio.getEstadoAcceso() : "Desconocido") + "'. Por favor, pase a recepción.");
        }
        // --------------------------------------

        // 2. Si pasa la validación, creamos el registro de asistencia
        Asistencia asistencia = new Asistencia();
        asistencia.setSocio(socio);
        asistencia.setFechaHora(LocalDateTime.now());

        // 3. Lo guardamos en la base de datos
        return asistenciaRepository.save(asistencia);
    }

    public List<Asistencia> obtenerHistorial(UUID socioId) {
        return asistenciaRepository.findBySocioIdOrderByFechaHoraDesc(socioId);
    }
}