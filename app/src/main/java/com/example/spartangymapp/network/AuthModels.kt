package com.example.spartangymapp.network

// Lo que enviamos en el POST
data class LoginRequest(
    val email: String,
    val password: String
)

// Lo que nos responde la API
data class AuthResponse(
    val token: String,
    val email: String,
    val rol: String
)