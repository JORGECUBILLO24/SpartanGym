package ni.edu.uam.SpartanGymAPI.exceptions;

import org.springframework.http.HttpStatus;

/** El usuario está autenticado pero no puede hacer esto. */
public class AccesoDenegadoException extends ApiException {
    public AccesoDenegadoException(String mensaje) {
        super(HttpStatus.FORBIDDEN, "ACCESO_DENEGADO", mensaje);
    }
}
