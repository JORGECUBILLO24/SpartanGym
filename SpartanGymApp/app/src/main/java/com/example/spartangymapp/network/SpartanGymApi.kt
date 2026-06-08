package com.example.spartangymapp.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface SpartanGymApi {

    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<AuthResponse>

    @POST("api/auth/register")
    suspend fun registrarSocio(
        @Body request: RegisterRequest
    ): Response<AuthResponse>

    @POST("api/auth/register-personal")
    suspend fun registrarEntrenador(
        @Body request: RegisterRequest
    ): Response<AuthResponse>
}