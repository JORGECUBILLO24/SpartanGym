package ni.edu.uam.SpartanGymAPI.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Objects;

/**
 * Traduce las excepciones a respuestas limpias (mensaje + status correcto),
 * en vez de devolver 500 con un stack trace. El cuerpo es texto plano con el
 * mensaje, mismo formato que ya devolvía MembresiaController, para que web y app
 * lo muestren directamente.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Falta de permisos (@PreAuthorize) -> 403
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("No tienes permisos para realizar esta acción.");
    }

    // Credenciales inválidas al iniciar sesión -> 400 (evita el flujo de "sesión expirada" del front)
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<String> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Correo o contraseña incorrectos.");
    }

    // Validación de @Valid en los DTO -> 400 con el primer mensaje de campo
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .map(org.springframework.validation.FieldError::getDefaultMessage)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse("Datos inválidos en la solicitud.");
        return ResponseEntity.badRequest().body(mensaje);
    }

    // Violación de restricciones de BD (ej. correo duplicado) -> 400 con mensaje amigable
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Violación de integridad de datos: {}", ex.getMostSpecificCause().getMessage());
        return ResponseEntity.badRequest()
                .body("Ya existe un registro con esos datos (por ejemplo, el correo ya está en uso).");
    }

    // Excepciones propias de Spring MVC (404 de ruta desconocida, 405, etc.):
    // conservamos su status original en vez de convertirlas en 400.
    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<String> handleErrorResponse(ErrorResponseException ex) {
        String detalle = ex.getBody() != null ? ex.getBody().getDetail() : null;
        return ResponseEntity.status(ex.getStatusCode())
                .body(detalle != null && !detalle.isBlank() ? detalle : "No se pudo procesar la solicitud.");
    }

    // Errores de negocio lanzados en los servicios -> 400 con su mensaje
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntime(RuntimeException ex) {
        String mensaje = ex.getMessage();
        if (mensaje == null || mensaje.isBlank()) {
            log.error("Error inesperado", ex);
            mensaje = "No se pudo procesar la solicitud.";
        }
        return ResponseEntity.badRequest().body(mensaje);
    }
}
