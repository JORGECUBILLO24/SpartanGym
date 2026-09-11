package ni.edu.uam.SpartanGymAPI.security;

import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AccesoSocioTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private Authentication auth;

    @InjectMocks
    private AccesoSocio accesoSocio;

    private UUID registrarUsuario(String email) {
        UUID id = UUID.randomUUID();
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setEmail(email);
        when(usuarioRepository.findByEmailIgnoreCase(email)).thenReturn(Optional.of(usuario));
        return id;
    }

    @Test
    void esElMismo_verdaderoCuandoConsultaSusPropiosDatos() {
        UUID propio = registrarUsuario("socio@ejemplo.com");
        when(auth.getName()).thenReturn("socio@ejemplo.com");

        assertTrue(accesoSocio.esElMismo(auth, propio));
    }

    @Test
    void esElMismo_falsoCuandoConsultaLosDatosDeOtroSocio() {
        registrarUsuario("socio@ejemplo.com");
        when(auth.getName()).thenReturn("socio@ejemplo.com");

        // Este es el caso que antes no se controlaba: cambiar el UUID de la URL.
        assertFalse(accesoSocio.esElMismo(auth, UUID.randomUUID()));
    }

    @Test
    void esElMismo_falsoSiElUsuarioAutenticadoNoExiste() {
        when(auth.getName()).thenReturn("fantasma@ejemplo.com");
        when(usuarioRepository.findByEmailIgnoreCase("fantasma@ejemplo.com")).thenReturn(Optional.empty());

        assertFalse(accesoSocio.esElMismo(auth, UUID.randomUUID()));
    }

    @Test
    void esElMismo_falsoConEntradasNulas() {
        assertFalse(accesoSocio.esElMismo(null, UUID.randomUUID()));

        when(auth.getName()).thenReturn(null);
        assertFalse(accesoSocio.esElMismo(auth, UUID.randomUUID()));

        when(auth.getName()).thenReturn("socio@ejemplo.com");
        assertFalse(accesoSocio.esElMismo(auth, null));
    }
}
