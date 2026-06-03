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
        for (MembresiaSocio membresia : vencidas) {
            // 1. Vencemos la membresía
            membresia.setEstado("Vencida");
            membresiaRepository.save(membresia);

            // 2. Le bloqueamos el torniquete al socio
            Socio socio = membresia.getSocio();
            socio.setEstadoAcceso("Inactivo");
            socioRepository.save(socio);

            contador++;
            log.info("Membresía vencida para el socio: {} {}", socio.getNombres(), socio.getApellidos());

            notificacionService.enviarCorreoVencimiento(socio.getUsuario().getEmail(), socio.getNombres());
        }

        log.info("Revisión terminada. Membresías actualizadas: {}", contador);
    }
}