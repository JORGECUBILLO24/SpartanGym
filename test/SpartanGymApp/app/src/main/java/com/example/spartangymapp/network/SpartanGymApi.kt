package com.example.spartangymapp.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface SpartanGymApi {

    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<AuthResponse>

    @POST("api/auth/register")
    suspend fun registrarSocio(
        @Body request: RegisterRequest
    ): Response<AuthResponse>

    @POST("api/personal/registrar")
    suspend fun registrarEntrenador(
        @Body request: RegisterPersonalRequest
    ): Response<AuthResponse>

    @GET("api/dashboard/inicio/{socioId}")
    suspend fun obtenerDashboardSocio(
        @Path("socioId") socioId: String
    ): Response<DashboardResponse>
}
