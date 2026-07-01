package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.VentaProductoDetalleRequest;
import ni.edu.uam.SpartanGymAPI.dto.VentaProductoRequest;
import ni.edu.uam.SpartanGymAPI.dto.VentaProductoResponse;
import ni.edu.uam.SpartanGymAPI.services.VentaProductoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ventas/productos")
@RequiredArgsConstructor
public class VentaProductoController {
    private final VentaProductoService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    public ResponseEntity<List<VentaProductoResponse>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    public ResponseEntity<VentaProductoResponse> obtener(@PathVariable UUID id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    public ResponseEntity<VentaProductoResponse> vender(@RequestBody VentaProductoRequest request, Authentication auth) {
        return ResponseEntity.ok(service.vender(request, auth));
    }

    // El socio compra/reserva un producto desde la app para retirarlo en recepcion.
    @PostMapping("/mi-compra")
    @PreAuthorize("hasAuthority('ROLE_SOCIO')")
    public ResponseEntity<VentaProductoResponse> comprarComoSocio(@RequestBody VentaProductoDetalleRequest request, Authentication auth) {
        return ResponseEntity.ok(service.comprarComoSocio(request, auth));
    }
}
