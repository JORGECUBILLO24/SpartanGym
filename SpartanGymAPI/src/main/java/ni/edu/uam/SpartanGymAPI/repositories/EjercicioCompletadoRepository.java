package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.EjercicioCompletado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EjercicioCompletadoRepository extends JpaRepository<EjercicioCompletado, UUID> {

    boolean existsByRutinaIdAndEjercicioIdAndFecha(UUID rutinaId, Long ejercicioId, LocalDate fecha);

    void deleteByRutinaIdAndEjercicioIdAndFecha(UUID rutinaId, Long ejercicioId, LocalDate fecha);

    List<EjercicioCompletado> findByRutinaIdAndFechaBetween(UUID rutinaId, LocalDate inicio, LocalDate fin);
}
