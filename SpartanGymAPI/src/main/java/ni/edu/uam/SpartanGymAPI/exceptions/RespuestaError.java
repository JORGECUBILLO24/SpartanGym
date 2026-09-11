package ni.edu.uam.SpartanGymAPI.exceptions;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Arma el cuerpo de todo error de la API, para que el contrato sea el mismo venga de
 * GlobalExceptionHandler o de Spring Security.
 *
 * Formato opt-in: solo si el Accept pide application/problem+json se responde RFC 9457
 * con un campo "codigo". Si no, texto plano con el mensaje, que es lo que esperan los
 * clientes viejos (el APK instalado muestra el cuerpo del error tal cual).
 */
@Component
public class RespuestaError {

    private static final MediaType TEXTO = new MediaType("text", "plain", StandardCharsets.UTF_8);

    private final ObjectMapper objectMapper;

    public RespuestaError(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** Solo cuenta si se pide explícitamente: un Accept comodín o "application/json" es un cliente viejo. */
    public static boolean pideProblemJson(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        String accept = request.getHeader("Accept");
        return accept != null && accept.toLowerCase(Locale.ROOT).contains("application/problem+json");
    }

    public ResponseEntity<String> construir(HttpStatus status, String codigo, String mensaje, HttpServletRequest request) {
        if (pideProblemJson(request)) {
            return ResponseEntity.status(status)
                    .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                    .body(serializar(status, codigo, mensaje, request));
        }
        return ResponseEntity.status(status).contentType(TEXTO).body(mensaje);
    }

    public void escribir(HttpServletResponse response, HttpStatus status, String codigo, String mensaje,
                         HttpServletRequest request) throws IOException {
        response.setStatus(status.value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        if (pideProblemJson(request)) {
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.getWriter().write(serializar(status, codigo, mensaje, request));
        } else {
            response.setContentType(MediaType.TEXT_PLAIN_VALUE);
            response.getWriter().write(mensaje);
        }
    }

    private String serializar(HttpStatus status, String codigo, String mensaje, HttpServletRequest request) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("type", "about:blank");
        cuerpo.put("title", status.getReasonPhrase());
        cuerpo.put("status", status.value());
        cuerpo.put("detail", mensaje);
        cuerpo.put("instance", request != null ? request.getRequestURI() : null);
        cuerpo.put("codigo", codigo);
        return objectMapper.writeValueAsString(cuerpo);
    }
}
