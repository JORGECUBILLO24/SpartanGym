package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.ControlBiometricoRequest;
import ni.edu.uam.SpartanGymAPI.models.ControlBiometrico;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.repositories.ControlBiometricoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ControlBiometricoService {

    private final ControlBiometricoRepository controlRepository;
    private final SocioRepository socioRepository;

    @Transactional
    public ControlBiometrico registrarProgreso(ControlBiometricoRequest request) {
        Socio socio = socioRepository.findById(request.getIdSocio())
                .orElseThrow(() -> new RuntimeException("Error: Socio no encontrado."));

        ControlBiometrico control = new ControlBiometrico();
        control.setSocio(socio);
        control.setPesoKg(request.getPesoKg());
        control.setMedidasNotas(request.getMedidasNotas());
        control.setFechaRegistro(LocalDateTime.now());

        return controlRepository.save(control);
    }

    public List<ControlBiometrico> obtenerHistorialProgreso(UUID socioId) {
        return controlRepository.findBySocioUsuarioIdOrderByFechaRegistroAsc(socioId);
    }
}