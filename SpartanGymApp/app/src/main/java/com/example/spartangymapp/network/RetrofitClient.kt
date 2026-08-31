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
                val original: Request = chain.request()
                val token = authToken
                val request: Request = if (token.isNullOrBlank()) {
                    original
                } else {
                    original.newBuilder()
                        .addHeader("Authorization", "Bearer $token")
                        .build()
                }
                chain.proceed(request)
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
