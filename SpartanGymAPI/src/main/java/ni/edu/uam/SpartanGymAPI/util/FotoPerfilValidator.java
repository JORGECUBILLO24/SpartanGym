package ni.edu.uam.SpartanGymAPI.util;

/**
 * Validación pura y aislada de la foto de perfil (data URL base64), testeable
 * sin la capa web ni la base de datos. Convención de errores del proyecto:
 * RuntimeException plano, que GlobalExceptionHandler traduce a 400.
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
            throw new RuntimeException("La foto debe ser una imagen válida.");
        }
        if (fotoUrl.length() > LONGITUD_MAXIMA) {
            throw new RuntimeException("La imagen es demasiado grande.");
        }
        return fotoUrl;
    }
}
