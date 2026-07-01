package com.example.spartangymapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import com.example.spartangymapp.ui.screen.PantallaEntrenador
import com.example.spartangymapp.ui.screen.PantallaInicio
import com.example.spartangymapp.ui.screen.PantallaUsuario
import com.example.spartangymapp.ui.theme.SpartanGymAppTheme
import com.example.spartangymapp.network.RetrofitClient
import com.example.spartangymapp.network.AppConfigResponse
import androidx.compose.ui.graphics.Color

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Carga la URL del servidor guardada (emulador por defecto, o la IP configurada en un celular real).
        RetrofitClient.init(applicationContext)

        setContent {
            var accentColor by remember { mutableStateOf(Color(0xFFE10613)) }
            var appConfig by remember { mutableStateOf(AppConfigResponse()) }

            LaunchedEffect(Unit) {
                try {
                    val response = RetrofitClient.apiService.obtenerConfiguracion()
                    val config = response.body()
                    val colorHex = config?.accentColor
                    if (response.isSuccessful && config != null) {
                        appConfig = config
                        if (!colorHex.isNullOrBlank()) {
                            accentColor = colorFromHex(colorHex)
                        }
                    }
                } catch (_: Exception) {
                    accentColor = Color(0xFFE10613)
                }
            }

            SpartanGymAppTheme(accentColor = accentColor) {
                SpartanGymNavigation(appConfig = appConfig)
            }
        }
    }
}

private fun colorFromHex(hex: String): Color {
    val cleanHex = hex.trim().removePrefix("#")
    return try {
        Color(("ff$cleanHex").toLong(16))
    } catch (_: Exception) {
        Color(0xFFE10613)
    }
}

@Composable
fun SpartanGymNavigation(appConfig: AppConfigResponse = AppConfigResponse()) {
    var pantallaActual by rememberSaveable { mutableStateOf("inicio") }
    var usuarioActual by rememberSaveable { mutableStateOf("") }
    var rolActual by rememberSaveable { mutableStateOf("") }
    var usuarioIdActual by rememberSaveable { mutableStateOf("") }

    when (pantallaActual) {
        "inicio" -> PantallaInicio(
            appConfig = appConfig,
            onLoginSuccess = { usuario, rol, usuarioId ->
                usuarioActual = usuario
                rolActual = rol
                usuarioIdActual = usuarioId

                pantallaActual = when {
                    rol.contains("ENTRENADOR", ignoreCase = true) -> "entrenador"
                    rol.contains("TRAINER", ignoreCase = true) -> "entrenador"
                    rol.contains("PERSONAL", ignoreCase = true) -> "entrenador"
                    else -> "usuario"
                }
            }
        )

        "usuario" -> PantallaUsuario(
            usuario = usuarioActual.ifBlank { "Socio" },
            socioId = usuarioIdActual,
            appConfig = appConfig,
            onCerrarSesion = {
                pantallaActual = "inicio"
                usuarioActual = ""
                rolActual = ""
                usuarioIdActual = ""
                RetrofitClient.setAuthToken(null)
            }
        )

        "entrenador" -> PantallaEntrenador(
            usuario = usuarioActual.ifBlank { "Entrenador" },
            appConfig = appConfig,
            onCerrarSesion = {
                pantallaActual = "inicio"
                usuarioActual = ""
                rolActual = ""
                usuarioIdActual = ""
                RetrofitClient.setAuthToken(null)
            }
        )
    }
}
