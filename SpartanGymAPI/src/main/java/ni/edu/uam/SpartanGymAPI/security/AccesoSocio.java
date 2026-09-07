package ni.edu.uam.SpartanGymAPI.security;

import lombok.RequiredArgsConstructor;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Chequeo de propiedad para los endpoints que reciben un socioId por URL o por body.
 *
 * Sin esto, cualquier usuario autenticado podía cambiar el UUID de la petición y leer
 * (o escribir) los datos de otro socio: el rol solo decide QUÉ tipo de dato se puede ver,
 * no DE QUIÉN. Se usa desde @PreAuthorize combinado con hasAnyRole, de forma que el
 * personal sigue viendo a cualquier socio y un socio solo se ve a sí mismo.
 *
 * El id de Socio es el mismo que el de su Usuario (Socio usa usuario_id como PK).
 */
@Component("accesoSocio")
@RequiredArgsConstructor
public class AccesoSocio {

    private final UsuarioRepository usuarioRepository;

    public boolean esElMismo(Authentication auth, UUID socioId) {
        if (auth == null || auth.getName() == null || socioId == null) {
            return false;
        }
        return usuarioRepository.findByEmailIgnoreCase(auth.getName())
                .map(Usuario::getId)
                .map(socioId::equals)
                .orElse(false);
    }
}
