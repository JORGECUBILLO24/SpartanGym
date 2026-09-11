package ni.edu.uam.SpartanGymAPI.controllers;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ni.edu.uam.SpartanGymAPI.exceptions.ApiException;
import ni.edu.uam.SpartanGymAPI.exceptions.RespuestaError;
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
 * Traduce las excepciones a respuestas con el status HTTP correcto y el mismo mensaje
 * que se le muestra al usuario. El formato del cuerpo lo decide RespuestaError: texto
 * plano por defecto (clientes viejos) o RFC 9457 con "codigo" si el cliente lo pide.
 *
 * Además deja constancia en el log de TODA excepción que pasa por acá, con el método y
 * la ruta que fallaron: en Render el plan free no tiene request logs, así que estas
 * líneas son la única forma de saber qué pasó. El stack trace va al log, nunca al
 * cuerpo de la respuesta.
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private static final String MENSAJE_GENERICO = "No se pudo procesar la solicitud.";

    private final RespuestaError respuestaError;

    // Errores de negocio tipados: el status y el código vienen de la excepción.
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<String> handleApi(ApiException ex, HttpServletRequest request) {
        log.warn("{} en {}: {}", ex.getStatus().value(), origen(request), ex.getMessage());
        return respuestaError.construir(ex.getStatus(), ex.getCodigo(), ex.getMessage(), request);
    }

    // Falta de permisos (@PreAuthorize) -> 403
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("403 en {}: {}", origen(request), ex.getMessage());
        return respuestaError.construir(HttpStatus.FORBIDDEN, "ACCESO_DENEGADO",
                "No tienes permisos para realizar esta acción.", request);
    }

    // Credenciales inválidas al iniciar sesión -> 400 a propósito: un 401 dispararía en el
    // web el flujo de "sesión expirada". Va en debug: un login fallido es esperable.
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<String> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        log.debug("Autenticación fallida en {}: {}", origen(request), ex.getMessage());
        return respuestaError.construir(HttpStatus.BAD_REQUEST, "CREDENCIALES_INVALIDAS",
                "Correo o contraseña incorrectos.", request);
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
        return respuestaError.construir(HttpStatus.BAD_REQUEST, "VALIDACION", mensaje, request);
    }

    // Violación de restricciones de BD (ej. correo duplicado) -> 409
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Violación de integridad de datos en {}: {}", origen(request), ex.getMostSpecificCause().getMessage());
        return respuestaError.construir(HttpStatus.CONFLICT, "CONFLICTO",
                "Ya existe un registro con esos datos (por ejemplo, el correo ya está en uso).", request);
    }

    // Excepciones propias de Spring MVC (404 de ruta desconocida, 405, etc.): conservan su status.
    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<String> handleErrorResponse(ErrorResponseException ex, HttpServletRequest request) {
        String detalle = ex.getBody() != null ? ex.getBody().getDetail() : null;
        log.warn("{} en {}: {}", ex.getStatusCode().value(), origen(request), detalle);
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return respuestaError.construir(status, "ERROR_HTTP",
                detalle != null && !detalle.isBlank() ? detalle : MENSAJE_GENERICO, request);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntime(RuntimeException ex, HttpServletRequest request) {
        String mensaje = ex.getMessage();
        boolean conMensaje = mensaje != null && !mensaje.isBlank();
        boolean pelada = ex.getClass() == RuntimeException.class;

        // Legado sin migrar: RuntimeException pelada, sin cause y con un mensaje escrito para
        // el usuario. Se mantiene 400 para no cambiar lo que todavía no se tipó.
        if (pelada && ex.getCause() == null && conMensaje) {
            log.warn("400 en {}: {}", origen(request), mensaje);
            return respuestaError.construir(HttpStatus.BAD_REQUEST, "REGLA_NEGOCIO", mensaje, request);
        }

        // Falla técnica. Con cause (fallo real envuelto con un mensaje en español, p.ej.
        // "No se pudo firmar el QR de asistencia") se conserva ese mensaje; cualquier otra
        // subclase (NPE, etc.) o sin mensaje es un bug, y su texto no es para el usuario.
        log.error("Error inesperado en {}", origen(request), ex);
        String paraUsuario = pelada && ex.getCause() != null && conMensaje ? mensaje : MENSAJE_GENERICO;
        return respuestaError.construir(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO", paraUsuario, request);
    }

    // Red de seguridad: lo que no sea RuntimeException tampoco puede quedar sin rastro.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenerico(Exception ex, HttpServletRequest request) {
        log.error("Error no controlado en {}", origen(request), ex);
        return respuestaError.construir(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO", MENSAJE_GENERICO, request);
    }

    /** Método + ruta de la petición, para reemplazar lo que darían los request logs. */
    private String origen(HttpServletRequest request) {
        if (request == null) {
            return "petición desconocida";
        }
        return request.getMethod() + " " + request.getRequestURI();
    }
}
