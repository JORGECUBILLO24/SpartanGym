package ni.edu.uam.SpartanGymAPI.schedulers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.services.NotificacionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j // Para poder imprimir mensajes bonitos en la consola
@Component
@RequiredArgsConstructor
public class MembresiaScheduler {

    private final MembresiaSocioRepository membresiaRepository;
    private final SocioRepository socioRepository;
    private final NotificacionService notificacionService;

    // "0 0 0 * * *" significa: Todos los días a las 00:00 (Medianoche)
    // Para hacer pruebas rápidas podrías usar @Scheduled(fixedRate = 60000) que corre cada 1 minuto
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void verificarMembresiasVencidas() {
        log.info("Iniciando revisión automática de membresías vencidas...");

        // Buscamos las que están "Activas" pero su fecha de vencimiento es ANTES de hoy
        List<MembresiaSocio> vencidas = membresiaRepository.findByEstadoAndFechaVencimientoBefore("Activa", LocalDate.now());

        int contador = 0;
        int fallidas = 0;
        for (MembresiaSocio membresia : vencidas) {
            // Cada socio se procesa aislado: si uno falla (dato corrupto, lo que sea), el
            // resto del lote de esa noche debe seguir igual. Antes una excepcion ac + su rollback
            // dejaba a todos los que venian despues en la lista sin vencer, sin que quedara
            // ningun rastro de que el proceso se corto a mitad de camino.
            try {
                // 1. Vencemos la membresía
                membresia.setEstado("Vencida");
                membresiaRepository.save(membresia);

                // 2. Le bloqueamos el torniquete al socio
                Socio socio = membresia.getSocio();
                socio.setEstadoAcceso("Inactivo");
                socioRepository.save(socio);

                contador++;
                log.info("Membresía vencida para el socio: {} {}", socio.getNombres(), socio.getApellidos());

                notificacionService.registrarNotificacion(
                        socio.getUsuario(),
                        "alerta",
                        "Membresía vencida",
                        "Tu membresía ha vencido. Acércate a recepción para renovarla."
                );
                notificacionService.enviarCorreoVencimiento(socio.getUsuario().getEmail(), socio.getNombres());
            } catch (Exception e) {
                fallidas++;
                log.error("No se pudo vencer la membresía {} (socio {})",
                        membresia.getId(),
                        membresia.getSocio() != null ? membresia.getSocio().getUsuarioId() : null,
                        e);
            }
        }

        if (fallidas > 0) {
            log.warn("Revisión terminada con errores: {} actualizadas, {} fallidas de {} encontradas.",
                    contador, fallidas, vencidas.size());
        } else {
            log.info("Revisión terminada. Membresías actualizadas: {}", contador);
        }
    }
}