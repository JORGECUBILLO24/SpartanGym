package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.services.ConfiguracionAppService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/configuracion")
@RequiredArgsConstructor
public class ConfiguracionController {

    private static final Set<String> CONFIGURACION_DE_MARCA = Set.of(
            "gymName", "appName", "appLogo", "appLogoNombre",
            "logoPrincipal", "logoPrincipalNombre", "logoAcceso", "logoAccesoNombre",
            "fondoLogin", "accentColor", "accentHoverColor", "accentSoftColor"
    );

    private final ConfiguracionAppService service;

    @GetMapping
    public ResponseEntity<Map<String, Object>> obtener() {
        return ResponseEntity.ok(service.obtener());
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> guardar(
            @RequestBody Map<String, Object> configuracion,
            Authentication authentication
    ) {
        Map<String, Object> actual = service.obtener();
        Map<String, Object> cambios = configuracion == null ? new LinkedHashMap<>() : new LinkedHashMap<>(configuracion);
        boolean puedeEditarMarca = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SUPERADMIN".equals(authority.getAuthority()));

        if (!puedeEditarMarca) {
            CONFIGURACION_DE_MARCA.forEach(clave -> {
                if (actual.containsKey(clave)) {
                    cambios.put(clave, actual.get(clave));
                } else {
                    cambios.remove(clave);
                }
            });
        }

        return ResponseEntity.ok(service.guardar(cambios));
    }
}
