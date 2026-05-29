package ni.edu.uam.spartangym.navigation

enum class Pantalla {
    REGISTRO,
    SOCIO,
    ENTRENADOR
}

enum class RolUsuario(val texto: String) {
    SOCIO("Socio"),
    ENTRENADOR("Entrenador")
}