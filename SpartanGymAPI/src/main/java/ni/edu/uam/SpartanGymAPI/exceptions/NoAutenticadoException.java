package ni.edu.uam.SpartanGymAPI.exceptions;

import org.springframework.http.HttpStatus;

/**
 * No hay usuario autenticado, o el del token ya no existe en la base.
 * El web lo trata cerrando la sesión y mandando al login.
 */
public class NoAutenticadoException extends ApiException {
    public NoAutenticadoException(String mensaje) {
        super(HttpStatus.UNAUTHORIZED, "NO_AUTENTICADO", mensaje);
    }
}
