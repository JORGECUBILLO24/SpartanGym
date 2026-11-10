package ni.edu.uam.SpartanGymAPI.services;

import ni.edu.uam.SpartanGymAPI.dto.TipoMembresiaRequest;
import ni.edu.uam.SpartanGymAPI.exceptions.ReglaNegocioException;
import ni.edu.uam.SpartanGymAPI.models.TipoMembresia;
import ni.edu.uam.SpartanGymAPI.repositories.MembresiaSocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.PagoRepository;
import ni.edu.uam.SpartanGymAPI.repositories.SocioRepository;
import ni.edu.uam.SpartanGymAPI.repositories.TipoMembresiaRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Un plan con precio negativo o duración 0 no debe llegar a la base: el error sería confuso. */
class MembresiaServiceValidacionTest {

    private final TipoMembresiaRepository tipos = mock(TipoMembresiaRepository.class);
    private final MembresiaService servicio = new MembresiaService(
            mock(SocioRepository.class), tipos, mock(PagoRepository.class),
            mock(MembresiaSocioRepository.class), mock(UsuarioRepository.class));

    private static TipoMembresiaRequest plan(String nombre, Integer dias, String precio) {
        TipoMembresiaRequest request = new TipoMembresiaRequest();
        request.setNombre(nombre);
        request.setDuracionDias(dias);
        request.setPrecio(precio == null ? null : new BigDecimal(precio));
        return request;
    }

    @Test
    void rechazaPrecioNegativo() {
        assertThatThrownBy(() -> servicio.crearTipo(plan("Mensual", 30, "-5.00")))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("precio");
        verify(tipos, never()).save(any());
    }

    @Test
    void rechazaDuracionCeroONegativa() {
        assertThatThrownBy(() -> servicio.crearTipo(plan("Mensual", 0, "10.00")))
                .isInstanceOf(ReglaNegocioException.class).hasMessageContaining("duración");
        assertThatThrownBy(() -> servicio.crearTipo(plan("Mensual", -3, "10.00")))
                .isInstanceOf(ReglaNegocioException.class);
    }

    @Test
    void rechazaNombreVacioODatosFaltantes() {
        assertThatThrownBy(() -> servicio.crearTipo(plan("  ", 30, "10.00"))).isInstanceOf(ReglaNegocioException.class);
        assertThatThrownBy(() -> servicio.crearTipo(plan(null, 30, "10.00"))).isInstanceOf(ReglaNegocioException.class);
        assertThatThrownBy(() -> servicio.crearTipo(plan("Mensual", null, "10.00"))).isInstanceOf(ReglaNegocioException.class);
        assertThatThrownBy(() -> servicio.crearTipo(plan("Mensual", 30, null))).isInstanceOf(ReglaNegocioException.class);
        verify(tipos, never()).save(any());
    }

    @Test
    void aceptaUnPlanValidoYUnPlanGratuito() {
        when(tipos.save(any(TipoMembresia.class))).thenAnswer(i -> i.getArgument(0));

        TipoMembresia gratis = servicio.crearTipo(plan("  Cortesía  ", 7, "0"));

        assertThat(gratis.getNombre()).isEqualTo("Cortesía");
        assertThat(gratis.getPrecio()).isEqualByComparingTo("0");
    }
}
