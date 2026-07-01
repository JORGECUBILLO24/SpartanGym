package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SucursalRepository extends JpaRepository<Sucursal, UUID> {
}
