package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.dto.PagoRequest;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Pago;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.TipoMembresia;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.PagoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.TipoMembresiaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final SocioRepository socioRepository;
    private final TipoMembresiaRepository tipoMembresiaRepository;
    private final PagoRepository pagoRepository;
    private final MembresiaSocioRepository membresiaSocioRepository;

    @Transactional
    public MembresiaSocio registrarPagoYMembresia(PagoRequest request) {
        // 1. Validamos que el socio y la membresía existan
        Socio socio = socioRepository.findById(request.getIdSocio())
                .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        TipoMembresia tipoMembresia = tipoMembresiaRepository.findById(request.getIdTipoMembresia())
                .orElseThrow(() -> new RuntimeException("Tipo de membresía no encontrado"));

        // 2. Apagamos membresías anteriores para no violar el UNIQUE INDEX de SQL
        Optional<MembresiaSocio> membresiaActiva = membresiaSocioRepository.findBySocioUsuarioIdAndEstado(socio.getUsuarioId(), "Activa");
        if (membresiaActiva.isPresent()) {
            MembresiaSocio vieja = membresiaActiva.get();
            vieja.setEstado("Renovada");
            membresiaSocioRepository.save(vieja);
        }

        // 3. Registramos el recibo de Pago
        Pago pago = new Pago();
        pago.setSocio(socio);
        pago.setMonto(tipoMembresia.getPrecio());
        pago.setMetodoPago(request.getMetodoPago());
        pago.setFechaTransaccion(LocalDateTime.now());
        pago = pagoRepository.save(pago);

        // 4. Creamos la nueva Membresía sumando los días exactos
        MembresiaSocio nuevaMembresia = new MembresiaSocio();
        nuevaMembresia.setSocio(socio);
        nuevaMembresia.setTipoMembresia(tipoMembresia);
        nuevaMembresia.setPago(pago);
        nuevaMembresia.setFechaInicio(LocalDate.now());
        nuevaMembresia.setFechaVencimiento(LocalDate.now().plusDays(tipoMembresia.getDuracionDias()));
        nuevaMembresia.setEstado("Activa");
        MembresiaSocio guardada = membresiaSocioRepository.save(nuevaMembresia);

        // 5. ¡LE ABRIMOS EL TORNIQUETE!
        socio.setEstadoAcceso("Activo");
        socioRepository.save(socio);

        return guardada;
    }
}