package ni.edu.uam.spartangym

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import ni.edu.uam.spartangym.navigation.Pantalla
import ni.edu.uam.spartangym.ui.screens.EntrenadorScreen
import ni.edu.uam.spartangym.ui.screens.RegistroScreen
import ni.edu.uam.spartangym.ui.screens.SocioScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SpartanGymApp()
        }
    }
}

@Composable
fun SpartanGymApp() {
    var pantallaActual by rememberSaveable {
        mutableStateOf(Pantalla.REGISTRO)
    }

    MaterialTheme {
        when (pantallaActual) {
            Pantalla.REGISTRO -> RegistroScreen(
                onSocioClick = {
                    pantallaActual = Pantalla.SOCIO
                },
                onEntrenadorClick = {
                    pantallaActual = Pantalla.ENTRENADOR
                }
            )

            Pantalla.SOCIO -> SocioScreen()

            Pantalla.ENTRENADOR -> EntrenadorScreen()
        }
    }
}