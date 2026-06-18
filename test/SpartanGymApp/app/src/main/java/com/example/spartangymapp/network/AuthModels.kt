package com.example.spartangymapp.network

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val nombres: String,
    val apellidos: String,
    val telefono: String,
    val email: String,
    val password: String,
    val rol: String
)

data class RegisterPersonalRequest(
    val nombres: String,
    val apellidos: String,
    val telefono: String,
    val email: String,
    val password: String,
    val rol: String,
    val especialidad: String
)

data class AuthResponse(
    val id: String? = null,
    val token: String? = null,
    val email: String? = null,
    val rol: String? = null,
    val message: String? = null
)

data class DashboardResponse(
    val nombreCompleto: String? = null,
    val estadoAcceso: String? = null,
    val tipoMembresia: String? = null,
    val fechaVencimiento: String? = null,
    val ultimoPesoKg: Double? = null,
    val notasMedidas: String? = null,
    val objetivoRutina: String? = null,
    val nombreEntrenador: String? = null,
    val totalEjercicios: Int? = null
)
