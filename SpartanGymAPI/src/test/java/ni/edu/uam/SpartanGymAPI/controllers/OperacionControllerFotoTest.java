package ni.edu.uam.SpartanGymAPI.controllers;

import ni.edu.uam.SpartanGymAPI.dto.ActualizarFotoRequest;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OperacionControllerFotoTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private Authentication auth;

    private OperacionController controller;

    @BeforeEach
    void setUp() {
        controller = new OperacionController(
                usuarioRepository, null, null, null, null, null, null, null, null, null);
    }

    @Test
    void actualizarFoto_soloModificaAlUsuarioAutenticado() {
        Usuario usuario = new Usuario();
        usuario.setEmail("socio@ejemplo.com");
        when(auth.getName()).thenReturn("socio@ejemplo.com");
        when(usuarioRepository.findByEmail("socio@ejemplo.com")).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        ActualizarFotoRequest req = new ActualizarFotoRequest();
        req.setFotoUrl("data:image/webp;base64,AAAA");

        ResponseEntity<Map<String, Object>> resp = controller.actualizarFoto(req, auth);

        assertEquals("data:image/webp;base64,AAAA", usuario.getFotoUrl());
        assertEquals("data:image/webp;base64,AAAA", resp.getBody().get("fotoUrl"));
        verify(usuarioRepository).findByEmail("socio@ejemplo.com");
        verify(usuarioRepository).save(usuario);
        verifyNoMoreInteractions(usuarioRepository);
    }

    @Test
    void actualizarFoto_conFotoNulaBorraLaFoto() {
        Usuario usuario = new Usuario();
        usuario.setEmail("socio@ejemplo.com");
        usuario.setFotoUrl("data:image/webp;base64,VIEJA");
        when(auth.getName()).thenReturn("socio@ejemplo.com");
        when(usuarioRepository.findByEmail("socio@ejemplo.com")).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        ActualizarFotoRequest req = new ActualizarFotoRequest();
        req.setFotoUrl(null);

        ResponseEntity<Map<String, Object>> resp = controller.actualizarFoto(req, auth);

        assertNull(usuario.getFotoUrl());
        assertEquals("", resp.getBody().get("fotoUrl"));
    }
}
