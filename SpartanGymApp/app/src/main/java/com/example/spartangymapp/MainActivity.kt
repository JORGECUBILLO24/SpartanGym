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

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            SpartanGymAppTheme {
                SpartanGymNavigation()
            }
        }
    }
}

@Composable
fun SpartanGymNavigation() {
    var pantallaActual by rememberSaveable { mutableStateOf("inicio") }
    var usuarioActual by rememberSaveable { mutableStateOf("") }
    var rolActual by rememberSaveable { mutableStateOf("") }

    when (pantallaActual) {
        "inicio" -> PantallaInicio(
            onLoginSuccess = { usuario, rol ->
                usuarioActual = usuario
                rolActual = rol

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
            onCerrarSesion = {
                pantallaActual = "inicio"
                usuarioActual = ""
                rolActual = ""
            }
        )

        "entrenador" -> PantallaEntrenador(
            usuario = usuarioActual.ifBlank { "Entrenador" },
            onCerrarSesion = {
                pantallaActual = "inicio"
                usuarioActual = ""
                rolActual = ""
            }
        )
    }
}