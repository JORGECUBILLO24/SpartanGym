package ni.edu.uam.SpartanGymAPI.util;

import ni.edu.uam.SpartanGymAPI.exceptions.ReglaNegocioException;

/**
 * Validación pura y aislada de la foto de perfil (data URL base64), testeable
 * sin la capa web ni la base de datos. Los errores son ReglaNegocioException,
 * que GlobalExceptionHandler traduce a 400.
 */
public final class FotoPerfilValidator {

    private static final int LONGITUD_MAXIMA = 700_000;

    private FotoPerfilValidator() {
    }

    public static String validar(String fotoUrl) {
        if (fotoUrl == null || fotoUrl.isBlank()) {
            return null;
        }
        if (!fotoUrl.startsWith("data:image/")) {
            throw new ReglaNegocioException("La foto debe ser una imagen válida.");
        }
        if (fotoUrl.length() > LONGITUD_MAXIMA) {
            throw new ReglaNegocioException("La imagen es demasiado grande.");
        }
        return fotoUrl;
    }
}
