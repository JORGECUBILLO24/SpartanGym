package ni.edu.uam.SpartanGymAPI.repositories;

import ni.edu.uam.SpartanGymAPI.models.VentaProducto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VentaProductoRepository extends JpaRepository<VentaProducto, UUID> {
    List<VentaProducto> findAllByOrderByFechaCreacionDesc();
}
