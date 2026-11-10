package com.example.spartangymapp

import android.os.Bundle
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.fragment.app.FragmentActivity
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
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.delay

class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )
        val lifecycle = lifecycle

        setContent {
            val configuracionLocal = remember {
                getSharedPreferences("gym_branding", MODE_PRIVATE)
            }
            val nombreGimnasioGuardado = remember {
                configuracionLocal.getString("gym_name", "Spartan Gym")?.trim().takeUnless { it.isNullOrBlank() } ?: "Spartan Gym"
            }
            val nombreAppGuardado = remember {
                configuracionLocal.getString("app_name", null)?.trim().takeUnless { it.isNullOrBlank() } ?: nombreGimnasioGuardado
            }
            val appConfigInicial = remember(configuracionLocal, nombreGimnasioGuardado, nombreAppGuardado) {
                AppConfigResponse(
                    gymName = nombreGimnasioGuardado,
                    appName = nombreAppGuardado,
                    appLogo = configuracionLocal.getString("app_logo", null),
                    appLogoNombre = configuracionLocal.getString("app_logo_nombre", null),
                    logoPrincipal = configuracionLocal.getString("logo_principal", null),
                    logoPrincipalNombre = configuracionLocal.getString("logo_principal_nombre", null),
                    logoAcceso = configuracionLocal.getString("logo_acceso", null),
                    logoAccesoNombre = configuracionLocal.getString("logo_acceso_nombre", null),
                    fondoLogin = configuracionLocal.getString("fondo_login", null),
                    accentColor = configuracionLocal.getString("accent_color", null)
                )
            }
            var accentColor by remember {
                mutableStateOf(colorFromHex(configuracionLocal.getString("accent_color", null)))
            }
            var appConfig by remember { mutableStateOf(appConfigInicial) }

            LaunchedEffect(lifecycle) {
                lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
                    while (true) {
                    try {
                        val response = RetrofitClient.apiService.obtenerConfiguracion()
                        val config = response.body()
                        if (response.isSuccessful && config != null) {
                            val nombreRemoto = config.gymName?.trim()?.takeIf { it.isNotEmpty() }
                            val nombreAppRemoto = config.appName?.trim()?.takeIf { it.isNotEmpty() }
                            if (nombreRemoto != null) {
                                configuracionLocal.edit().putString("gym_name", nombreRemoto).apply()
                            }
                            val nombreVisible = nombreAppRemoto ?: nombreRemoto ?: nombreAppGuardado
                            val configuracionActualizada = config.copy(
                                gymName = nombreRemoto ?: nombreGimnasioGuardado,
                                appName = nombreVisible
                            )
                            configuracionLocal.edit()
                                .putString("gym_name", configuracionActualizada.gymName)
                                .putString("app_name", configuracionActualizada.appName)
                                .putString("app_logo", configuracionActualizada.appLogo)
                                .putString("app_logo_nombre", configuracionActualizada.appLogoNombre)
                                .putString("logo_principal", configuracionActualizada.logoPrincipal)
                                .putString("logo_principal_nombre", configuracionActualizada.logoPrincipalNombre)
                                .putString("logo_acceso", configuracionActualizada.logoAcceso)
                                .putString("logo_acceso_nombre", configuracionActualizada.logoAccesoNombre)
                                .putString("fondo_login", configuracionActualizada.fondoLogin)
                                .putString("accent_color", configuracionActualizada.accentColor)
                                .apply()
                            appConfig = configuracionActualizada
                            config.accentColor?.takeIf { it.isNotBlank() }?.let { accentColor = colorFromHex(it) }
                        }
                    } catch (_: Exception) {
                        // Mantiene el nombre guardado para que la app siga identificada sin red.
                    }
                        delay(30_000L)
                    }
                }
            }

            SpartanGymAppTheme(accentColor = accentColor) {
                SpartanGymNavigation(appConfig = appConfig)
            }
        }
    }
}

private fun colorFromHex(hex: String?): Color {
    val cleanHex = hex?.trim()?.removePrefix("#") ?: return Color(0xFFE10613)
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

    Crossfade(targetState = pantallaActual, animationSpec = tween(150), label = "Cambio de sesión") { pantalla ->
    when (pantalla) {
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
}
