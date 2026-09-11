package ni.edu.uam.SpartanGymAPI.exceptions;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RespuestaErrorTest {

    private final JsonMapper json = JsonMapper.builder().build();
    private final RespuestaError respuesta = new RespuestaError(json);

    private MockHttpServletRequest peticion(String accept) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/socios/123");
        if (accept != null) {
            request.addHeader("Accept", accept);
        }
        return request;
    }

    @Test
    void sinOptIn_devuelveTextoPlanoConElMensaje() {
        ResponseEntity<String> r = respuesta.construir(
                HttpStatus.NOT_FOUND, "NO_ENCONTRADO", "Socio no encontrado", peticion("*/*"));

        assertEquals(404, r.getStatusCode().value());
        assertEquals("Socio no encontrado", r.getBody());
        assertTrue(r.getHeaders().getContentType().toString().startsWith("text/plain"));
    }

    @Test
    void conOptIn_devuelveProblemJsonConCodigo() {
        ResponseEntity<String> r = respuesta.construir(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", "Socio no encontrado",
                peticion("application/problem+json, application/json;q=0.9, */*;q=0.8"));

        assertEquals("application/problem+json", r.getHeaders().getContentType().toString());
        JsonNode cuerpo = json.readTree(r.getBody());
        assertEquals(404, cuerpo.get("status").asInt());
        assertEquals("Socio no encontrado", cuerpo.get("detail").asString());
        assertEquals("NO_ENCONTRADO", cuerpo.get("codigo").asString());
        assertEquals("/api/socios/123", cuerpo.get("instance").asString());
        assertEquals("Not Found", cuerpo.get("title").asString());
    }

    @Test
    void acceptJsonSolo_noCuentaComoOptIn() {
        // Un cliente que pide application/json a secas no pidió el formato nuevo.
        ResponseEntity<String> r = respuesta.construir(
                HttpStatus.BAD_REQUEST, "REGLA_NEGOCIO", "x", peticion("application/json"));

        assertEquals("x", r.getBody());
    }

    @Test
    void peticionNula_devuelveTexto() {
        ResponseEntity<String> r = respuesta.construir(HttpStatus.BAD_REQUEST, "REGLA_NEGOCIO", "x", null);

        assertEquals("x", r.getBody());
    }

    @Test
    void escribir_serializaEnLaRespuestaServlet() throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        respuesta.escribir(res, HttpStatus.UNAUTHORIZED, "NO_AUTENTICADO", "Sesión vencida",
                peticion("application/problem+json"));

        assertEquals(401, res.getStatus());
        // El charset UTF-8 va a propósito: los mensajes tienen acentos ("sesión").
        assertTrue(res.getContentType().startsWith("application/problem+json"));
        assertEquals("NO_AUTENTICADO", json.readTree(res.getContentAsString()).get("codigo").asString());
    }

    @Test
    void escribir_sinOptIn_escribeElTextoEnUtf8() throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        respuesta.escribir(res, HttpStatus.UNAUTHORIZED, "NO_AUTENTICADO", "Tu sesión expiró", peticion(null));

        assertEquals(401, res.getStatus());
        assertEquals("Tu sesión expiró", res.getContentAsString());
    }

    @Test
    void excepcionesTipadas_llevanSuStatusYCodigo() {
        assertEquals(HttpStatus.NOT_FOUND, new RecursoNoEncontradoException("x").getStatus());
        assertEquals("NO_ENCONTRADO", new RecursoNoEncontradoException("x").getCodigo());
        assertEquals(HttpStatus.FORBIDDEN, new AccesoDenegadoException("x").getStatus());
        assertEquals("ACCESO_DENEGADO", new AccesoDenegadoException("x").getCodigo());
        assertEquals(HttpStatus.CONFLICT, new ConflictoException("x").getStatus());
        assertEquals("CONFLICTO", new ConflictoException("x").getCodigo());
        assertEquals(HttpStatus.BAD_REQUEST, new ReglaNegocioException("x").getStatus());
        assertEquals("REGLA_NEGOCIO", new ReglaNegocioException("x").getCodigo());
        assertEquals(HttpStatus.UNAUTHORIZED, new NoAutenticadoException("x").getStatus());
        assertEquals("NO_AUTENTICADO", new NoAutenticadoException("x").getCodigo());
        assertEquals("x", new ReglaNegocioException("x").getMessage());
    }
}
