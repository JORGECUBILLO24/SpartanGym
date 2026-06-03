package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.models.Ejercicio;
import ni.edu.uam.SpartanGymAPI.models.GrupoMuscular;
import ni.edu.uam.SpartanGymAPI.services.CatalogoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogo")
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoService catalogoService;

    // Endpoints para Grupos Musculares
    @PostMapping("/grupos-musculares")
    public ResponseEntity<GrupoMuscular> crearGrupo(@RequestBody GrupoMuscular grupo) {
        return ResponseEntity.ok(catalogoService.crearGrupoMuscular(grupo));
    }

    @GetMapping("/grupos-musculares")
    public ResponseEntity<List<GrupoMuscular>> listarGrupos() {
        return ResponseEntity.ok(catalogoService.obtenerTodosLosGrupos());
    }

    // Endpoints para Ejercicios
    @PostMapping("/ejercicios")
    public ResponseEntity<Ejercicio> crearEjercicio(@RequestBody Ejercicio ejercicio) {
        return ResponseEntity.ok(catalogoService.crearEjercicio(ejercicio));
    }

    @GetMapping("/ejercicios")
    public ResponseEntity<List<Ejercicio>> listarEjercicios() {
        return ResponseEntity.ok(catalogoService.obtenerTodosLosEjercicios());
    }
}