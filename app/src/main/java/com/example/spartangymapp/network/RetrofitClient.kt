package com.example.spartangymapp.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    // IMPORTANTE: 10.0.2.2 es el "localhost" para el Emulador de Android.
    // Si pruebas en un celular físico conectado por cable, debes poner la IP de tu PC (ej. 192.168.1.X)
    private const val BASE_URL = "http://10.0.2.2:8080/"

    val apiService: SpartanGymApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create()) // Convierte de JSON a Kotlin automático
            .build()
            .create(SpartanGymApi::class.java)
    }
}