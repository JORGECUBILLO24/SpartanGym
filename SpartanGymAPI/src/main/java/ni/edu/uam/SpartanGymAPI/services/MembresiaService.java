package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.CompraMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.dto.TipoMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MembresiaService {

    private final SocioRepository socioRepository;
    private final TipoMembresiaRepository tipoMembresiaRepository;
    private final PagoRepository pagoRepository;
    private final MembresiaSocioRepository membresiaSocioRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<TipoMembresia> listarTipos() {
        return tipoMembresiaRepository.findAll();
    }

    @Transactional
    public TipoMembresia crearTipo(TipoMembresiaRequest request) {
        TipoMembresia tipo = new TipoMembresia();
        tipo.setNombre(request.getNombre());
        tipo.setDuracionDias(request.getDuracionDias());
        tipo.setPrecio(request.getPrecio());
        return tipoMembresiaRepository.save(tipo);
    }

    @Transactional
    public void eliminarTipo(Integer id) {
        tipoMembresiaRepository.deleteById(id);
    }

    @Transactional
    public MembresiaSocio comprarMembresia(String emailSocio, CompraMembresiaRequest request) {

        // 1. Identificar al usuario a partir del email extraído de su token
        Usuario usuario = usuarioRepository.findByEmail(emailSocio)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en el sistema"));

        Socio socio = socioRepository.findById(usuario.getId())
                .orElseThrow(() -> new RuntimeException("El perfil de socio no existe"));

        // 2. Buscar el catálogo de membresía seleccionado
        TipoMembresia tipo = tipoMembresiaRepository.findById(request.getTipoMembresiaId())
                .orElseThrow(() -> new RuntimeException("Tipo de membresía inválido"));

        // 3. Regla de Negocio: Prevenir compras si ya tiene una activa (Evita romper el Index de BD)
        Optional<MembresiaSocio> membresiaActiva = membresiaSocioRepository
                .findBySocioUsuarioIdAndEstado(socio.getUsuarioId(), "Activa");

        if (membresiaActiva.isPresent()) {
            throw new RuntimeException("Error: Ya posees una membresía Activa. Espera a que caduque para renovar.");
        }

        // 4. Registrar el pago en la tabla inmutable
        Pago pago = new Pago();
        pago.setSocio(socio);
        pago.setMonto(tipo.getPrecio()); // El precio es el oficial de la base de datos
        pago.setMetodoPago(request.getMetodoPago());
        pago = pagoRepository.save(pago);

        // 5. Crear y calcular la nueva membresía
        MembresiaSocio nuevaMembresia = new MembresiaSocio();
        nuevaMembresia.setSocio(socio);
        nuevaMembresia.setTipoMembresia(tipo);
        nuevaMembresia.setPago(pago);
        nuevaMembresia.setFechaInicio(LocalDate.now());

        // Las fechas en Java se calculan fácilmente sumando los días que indica el tipo de membresía
        nuevaMembresia.setFechaVencimiento(LocalDate.now().plusDays(tipo.getDuracionDias()));
        nuevaMembresia.setEstado("Activa");

        return membresiaSocioRepository.save(nuevaMembresia);
    }
}
