package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.MarcarEjercicioRequest;
import ni.edu.uam.SpartanGymAPI.dto.ProgresoSemana;
import ni.edu.uam.SpartanGymAPI.models.*;
import ni.edu.uam.SpartanGymAPI.repositories.EjercicioCompletadoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.RutinaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EjercicioCompletadoServiceTest {

    @Mock private RutinaRepository rutinaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private SocioRepository socioRepository;
    @Mock private EjercicioCompletadoRepository ejercicioCompletadoRepository;

    @InjectMocks
    private EjercicioCompletadoService service;

    private Ejercicio ejercicio(Long id) {
        Ejercicio e = new Ejercicio();
        e.setId(id);
        return e;
    }

    private RutinaDetalle detalle(Ejercicio ej) {
        RutinaDetalle d = new RutinaDetalle();
        d.setEjercicio(ej);
        return d;
    }

    @Test
    void calcularProgreso_devuelveElPorcentajeDeEjerciciosDistintosCompletadosEstaSemana() {
        Ejercicio e1 = ejercicio(1L);
        Ejercicio e2 = ejercicio(2L);
        Ejercicio e3 = ejercicio(3L);

        Rutina rutina = new Rutina();
        rutina.setId(UUID.randomUUID());
        rutina.setDetalles(List.of(detalle(e1), detalle(e2), detalle(e3)));

        EjercicioCompletado c1 = new EjercicioCompletado();
        c1.setEjercicioId(1L);
        EjercicioCompletado c2 = new EjercicioCompletado();
        c2.setEjercicioId(2L);

        when(ejercicioCompletadoRepository.findByRutinaIdAndFechaBetween(eq(rutina.getId()), any(), any()))
                .thenReturn(List.of(c1, c2));

        ProgresoSemana progreso = service.calcularProgreso(rutina);

        assertEquals(3, progreso.planificados());
        assertEquals(2, progreso.completados());
        assertEquals(2.0 / 3.0, progreso.progreso(), 0.0001);
        assertEquals(java.util.Set.of(1L, 2L), progreso.ejerciciosCompletadosIds());
    }

    @Test
    void calcularProgreso_devuelveCeroSinDividirPorCeroCuandoNoHayEjerciciosPlanificados() {
        Rutina rutina = new Rutina();
        rutina.setId(UUID.randomUUID());
        rutina.setDetalles(List.of());

        when(ejercicioCompletadoRepository.findByRutinaIdAndFechaBetween(eq(rutina.getId()), any(), any()))
                .thenReturn(List.of());

        ProgresoSemana progreso = service.calcularProgreso(rutina);

        assertEquals(0, progreso.planificados());
        assertEquals(0.0, progreso.progreso(), 0.0001);
    }

    @Test
    void marcarCompletado_lanzaAccessDenied_siLaRutinaNoEsDelSocioAutenticado() {
        UUID rutinaId = UUID.randomUUID();

        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());

        Socio socioAutenticado = new Socio();
        socioAutenticado.setUsuarioId(usuario.getId());

        Socio socioDueno = new Socio();
        socioDueno.setUsuarioId(UUID.randomUUID());

        Rutina rutina = new Rutina();
        rutina.setId(rutinaId);
        rutina.setSocio(socioDueno);
        rutina.setDetalles(List.of(detalle(ejercicio(1L))));

        when(usuarioRepository.findByEmail("socio@correo.com")).thenReturn(Optional.of(usuario));
        when(socioRepository.findById(usuario.getId())).thenReturn(Optional.of(socioAutenticado));
        when(rutinaRepository.findById(rutinaId)).thenReturn(Optional.of(rutina));

        MarcarEjercicioRequest request = new MarcarEjercicioRequest();
        request.setCompletado(true);

        assertThrows(AccessDeniedException.class, () ->
                service.marcarCompletado("socio@correo.com", rutinaId, 1L, request));

        verify(ejercicioCompletadoRepository, never()).save(any());
    }

    @Test
    void marcarCompletado_insertaRegistro_cuandoCompletadoEsTrueYNoExisteAun() {
        UUID rutinaId = UUID.randomUUID();
        Long ejercicioId = 1L;
        LocalDate hoy = LocalDate.now();

        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());

        Socio socio = new Socio();
        socio.setUsuarioId(usuario.getId());

        Rutina rutina = new Rutina();
        rutina.setId(rutinaId);
        rutina.setSocio(socio);
        rutina.setDetalles(List.of(detalle(ejercicio(ejercicioId))));

        when(usuarioRepository.findByEmail("socio@correo.com")).thenReturn(Optional.of(usuario));
        when(socioRepository.findById(usuario.getId())).thenReturn(Optional.of(socio));
        when(rutinaRepository.findById(rutinaId)).thenReturn(Optional.of(rutina));
        when(ejercicioCompletadoRepository.existsByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, hoy))
                .thenReturn(false);

        MarcarEjercicioRequest request = new MarcarEjercicioRequest();
        request.setCompletado(true);

        service.marcarCompletado("socio@correo.com", rutinaId, ejercicioId, request);

        verify(ejercicioCompletadoRepository, times(1)).save(any(EjercicioCompletado.class));
    }

    @Test
    void marcarCompletado_esIdempotente_noInsertaDuplicadoSiYaExisteEseDia() {
        UUID rutinaId = UUID.randomUUID();
        Long ejercicioId = 1L;
        LocalDate hoy = LocalDate.now();

        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());

        Socio socio = new Socio();
        socio.setUsuarioId(usuario.getId());

        Rutina rutina = new Rutina();
        rutina.setId(rutinaId);
        rutina.setSocio(socio);
        rutina.setDetalles(List.of(detalle(ejercicio(ejercicioId))));

        when(usuarioRepository.findByEmail("socio@correo.com")).thenReturn(Optional.of(usuario));
        when(socioRepository.findById(usuario.getId())).thenReturn(Optional.of(socio));
        when(rutinaRepository.findById(rutinaId)).thenReturn(Optional.of(rutina));
        when(ejercicioCompletadoRepository.existsByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, hoy))
                .thenReturn(true);

        MarcarEjercicioRequest request = new MarcarEjercicioRequest();
        request.setCompletado(true);

        service.marcarCompletado("socio@correo.com", rutinaId, ejercicioId, request);

        verify(ejercicioCompletadoRepository, never()).save(any());
    }

    @Test
    void marcarCompletado_false_eliminaElRegistroDeEseDia() {
        UUID rutinaId = UUID.randomUUID();
        Long ejercicioId = 1L;
        LocalDate hoy = LocalDate.now();

        Usuario usuario = new Usuario();
        usuario.setId(UUID.randomUUID());

        Socio socio = new Socio();
        socio.setUsuarioId(usuario.getId());

        Rutina rutina = new Rutina();
        rutina.setId(rutinaId);
        rutina.setSocio(socio);
        rutina.setDetalles(List.of(detalle(ejercicio(ejercicioId))));

        when(usuarioRepository.findByEmail("socio@correo.com")).thenReturn(Optional.of(usuario));
        when(socioRepository.findById(usuario.getId())).thenReturn(Optional.of(socio));
        when(rutinaRepository.findById(rutinaId)).thenReturn(Optional.of(rutina));

        MarcarEjercicioRequest request = new MarcarEjercicioRequest();
        request.setCompletado(false);

        service.marcarCompletado("socio@correo.com", rutinaId, ejercicioId, request);

        verify(ejercicioCompletadoRepository, times(1))
                .deleteByRutinaIdAndEjercicioIdAndFecha(rutinaId, ejercicioId, hoy);
    }
}
