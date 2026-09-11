package ni.edu.uam.SpartanGymAPI.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Error de negocio con su status HTTP y un código estable que los clientes pueden usar
 * sin depender del texto del mensaje. El mensaje es para mostrarle al usuario.
 */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;

    protected ApiException(HttpStatus status, String codigo, String mensaje) {
        super(mensaje);
        this.status = status;
        this.codigo = codigo;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCodigo() {
        return codigo;
    }
}
