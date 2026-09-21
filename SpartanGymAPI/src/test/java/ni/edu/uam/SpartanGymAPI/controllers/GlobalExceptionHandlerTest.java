package ni.edu.uam.SpartanGymAPI.controllers;

import ni.edu.uam.SpartanGymAPI.exceptions.ConflictoException;
import ni.edu.uam.SpartanGymAPI.exceptions.RecursoNoEncontradoException;
import ni.edu.uam.SpartanGymAPI.exceptions.RespuestaError;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Fija el contrato de respuesta del handler: status HTTP según el tipo de error y, sin
 * opt-in, el mismo cuerpo de texto que ven hoy la web y la app.
 */
class GlobalExceptionHandlerTest {

    private final JsonMapper json = JsonMapper.builder().build();
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(new RespuestaError(json));

    private MockHttpServletRequest peticion() {
        return new MockHttpServletRequest("POST", "/api/auth/reset-password");
    }

    private MockHttpServletRequest peticionProblem() {
        MockHttpServletRequest r = peticion();
        r.addHeader("Accept", "application/problem+json, */*");
        return r;
    }

    @Test
    void excepcionTipada_usaSuStatusYConservaElMensaje() {
        ResponseEntity<String> r = handler.handleApi(new RecursoNoEncontradoException("Socio no encontrado"), peticion());

        assertEquals(HttpStatus.NOT_FOUND, r.getStatusCode());
        assertEquals("Socio no encontrado", r.getBody());
    }

    @Test
    void excepcionTipada_conOptInDevuelveCodigo() {
        ResponseEntity<String> r = handler.handleApi(new ConflictoException("QR ya utilizado."), peticionProblem());

        assertEquals(HttpStatus.CONFLICT, r.getStatusCode());
        assertEquals("CONFLICTO", json.readTree(r.getBody()).get("codigo").asString());
        assertEquals("QR ya utilizado.", json.readTree(r.getBody()).get("detail").asString());
    }

    @Test
    void runtimeDeNegocioLegado_sigueSiendo400ConSuMensaje() {
        ResponseEntity<String> r = handler.handleRuntime(
                new RuntimeException("El enlace de restablecimiento expiro. Solicita uno nuevo."), peticion());

        assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode());
        assertEquals("El enlace de restablecimiento expiro. Solicita uno nuevo.", r.getBody());
    }

    @Test
    void runtimeConCause_esFallaTecnica500ConSuMensaje() {
        // Patrón real del proyecto: fallos técnicos (HMAC, digest) envueltos con un mensaje en español.
        RuntimeException ex = new RuntimeException(
                "No se pudo firmar el QR de asistencia.", new IllegalStateException("HMAC no disponible"));

        ResponseEntity<String> r = handler.handleRuntime(ex, peticion());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, r.getStatusCode());
        assertEquals("No se pudo firmar el QR de asistencia.", r.getBody());
    }

    @Test
    void subclaseInesperada_es500ConTextoGenerico() {
        // El mensaje de un NPE no es para el usuario.
        ResponseEntity<String> r = handler.handleRuntime(new NullPointerException("Cannot invoke x"), peticion());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, r.getStatusCode());
        assertEquals("No se pudo procesar la solicitud.", r.getBody());
    }

    @Test
    void runtimeSinMensaje_es500ConTextoGenerico() {
        ResponseEntity<String> r = handler.handleRuntime(new RuntimeException(), peticion());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, r.getStatusCode());
        assertEquals("No se pudo procesar la solicitud.", r.getBody());
    }

    @Test
    void integridadDeDatos_es409() {
        ResponseEntity<String> r = handler.handleDataIntegrity(new DataIntegrityViolationException("dup"), peticion());

        assertEquals(HttpStatus.CONFLICT, r.getStatusCode());
        assertEquals("Ya existe un registro con esos datos (por ejemplo, el correo ya está en uso).", r.getBody());
    }

    @Test
    void excepcionNoRuntime_devuelve500Generico() {
        ResponseEntity<String> r = handler.handleGenerico(new Exception("fallo raro"), peticion());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, r.getStatusCode());
        assertEquals("No se pudo procesar la solicitud.", r.getBody());
    }

    @Test
    void peticionNula_noRompeElHandler() {
        ResponseEntity<String> r = handler.handleRuntime(new RuntimeException("x"), null);

        assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode());
        assertEquals("x", r.getBody());
    }
}
