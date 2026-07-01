package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.SucursalRequest;
import ni.edu.uam.SpartanGymAPI.models.Sucursal;
import ni.edu.uam.SpartanGymAPI.repositories.SucursalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sucursales")
@RequiredArgsConstructor
public class SucursalController {
    private final SucursalRepository repository;

    @GetMapping
    public ResponseEntity<List<Sucursal>> listar() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Sucursal> crear(@RequestBody SucursalRequest request) {
        Sucursal sucursal = new Sucursal();
        aplicarRequest(sucursal, request);
        return ResponseEntity.ok(repository.save(sucursal));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Sucursal> actualizar(@PathVariable UUID id, @RequestBody SucursalRequest request) {
        Sucursal sucursal = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));
        aplicarRequest(sucursal, request);
        return ResponseEntity.ok(repository.save(sucursal));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void aplicarRequest(Sucursal sucursal, SucursalRequest request) {
        sucursal.setNombre(request.getNombre());
        sucursal.setUbicacion(request.getUbicacion());
        sucursal.setTelefono(request.getTelefono());
        sucursal.setCapacidad(request.getCapacidad());
        sucursal.setHorarioApertura(request.getHorarioApertura());
        sucursal.setHorarioCierre(request.getHorarioCierre());
        sucursal.setEstado(request.getEstado() == null || request.getEstado().isBlank() ? "Operativa" : request.getEstado());
    }
}
