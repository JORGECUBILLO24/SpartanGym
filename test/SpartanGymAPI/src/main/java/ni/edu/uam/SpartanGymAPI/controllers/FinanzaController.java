package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.MovimientoFinancieroRequest;
import ni.edu.uam.SpartanGymAPI.models.MovimientoFinanciero;
import ni.edu.uam.SpartanGymAPI.repositories.MovimientoFinancieroRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/finanzas")
@RequiredArgsConstructor
public class FinanzaController {
    private final MovimientoFinancieroRepository repository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<List<MovimientoFinanciero>> listar() {
        List<MovimientoFinanciero> movimientos = repository.findAll().stream()
                .sorted(Comparator.comparing(MovimientoFinanciero::getFechaTransaccion).reversed())
                .toList();
        return ResponseEntity.ok(movimientos);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<MovimientoFinanciero> crear(@RequestBody MovimientoFinancieroRequest request, Authentication auth) {
        MovimientoFinanciero movimiento = new MovimientoFinanciero();
        movimiento.setConcepto(request.getConcepto());
        movimiento.setMonto(request.getMonto());
        movimiento.setTipo(request.getTipo());
        movimiento.setMetodo(request.getMetodo());
        movimiento.setCategoria(request.getCategoria());
        movimiento.setUsuario(auth == null ? "Administrador" : auth.getName());
        return ResponseEntity.ok(repository.save(movimiento));
    }
}
