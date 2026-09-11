package ni.edu.uam.SpartanGymAPI.schedulers;

import ni.edu.uam.SpartanGymAPI.models.MembresiaSocio;
import ni.edu.uam.SpartanGymAPI.models.Socio;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.services.NotificacionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MembresiaSchedulerTest {

    @Mock private MembresiaSocioRepository membresiaRepository;
    @Mock private SocioRepository socioRepository;
    @Mock private NotificacionService notificacionService;

    @InjectMocks
    private MembresiaScheduler scheduler;

    private MembresiaSocio membresiaCon(Socio socio) {
        MembresiaSocio membresia = new MembresiaSocio();
        membresia.setId(UUID.randomUUID());
        membresia.setSocio(socio);
        membresia.setEstado("Activa");
        return membresia;
    }

    private Socio socioValido(String nombre) {
        Usuario usuario = new Usuario();
        usuario.setEmail(nombre + "@ejemplo.com");

        Socio socio = new Socio();
        socio.setUsuarioId(UUID.randomUUID());
        socio.setUsuario(usuario);
        socio.setNombres(nombre);
        socio.setApellidos("Apellido");
        return socio;
    }

    @Test
    void unSocioQueFalla_noImpideQueSeProcesenLosDemas() {
        Socio socioRoto = socioValido("Roto");
        Socio socioSano1 = socioValido("Sano1");
        Socio socioSano2 = socioValido("Sano2");

        MembresiaSocio membresiaRota = membresiaCon(socioRoto);
        MembresiaSocio membresiaSana1 = membresiaCon(socioSano1);
        MembresiaSocio membresiaSana2 = membresiaCon(socioSano2);

        when(membresiaRepository.findByEstadoAndFechaVencimientoBefore(eq("Activa"), any(LocalDate.class)))
                .thenReturn(List.of(membresiaRota, membresiaSana1, membresiaSana2));

        // El socio "roto" simula un dato corrupto: falla justo al guardar su membresía.
        when(membresiaRepository.save(membresiaRota)).thenThrow(new RuntimeException("fila corrupta"));

        scheduler.verificarMembresiasVencidas();

        // Los dos socios sanos, que venian DESPUES del roto en la lista, se procesaron igual.
        verify(membresiaRepository).save(membresiaSana1);
        verify(membresiaRepository).save(membresiaSana2);
        verify(socioRepository).save(socioSano1);
        verify(socioRepository).save(socioSano2);
        verify(notificacionService).enviarCorreoVencimiento(socioSano1.getUsuario().getEmail(), "Sano1");
        verify(notificacionService).enviarCorreoVencimiento(socioSano2.getUsuario().getEmail(), "Sano2");

        // El socio roto nunca llego a bloquearsele el acceso, porque el guardado de su
        // membresia fallo antes de esa linea.
        verify(socioRepository, never()).save(socioRoto);
    }

    @Test
    void todosLosSociosSanos_seProcesanNormalmente() {
        Socio socio = socioValido("Ana");
        MembresiaSocio membresia = membresiaCon(socio);

        when(membresiaRepository.findByEstadoAndFechaVencimientoBefore(eq("Activa"), any(LocalDate.class)))
                .thenReturn(List.of(membresia));

        scheduler.verificarMembresiasVencidas();

        assertEquals("Vencida", membresia.getEstado());
        assertEquals("Inactivo", socio.getEstadoAcceso());
        verify(notificacionService).enviarCorreoVencimiento(socio.getUsuario().getEmail(), "Ana");
    }
}
