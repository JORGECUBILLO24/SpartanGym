package com.example.spartangymapp.network

import com.example.spartangymapp.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private var authToken: String? = null

    fun setAuthToken(token: String?) {
        authToken = token
    }

    private val httpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(Interceptor { chain ->
                val token = authToken
                val builder: Request.Builder = chain.request().newBuilder()
                    // Pide el formato de error RFC 9457; ver mensajeDeError().
                    .header("Accept", ACCEPT_ERRORES)
                if (!token.isNullOrBlank()) {
                    builder.addHeader("Authorization", "Bearer $token")
                }
                chain.proceed(builder.build())
            })
            .build()
    }

    val apiService: SpartanGymApi by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create()) // Convierte de JSON a Kotlin automatico
            .build()
            .create(SpartanGymApi::class.java)
    }
}
