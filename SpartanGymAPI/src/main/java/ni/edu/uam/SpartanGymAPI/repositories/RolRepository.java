package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RolRepository extends JpaRepository<Rol, Integer> {
    // Spring Data JPA crea la consulta SQL automáticamente solo con leer el nombre del método
    Optional<Rol> findByNombre(String nombre);
}
