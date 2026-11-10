package ni.edu.uam.SpartanGymAPI.repositories;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import ni.edu.uam.SpartanGymAPI.models.ProductoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductoInventarioRepository extends JpaRepository<ProductoInventario, UUID> {

    /**
     * Lee el producto bloqueando su fila (SELECT ... FOR UPDATE) hasta que termine la transaccion.
     * Sin el bloqueo, dos ventas simultaneas leian el mismo stock y las dos lo descontaban a
     * partir de ese valor: se facturaban mas unidades de las que existian.
     * El timeout evita que una venta se quede colgada si otra transaccion no suelta la fila.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @Query("select p from ProductoInventario p where p.id = :id")
    Optional<ProductoInventario> findByIdForUpdate(@Param("id") UUID id);
}
