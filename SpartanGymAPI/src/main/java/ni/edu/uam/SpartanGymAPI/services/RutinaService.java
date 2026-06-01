package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.RutinaDetalleRequest;
import ni.edu.uam.SpartanGymAPI.dto.RutinaRequest;
import ni.edu.uam.SpartanGymAPI.models.Ejercicio;
import ni.edu.uam.SpartanGymAPI.models.Personal;
import ni.edu.uam.SpartanGymAPI.models.Rutina;
import ni.edu.uam.SpartanGymAPI.models.RutinaDetalle;
import ni.edu.uam.SpartanGymAPI.repositories.EjercicioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.PersonalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RutinaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RutinaService {

    private final RutinaRepository rutinaRepository;
    private final PersonalRepository personalRepository;
    private final EjercicioRepository ejercicioRepository;

    @Transactional
    public Rutina crearRutina(RutinaRequest request) {
        // 1. Validar al entrenador
        Personal entrenador = personalRepository.findById(request.getIdEntrenador())
                .orElseThrow(() -> new RuntimeException("Entrenador no encontrado"));

        // 2. Crear cabecera de la rutina
        Rutina rutina = new Rutina();
        rutina.setNombre(request.getNombre());
        rutina.setDescripcion(request.getDescripcion());
        rutina.setNivel(request.getNivel());
        rutina.setEntrenador(entrenador);

        // 3. Mapear y validar los detalles
        List<RutinaDetalle> detalles = request.getDetalles().stream().map(dto -> {
            Ejercicio ejercicio = ejercicioRepository.findById(dto.getIdEjercicio())
                    .orElseThrow(() -> new RuntimeException("Ejercicio no encontrado con ID: " + dto.getIdEjercicio()));

            RutinaDetalle detalle = new RutinaDetalle();
            detalle.setRutina(rutina); // Relación bidireccional
            detalle.setEjercicio(ejercicio);
            detalle.setSeries(dto.getSeries());
            detalle.setRepeticiones(dto.getRepeticiones());
            detalle.setPesoSugeridoKg(dto.getPesoSugeridoKg());
            detalle.setTiempoDescansoSegundos(dto.getTiempoDescansoSegundos());

            return detalle;
        }).collect(Collectors.toList());

        rutina.setDetalles(detalles);

        // 4. Guardar en base de datos (guarda rutina y detalles por el CascadeType.ALL)
        return rutinaRepository.save(rutina);
    }
}