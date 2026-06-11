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

data class AuthResponse(
    val token: String? = null,
    val email: String? = null,
    val rol: String? = null,
    val message: String? = null
)