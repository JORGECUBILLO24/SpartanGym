package ni.edu.uam.SpartanGymAPI.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FotoPerfilValidatorTest {

    @Test
    void validar_aceptaDataUrlDeImagen() {
        String entrada = "data:image/webp;base64,AAAA";
        assertEquals(entrada, FotoPerfilValidator.validar(entrada));
    }

    @Test
    void validar_nullDevuelveNull() {
        assertNull(FotoPerfilValidator.validar(null));
    }

    @Test
    void validar_vacioODeEspaciosDevuelveNull() {
        assertNull(FotoPerfilValidator.validar(""));
        assertNull(FotoPerfilValidator.validar("   "));
    }

    @Test
    void validar_rechazaUrlExternaQueNoEsDataUrl() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> FotoPerfilValidator.validar("https://ejemplo.com/foto.png"));
        assertEquals("La foto debe ser una imagen válida.", ex.getMessage());
    }

    @Test
    void validar_rechazaImagenDemasiadoGrande() {
        String grande = "data:image/webp;base64," + "A".repeat(700_001);
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> FotoPerfilValidator.validar(grande));
        assertEquals("La imagen es demasiado grande.", ex.getMessage());
    }
}
