package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.ProductoCatalogoResponse;
import ni.edu.uam.SpartanGymAPI.dto.ProductoInventarioRequest;
import ni.edu.uam.SpartanGymAPI.models.ProductoInventario;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Sucursal;
import ni.edu.uam.SpartanGymAPI.repositories.ProductoInventarioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SucursalRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventario")
@RequiredArgsConstructor
public class InventarioController {
    private final ProductoInventarioRepository repository;
    private final SucursalRepository sucursalRepository;
    private final UsuarioRepository usuarioRepository;
    private final SocioRepository socioRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'RECEPCIONISTA')")
    public ResponseEntity<List<ProductoInventario>> listar() {
        return ResponseEntity.ok(repository.findAll());
    }

    // Catalogo visible para el socio (app): productos de su misma sucursal.
    // Si el socio no tiene sucursal asignada, ve todos los productos.
    @GetMapping("/catalogo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProductoCatalogoResponse>> catalogo(Authentication auth) {
        UUID sucursalId = sucursalDelSocio(auth);
        return ResponseEntity.ok(repository.findAll().stream()
                .filter(producto -> sucursalId == null
                        || (producto.getSucursal() != null && sucursalId.equals(producto.getSucursal().getId())))
                .map(this::toCatalogo)
                .toList());
    }

    private UUID sucursalDelSocio(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return usuarioRepository.findByEmail(auth.getName())
                .flatMap(usuario -> socioRepository.findById(usuario.getId()))
                .map(Socio::getSucursal)
                .map(Sucursal::getId)
                .orElse(null);
    }

    private ProductoCatalogoResponse toCatalogo(ProductoInventario producto) {
        return ProductoCatalogoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .categoria(producto.getCategoria())
                .precio(producto.getPrecio())
                .stock(producto.getStock())
                .imagenUrl(producto.getImagenUrl())
                .sucursalId(producto.getSucursal() != null ? producto.getSucursal().getId() : null)
                .sucursal(producto.getSucursal() != null ? producto.getSucursal().getNombre() : null)
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<ProductoInventario> crear(@RequestBody ProductoInventarioRequest request) {
        ProductoInventario producto = new ProductoInventario();
        producto.setNombre(request.getNombre());
        producto.setCategoria(request.getCategoria());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());
        producto.setImagenUrl(request.getImagenUrl());
        producto.setSucursal(obtenerSucursal(request));
        return ResponseEntity.ok(repository.save(producto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<ProductoInventario> actualizar(@PathVariable UUID id, @RequestBody ProductoInventarioRequest request) {
        ProductoInventario producto = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        producto.setNombre(request.getNombre());
        producto.setCategoria(request.getCategoria());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());
        producto.setImagenUrl(request.getImagenUrl());
        producto.setSucursal(obtenerSucursal(request));
        return ResponseEntity.ok(repository.save(producto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Sucursal obtenerSucursal(ProductoInventarioRequest request) {
        if (request.getSucursalId() == null) {
            return null;
        }

        return sucursalRepository.findById(request.getSucursalId())
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));
    }
}
