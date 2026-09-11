package ni.edu.uam.SpartanGymAPI.exceptions;

import org.springframework.http.HttpStatus;

/** Lo pedido no existe: un id de la petición que no se encontró. */
public class RecursoNoEncontradoException extends ApiException {
    public RecursoNoEncontradoException(String mensaje) {
        super(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", mensaje);
    }
}
