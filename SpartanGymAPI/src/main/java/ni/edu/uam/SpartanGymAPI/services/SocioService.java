package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.EstadoSocioResponse;
import ni.edu.uam.SpartanGymAPI.dto.SocioResponse;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SocioService {

    private final SocioRepository socioRepository;
    private final MembresiaSocioRepository membresiaRepository;

    @Transactional(readOnly = true)
    public List<SocioResponse> listarSocios() {
        return socioRepository.findAll().stream()
                .map(this::mapearSocio)
                .toList();
    }

    public EstadoSocioResponse consultarEstado(UUID socioId) {
        Socio socio = socioRepository.findById(socioId)
                .orElseThrow(() -> new RuntimeException("Error: Socio no encontrado"));

        EstadoSocioResponse response = new EstadoSocioResponse();
        response.setNombres(socio.getNombres());
        response.setApellidos(socio.getApellidos());
        response.setEstadoAcceso(socio.getEstadoAcceso());

        // Buscamos si tiene alguna membresía Activa
        Optional<MembresiaSocio> membresiaActiva = membresiaRepository.findBySocioUsuarioIdAndEstado(socioId, "Activa");

        if (membresiaActiva.isPresent()) {
            response.setTieneMembresiaActiva(true);
            response.setTipoMembresia(membresiaActiva.get().getTipoMembresia().getNombre());
            response.setFechaVencimiento(membresiaActiva.get().getFechaVencimiento());
        } else {
            response.setTieneMembresiaActiva(false);
            response.setTipoMembresia("Ninguna / Vencida");
            response.setFechaVencimiento(null);
        }

        return response;
    }

    private SocioResponse mapearSocio(Socio socio) {
        Optional<MembresiaSocio> membresiaActiva = membresiaRepository
                .findBySocioUsuarioIdAndEstado(socio.getUsuarioId(), "Activa");

        return SocioResponse.builder()
                .id(socio.getUsuarioId())
                .nombres(socio.getNombres())
                .apellidos(socio.getApellidos())
                .email(socio.getUsuario().getEmail())
                .telefono(socio.getTelefono())
                .sucursalId(socio.getSucursal() != null ? socio.getSucursal().getId() : null)
                .sucursal(socio.getSucursal() != null ? socio.getSucursal().getNombre() : null)
                .estadoAcceso(socio.getEstadoAcceso())
                .tipoMembresia(membresiaActiva.map(m -> m.getTipoMembresia().getNombre()).orElse("Sin membresia"))
                .estadoMembresia(membresiaActiva.map(MembresiaSocio::getEstado).orElse("Inactiva"))
                .fechaVencimiento(membresiaActiva.map(MembresiaSocio::getFechaVencimiento).orElse(null))
                .build();
    }
}
