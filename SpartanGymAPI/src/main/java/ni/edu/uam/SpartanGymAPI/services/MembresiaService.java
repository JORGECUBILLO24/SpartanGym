package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.exceptions.*;
import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.CompraMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.dto.TipoMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MembresiaService {

    private static final Set<String> METODOS_PAGO_VALIDOS = Set.of("Efectivo", "Tarjeta", "Transferencia");

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
        aplicarDatos(tipo, request);
        return tipoMembresiaRepository.save(tipo);
    }

    @Transactional
    public TipoMembresia actualizarTipo(Integer id, TipoMembresiaRequest request) {
        TipoMembresia tipo = tipoMembresiaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan de membresía no encontrado"));
        aplicarDatos(tipo, request);
        return tipoMembresiaRepository.save(tipo);
    }

    private void aplicarDatos(TipoMembresia tipo, TipoMembresiaRequest request) {
        String nombre = request.getNombre() == null ? "" : request.getNombre().trim();
        if (nombre.isEmpty() || nombre.length() > 50) {
            throw new ReglaNegocioException("El nombre del plan debe tener entre 1 y 50 caracteres.");
        }
        if (request.getDuracionDias() == null || request.getDuracionDias() < 1) {
            throw new ReglaNegocioException("La duración debe ser al menos un día.");
        }
        if (request.getPrecio() == null || request.getPrecio().compareTo(BigDecimal.ZERO) < 0 || request.getPrecio().scale() > 2) {
            throw new ReglaNegocioException("El precio debe ser positivo y tener hasta dos decimales.");
        }
        String beneficios = request.getBeneficios() == null ? "" : request.getBeneficios().trim();
        if (beneficios.length() > 2000) {
            throw new ReglaNegocioException("Los beneficios no deben superar 2000 caracteres.");
        }
        tipo.setNombre(nombre);
        tipo.setDuracionDias(request.getDuracionDias());
        tipo.setPrecio(request.getPrecio());
        tipo.setBeneficios(beneficios);
    }

    @Transactional
    public TipoMembresia actualizarImagen(Integer id, String imagenUrl) {
        TipoMembresia tipo = tipoMembresiaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan de membresía no encontrado"));
        tipo.setImagenUrl(ni.edu.uam.SpartanGymAPI.util.FotoPerfilValidator.validar(imagenUrl));
        return tipoMembresiaRepository.save(tipo);
    }

    @Transactional
    public void eliminarTipo(Integer id) {
        tipoMembresiaRepository.deleteById(id);
    }

    @Transactional
    public MembresiaSocio comprarMembresia(String emailSocio, CompraMembresiaRequest request) {

        // 1. Identificar al usuario a partir del email extraído de su token
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(emailSocio)
                .orElseThrow(() -> new NoAutenticadoException("Usuario no encontrado en el sistema"));

        Socio socio = socioRepository.findById(usuario.getId())
                .orElseThrow(() -> new AccesoDenegadoException("El perfil de socio no existe"));

        // 2. Buscar el catálogo de membresía seleccionado
        TipoMembresia tipo = tipoMembresiaRepository.findById(request.getTipoMembresiaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Tipo de membresía inválido"));
        String metodoPago = validarMetodoPago(request.getMetodoPago());

        // 3. Regla de Negocio: Prevenir compras si ya tiene una activa (Evita romper el Index de BD)
        Optional<MembresiaSocio> membresiaActiva = membresiaSocioRepository
                .findBySocioUsuarioIdAndEstado(socio.getUsuarioId(), "Activa");

        if (membresiaActiva.isPresent()) {
            throw new ConflictoException("Error: Ya posees una membresía Activa. Espera a que caduque para renovar.");
        }

        // 4. Registrar el pago en la tabla inmutable
        Pago pago = new Pago();
        pago.setSocio(socio);
        pago.setMonto(tipo.getPrecio()); // El precio es el oficial de la base de datos
        pago.setMetodoPago(metodoPago);
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

    static String validarMetodoPago(String metodoPago) {
        String normalizado = metodoPago == null ? "" : metodoPago.trim();
        return METODOS_PAGO_VALIDOS.stream()
                .filter(metodo -> metodo.equalsIgnoreCase(normalizado))
                .findFirst()
                .orElseThrow(() -> new ReglaNegocioException(
                        "El método de pago debe ser Efectivo, Tarjeta o Transferencia."
                ));
    }
}
