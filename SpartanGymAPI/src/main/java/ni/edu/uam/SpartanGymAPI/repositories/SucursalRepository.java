package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;

public interface SucursalRepository extends JpaRepository<Sucursal, UUID> {
    List<Sucursal> findByEstadoIgnoreCase(String estado);
}
