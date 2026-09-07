package ni.edu.uam.SpartanGymAPI.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Fija el contrato de respuesta del handler. El logging se agrego para poder
 * diagnosticar en Render, pero lo que ven la web y la app no debe cambiar.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private MockHttpServletRequest peticion() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setRequestURI("/api/auth/reset-password");
        return request;
    }

    @Test
    void runtimeDeNegocio_devuelve400ConSuMensaje() {
        RuntimeException ex = new RuntimeException("El enlace de restablecimiento expiro. Solicita uno nuevo.");

        ResponseEntity<String> respuesta = handler.handleRuntime(ex, peticion());

        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
        assertEquals("El enlace de restablecimiento expiro. Solicita uno nuevo.", respuesta.getBody());
    }

    @Test
    void runtimeSinMensaje_devuelve400ConTextoGenerico() {
        ResponseEntity<String> respuesta = handler.handleRuntime(new RuntimeException(), peticion());

        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
        assertEquals("No se pudo procesar la solicitud.", respuesta.getBody());
    }

    @Test
    void subclaseDeRuntime_conservaElMismo400YMensajeQueAntes() {
        // Se loguea con stack trace por ser probable bug, pero la respuesta no cambia.
        ResponseEntity<String> respuesta =
                handler.handleRuntime(new IllegalStateException("estado invalido al procesar la solicitud"), peticion());

        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
        assertEquals("estado invalido al procesar la solicitud", respuesta.getBody());
    }

    @Test
    void excepcionNoRuntime_devuelve500Generico() {
        ResponseEntity<String> respuesta = handler.handleGenerico(new Exception("fallo raro"), peticion());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, respuesta.getStatusCode());
        assertEquals("No se pudo procesar la solicitud.", respuesta.getBody());
    }

    @Test
    void peticionNula_noRompeElHandler() {
        ResponseEntity<String> respuesta = handler.handleRuntime(new RuntimeException("x"), null);

        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
        assertEquals("x", respuesta.getBody());
    }
}
