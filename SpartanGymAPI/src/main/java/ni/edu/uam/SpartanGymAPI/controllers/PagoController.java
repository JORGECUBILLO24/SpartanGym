package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.CompraMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.dto.FacturaMembresiaResponse;
import ni.edu.uam.SpartanGymAPI.dto.PagoRequest;
import ni.edu.uam.SpartanGymAPI.services.PagoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    // Cobro hecho en mostrador a nombre de un socio: lo registra el personal, no el socio
    // (el socio tiene /mi-membresia, que saca su identidad del token).
    @PostMapping("/renovar")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    public ResponseEntity<FacturaMembresiaResponse> registrarPago(@RequestBody PagoRequest request) {
        return ResponseEntity.ok(pagoService.registrarPagoYMembresia(request));
    }

    // El socio paga/renueva su propia membresia desde la app (el socio sale del token).
    @PostMapping("/mi-membresia")
    @PreAuthorize("hasAuthority('ROLE_SOCIO')")
    public ResponseEntity<FacturaMembresiaResponse> renovarPropia(@RequestBody CompraMembresiaRequest request, Authentication auth) {
        return ResponseEntity.ok(pagoService.renovarMembresiaSocio(auth.getName(), request.getTipoMembresiaId(), request.getMetodoPago()));
    }
}