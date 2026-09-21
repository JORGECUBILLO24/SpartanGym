package ni.edu.uam.SpartanGymAPI.exceptions;

import org.springframework.http.HttpStatus;

/** Choca con el estado actual (QR ya usado, membresía ya activa). */
public class ConflictoException extends ApiException {
    public ConflictoException(String mensaje) {
        super(HttpStatus.CONFLICT, "CONFLICTO", mensaje);
    }
}
