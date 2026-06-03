package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RutinaService {

    private final RutinaRepository rutinaRepository;
    private final PersonalRepository personalRepository;
    private final SocioRepository socioRepository;
    private final EjercicioRepository ejercicioRepository;

    @Transactional
    public Rutina crearRutinaPersonalizada(RutinaRequest request) {
        Personal entrenador = personalRepository.findById(request.getIdEntrenador())
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));

        Socio socio = socioRepository.findById(request.getIdSocio())
                .orElseThrow(() -> new RuntimeException("Socio no encontrado"));

        Rutina rutina = new Rutina();
        rutina.setEntrenador(entrenador);
        rutina.setSocio(socio);
        rutina.setObjetivo(request.getObjetivo());
        rutina.setFechaAsignacion(LocalDateTime.now());

        List<RutinaDetalle> detalles = request.getDetalles().stream().map(dto -> {
            Ejercicio ejercicio = ejercicioRepository.findById(dto.getIdEjercicio())
                    .orElseThrow(() -> new RuntimeException("Ejercicio no encontrado con ID: " + dto.getIdEjercicio()));

            RutinaDetalle detalle = new RutinaDetalle();
            detalle.setRutina(rutina);
            detalle.setEjercicio(ejercicio);
            detalle.setSeries(dto.getSeries());
            detalle.setRepeticiones(dto.getRepeticiones());
            detalle.setPesoSugeridoKg(dto.getPesoSugeridoKg());
            detalle.setTiempoDescansoSegundos(dto.getTiempoDescansoSegundos());

            return detalle;
        }).collect(Collectors.toList());

        rutina.setDetalles(detalles);
        return rutinaRepository.save(rutina);
    }
}