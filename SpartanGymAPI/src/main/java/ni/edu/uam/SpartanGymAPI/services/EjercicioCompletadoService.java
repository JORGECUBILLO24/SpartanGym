package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.MarcarEjercicioRequest;
import ni.edu.uam.SpartanGymAPI.dto.ProgresoSemana;
import ni.edu.uam.SpartanGymAPI.models.EjercicioCompletado;
import ni.edu.uam.SpartanGymAPI.models.Rutina;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.EjercicioCompletadoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RutinaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import ni.edu.uam.SpartanGymAPI.util.RangoSemana;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EjercicioCompletadoService {

    private final RutinaRepository rutinaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;
    private final EjercicioCompletadoRepository ejercicioCompletadoRepository;

    @Transactional(readOnly = true)
    public ProgresoSemana calcularProgreso(Rutina rutina) {
        RangoSemana semana = RangoSemana.deLunesADomingo(LocalDate.now());

        Set<Long> completados = ejercicioCompletadoRepository
                .findByRutinaIdAndFechaBetween(rutina.getId(), semana.inicio(), semana.fin())
                .stream()
                .map(EjercicioCompletado::getEjercicioId)
                .collect(Collectors.toSet());

        int planificados = rutina.getDetalles().size();
        double progreso = planificados == 0 ? 0.0 : (double) completados.size() / planificados;

        return new ProgresoSemana(planificados, completados.size(), progreso, completados);
    }

    @Transactional
    public void marcarCompletado(String emailSocio, UUID rutinaId, Long ejercicioId, MarcarEjercicioRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(emailSocio)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Socio socio = socioRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Perfil de socio no encontrado"));

        Rutina rutina = rutinaRepository.findById(rutinaId)
                .orElseThrow(() -> new RuntimeException("Rutina no encontrada"));

        if (!rutina.getSocio().getUsuarioId().equals(socio.getUsuarioId())) {
            throw new AccessDeniedException("Esta rutina no pertenece al socio autenticado.");
        }

        boolean perteneceARutina = rutina.getDetalles().stream()
                .anyMatch(detalle -> detalle.getEjercicio().getId().equals(ejercicioId));
        if (!perteneceARutina) {
            throw new RuntimeException("Ese ejercicio no pertenece a esta rutina.");
        }

        LocalDate fecha = request.getFecha() != null ? request.getFecha() : LocalDate.now();

        if (Boolean.TRUE.equals(request.getCompletado())) {
            if (!ejercicioCompletadoRepository.existsByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, fecha)) {
                EjercicioCompletado registro = new EjercicioCompletado();
                registro.setRutinaId(rutinaId);
                registro.setEjercicioId(ejercicioId);
                registro.setFecha(fecha);
                ejercicioCompletadoRepository.save(registro);
            }
        } else {
            ejercicioCompletadoRepository.deleteByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, fecha);
        }
    }
}
