package com.example.spartangymapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.spartangymapp.ui.screen.PantallaInicio
import com.example.spartangymapp.ui.screen.PantallaUsuario


import com.example.spartangymapp.ui.theme.SpartanGymAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SpartanGymAppTheme {
                // Aquí mandamos a llamar a tu pantalla de inicio
                PantallaUsuario()
            }
        }
    }
}