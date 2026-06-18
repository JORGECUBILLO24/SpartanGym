package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.DashboardResponse;
import ni.edu.uam.SpartanGymAPI.services.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/inicio/{socioId}")
    public ResponseEntity<DashboardResponse> obtenerInicio(@PathVariable UUID socioId) {
        return ResponseEntity.ok(dashboardService.obtenerDashboardInicio(socioId));
    }
}