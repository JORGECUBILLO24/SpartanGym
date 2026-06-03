package com.example.spartangymapp.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface SpartanGymApi {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
}