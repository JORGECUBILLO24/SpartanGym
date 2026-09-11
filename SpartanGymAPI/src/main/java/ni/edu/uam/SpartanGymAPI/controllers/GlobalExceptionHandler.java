package ni.edu.uam.SpartanGymAPI.controllers;

import jakarta.servlet.http.HttpServletRequest;
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
 *
 * Además deja constancia en el log de TODA excepción que pasa por acá, con el
 * método y la ruta que fallaron: en Render el plan free no tiene request logs,
 * así que estas líneas son la única forma de saber qué pasó. El stack trace va
 * al log, nunca al cuerpo de la respuesta.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Falta de permisos (@PreAuthorize) -> 403
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("403 en {}: {}", origen(request), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("No tienes permisos para realizar esta acción.");
    }

    // Credenciales inválidas al iniciar sesión -> 400 (evita el flujo de "sesión expirada" del front)
    // Va en debug: un login fallido es esperable y no ensucia el log con algo que no es un problema.
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<String> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        log.debug("Autenticación fallida en {}: {}", origen(request), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Correo o contraseña incorrectos.");
    }

    // Validación de @Valid en los DTO -> 400 con el primer mensaje de campo
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .map(org.springframework.validation.FieldError::getDefaultMessage)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse("Datos inválidos en la solicitud.");
        log.warn("400 por validación en {}: {}", origen(request), mensaje);
        return ResponseEntity.badRequest().body(mensaje);
    }

    // Violación de restricciones de BD (ej. correo duplicado) -> 400 con mensaje amigable
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Violación de integridad de datos en {}: {}", origen(request), ex.getMostSpecificCause().getMessage());
        return ResponseEntity.badRequest()
                .body("Ya existe un registro con esos datos (por ejemplo, el correo ya está en uso).");
    }

    // Excepciones propias de Spring MVC (404 de ruta desconocida, 405, etc.):
    // conservamos su status original en vez de convertirlas en 400.
    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<String> handleErrorResponse(ErrorResponseException ex, HttpServletRequest request) {
        String detalle = ex.getBody() != null ? ex.getBody().getDetail() : null;
        log.warn("{} en {}: {}", ex.getStatusCode().value(), origen(request), detalle);
        return ResponseEntity.status(ex.getStatusCode())
                .body(detalle != null && !detalle.isBlank() ? detalle : "No se pudo procesar la solicitud.");
    }

    // Errores de negocio lanzados en los servicios -> 400 con su mensaje
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntime(RuntimeException ex, HttpServletRequest request) {
        String mensaje = ex.getMessage();

        // En este proyecto los errores de negocio se lanzan como RuntimeException "pelada",
        // sin cause, con un mensaje pensado para el usuario ("El enlace de restablecimiento
        // expiro", etc.). Cuando SÍ hay cause (p.ej. "No se pudo firmar el QR de asistencia",
        // que envuelve un fallo real de HMAC) es una falla técnica con forma de RuntimeException
        // pelada, no una regla de negocio — igual que una subclase, necesita el stack completo.
        boolean errorDeNegocio = ex.getClass() == RuntimeException.class
                && ex.getCause() == null
                && mensaje != null
                && !mensaje.isBlank();

        if (errorDeNegocio) {
            log.warn("400 en {}: {}", origen(request), mensaje);
            return ResponseEntity.badRequest().body(mensaje);
        }

        log.error("Error inesperado en {}", origen(request), ex);
        return ResponseEntity.badRequest()
                .body(mensaje == null || mensaje.isBlank() ? "No se pudo procesar la solicitud." : mensaje);
    }

    // Red de seguridad: lo que no sea RuntimeException tampoco puede quedar sin rastro.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenerico(Exception ex, HttpServletRequest request) {
        log.error("Error no controlado en {}", origen(request), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("No se pudo procesar la solicitud.");
    }

    /** Método + ruta de la petición, para reemplazar lo que darían los request logs. */
    private String origen(HttpServletRequest request) {
        if (request == null) {
            return "petición desconocida";
        }
        return request.getMethod() + " " + request.getRequestURI();
    }
}
