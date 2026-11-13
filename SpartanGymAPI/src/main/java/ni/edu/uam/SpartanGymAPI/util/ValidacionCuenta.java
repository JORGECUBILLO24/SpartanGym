package ni.edu.uam.SpartanGymAPI.util;

import ni.edu.uam.SpartanGymAPI.exceptions.ReglaNegocioException;

import java.util.Locale;
import java.util.regex.Pattern;

public final class ValidacionCuenta {

    private static final Pattern EMAIL = Pattern.compile(
            "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
    );

    private ValidacionCuenta() {
    }

    public static String email(String valor) {
        String normalizado = valor == null ? "" : valor.trim().toLowerCase(Locale.ROOT);
        if (normalizado.isBlank() || !EMAIL.matcher(normalizado).matches() || normalizado.length() > 100) {
            throw new ReglaNegocioException("Ingresa un correo electrónico válido.");
        }
        return normalizado;
    }

    public static String password(String valor) {
        if (valor == null || valor.length() < 8) {
            throw new ReglaNegocioException("La contraseña debe tener al menos 8 caracteres.");
        }
        return valor;
    }

    public static String requerido(String valor, String campo) {
        String normalizado = valor == null ? "" : valor.trim();
        if (normalizado.isBlank()) {
            throw new ReglaNegocioException("El campo " + campo + " es obligatorio.");
        }
        return normalizado;
    }
}
