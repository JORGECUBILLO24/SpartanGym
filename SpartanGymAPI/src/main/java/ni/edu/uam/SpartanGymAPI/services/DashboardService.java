package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.DashboardResponse;
import ni.edu.uam.SpartanGymAPI.models.ControlBiometrico;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Rutina;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.repositories.ControlBiometricoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RutinaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SocioRepository socioRepository;
    private final MembresiaSocioRepository membresiaRepository;
    private final ControlBiometricoRepository controlRepository;
    private final RutinaRepository rutinaRepository;

    public DashboardResponse obtenerDashboardInicio(UUID socioId) {
        DashboardResponse response = new DashboardResponse();

        // 1. Datos del Socio
        Socio socio = socioRepository.findById(socioId)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        response.setNombreCompleto(socio.getNombres() + " " + socio.getApellidos());
        response.setEstadoAcceso(socio.getEstadoAcceso());

        // 2. Estado de Membresía
        Optional<MembresiaSocio> membresiaActiva = membresiaRepository.findBySocioUsuarioIdAndEstado(socioId, "Activa");
        if (membresiaActiva.isPresent()) {
            response.setTipoMembresia(membresiaActiva.get().getTipoMembresia().getNombre());
            response.setFechaVencimiento(membresiaActiva.get().getFechaVencimiento());
        } else {
            response.setTipoMembresia("Sin Membresía Activa");
        }

        // 3. Último Progreso Físico
        List<ControlBiometrico> historial = controlRepository.findBySocioUsuarioIdOrderByFechaRegistroAsc(socioId);
        if (!historial.isEmpty()) {
            // Obtenemos el último de la lista
            ControlBiometrico ultimo = historial.get(historial.size() - 1);
            response.setUltimoPesoKg(ultimo.getPesoKg());
            response.setNotasMedidas(ultimo.getMedidasNotas());
        }

        // 4. Rutina Asignada (Optimizada en Base de Datos)
        List<Rutina> rutinasDelSocio = rutinaRepository.findBySocioUsuarioIdOrderByFechaAsignacionDesc(socioId);

        if (!rutinasDelSocio.isEmpty()) {
            Rutina r = rutinasDelSocio.get(0); // Tomamos la primera (la más reciente)
            response.setObjetivoRutina(r.getObjetivo());
            response.setNombreEntrenador(r.getEntrenador().getNombres() + " " + r.getEntrenador().getApellidos());
            response.setTotalEjercicios(r.getDetalles().size());
        } else {
            response.setObjetivoRutina("Sin rutina asignada");
            response.setNombreEntrenador("N/A");
            response.setTotalEjercicios(0);
        }

        return response;
    }
}