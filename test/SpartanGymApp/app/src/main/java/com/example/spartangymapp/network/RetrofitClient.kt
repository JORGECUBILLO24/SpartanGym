package com.example.spartangymapp.network

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    // IMPORTANTE: 10.0.2.2 es el "localhost" para el Emulador de Android.
    // Si pruebas en un celular físico conectado por cable, debes poner la IP de tu PC (ej. 192.168.1.X)
    private const val BASE_URL = "http://10.0.2.2:8080/"
    private var authToken: String? = null

    fun setAuthToken(token: String?) {
        authToken = token
    }

    private val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor { chain ->
                val original = chain.request()
                val token = authToken
                val request = if (token.isNullOrBlank()) {
                    original
                } else {
                    original.newBuilder()
                        .addHeader("Authorization", "Bearer $token")
                        .build()
                }
                chain.proceed(request)
            }
            .build()
    }

    val apiService: SpartanGymApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create()) // Convierte de JSON a Kotlin automático
            .build()
            .create(SpartanGymApi::class.java)
    }
}
