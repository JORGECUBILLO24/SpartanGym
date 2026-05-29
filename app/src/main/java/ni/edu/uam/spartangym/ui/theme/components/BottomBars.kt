package ni.edu.uam.spartangym.ui.components

import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import ni.edu.uam.spartangym.ui.theme.Gris
import ni.edu.uam.spartangym.ui.theme.Rojo

@Composable
fun BottomMenuSocio(
    seleccionado: Int,
    onSeleccionar: (Int) -> Unit
) {
    val opciones = listOf(
        "⌂" to "Inicio",
        "▣" to "Rutina",
        "▤" to "Pagos",
        "○" to "Perfil"
    )

    NavigationBar(
        containerColor = Color(0xFF101010)
    ) {
        opciones.forEachIndexed { index, item ->
            NavigationBarItem(
                selected = seleccionado == index,
                onClick = { onSeleccionar(index) },
                icon = {
                    Text(
                        text = item.first,
                        fontSize = 24.sp
                    )
                },
                label = {
                    Text(item.second)
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Rojo,
                    selectedTextColor = Rojo,
                    unselectedIconColor = Gris,
                    unselectedTextColor = Gris,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}

@Composable
fun BottomMenuEntrenador(
    seleccionado: Int,
    onSeleccionar: (Int) -> Unit
) {
    val opciones = listOf(
        "⌂" to "Inicio",
        "☷" to "Clientes",
        "▣" to "Rutinas",
        "○" to "Perfil"
    )

    NavigationBar(
        containerColor = Color(0xFF101010)
    ) {
        opciones.forEachIndexed { index, item ->
            NavigationBarItem(
                selected = seleccionado == index,
                onClick = { onSeleccionar(index) },
                icon = {
                    Text(
                        text = item.first,
                        fontSize = 24.sp
                    )
                },
                label = {
                    Text(item.second)
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Rojo,
                    selectedTextColor = Rojo,
                    unselectedIconColor = Gris,
                    unselectedTextColor = Gris,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}