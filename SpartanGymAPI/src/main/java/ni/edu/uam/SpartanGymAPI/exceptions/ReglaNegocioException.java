package ni.edu.uam.SpartanGymAPI.exceptions;

import org.springframework.http.HttpStatus;

/** Datos que no cumplen una regla del negocio. */
public class ReglaNegocioException extends ApiException {
    public ReglaNegocioException(String mensaje) {
        super(HttpStatus.BAD_REQUEST, "REGLA_NEGOCIO", mensaje);
    }
}
