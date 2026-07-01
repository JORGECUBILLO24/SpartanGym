package com.example.spartangymapp.network

import android.content.Context
import android.content.SharedPreferences
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    // 10.0.2.2 es el "localhost" del Emulador de Android.
    // En un celular fisico se usa la IP del servidor dentro de la misma red (ej. 192.168.1.X:8080),
    // configurable desde la pantalla de inicio sin recompilar la app.
    private const val DEFAULT_BASE_URL = "http://10.0.2.2:8080/"
    private const val PREFS = "spartan_prefs"
    private const val KEY_BASE_URL = "base_url"

    private var appContext: Context? = null
    private var baseUrl: String = DEFAULT_BASE_URL
    private var authToken: String? = null

    @Volatile
    private var retrofit: Retrofit? = null

    /** Debe llamarse una vez al iniciar la app (MainActivity) para cargar la URL guardada. */
    fun init(context: Context) {
        appContext = context.applicationContext
        val guardada = prefs()?.getString(KEY_BASE_URL, null)
        if (!guardada.isNullOrBlank()) {
            baseUrl = guardada
        }
        retrofit = null
    }

    fun getBaseUrl(): String = baseUrl

    /** URL sin esquema ni "/" final, para mostrar/editar en la UI (ej. "10.0.2.2:8080"). */
    fun getServidorMostrable(): String =
        baseUrl.removePrefix("http://").removePrefix("https://").trimEnd('/')

    /** Cambia y persiste la URL del servidor. Acepta "192.168.1.5", "192.168.1.5:8080" o una URL completa. */
    fun setBaseUrl(input: String) {
        val normalizada = normalizarUrl(input)
        baseUrl = normalizada
        prefs()?.edit()?.putString(KEY_BASE_URL, normalizada)?.apply()
        retrofit = null // fuerza reconstruir el cliente con la nueva URL
    }

    fun setAuthToken(token: String?) {
        authToken = token
    }

    private fun prefs(): SharedPreferences? =
        appContext?.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

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

    val apiService: SpartanGymApi
        get() {
            val actual = retrofit ?: Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(httpClient)
                .addConverterFactory(GsonConverterFactory.create()) // Convierte de JSON a Kotlin automatico
                .build()
                .also { retrofit = it }
            return actual.create(SpartanGymApi::class.java)
        }

    /** Normaliza la entrada del usuario a una baseUrl valida para Retrofit (con esquema y "/" final). */
    fun normalizarUrl(input: String): String {
        var texto = input.trim()
        if (texto.isEmpty()) return DEFAULT_BASE_URL

        if (!texto.startsWith("http://") && !texto.startsWith("https://")) {
            texto = "http://$texto"
        }

        val esHttp = texto.startsWith("http://")
        val sinEsquema = texto.substringAfter("://")
        val hostPort = sinEsquema.substringBefore("/")
        val ruta = if (sinEsquema.contains("/")) "/" + sinEsquema.substringAfter("/") else ""

        // Si es http y no trae puerto, usar 8080 (puerto del backend por defecto).
        val hostPortFinal = if (esHttp && !hostPort.contains(":")) "$hostPort:8080" else hostPort

        var resultado = (if (esHttp) "http://" else "https://") + hostPortFinal + ruta
        if (!resultado.endsWith("/")) resultado += "/"
        return resultado
    }
}
