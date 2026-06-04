package com.example.spartangymapp.network

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val nombreCompleto: String,
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