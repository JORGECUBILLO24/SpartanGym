package com.example.spartangymapp.ui.screen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun PantallaEntrenador(
    usuario: String = "Entrenador",
    onCerrarSesion: () -> Unit = {}
) {
    var seccionActual by rememberSaveable { mutableStateOf(0) }

    Scaffold(
        containerColor = Color.Black,
        bottomBar = {
            BarraNavegacionEntrenador(
                seleccionado = seccionActual,
                onSeleccionar = { seccionActual = it }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(18.dp)
                .verticalScroll(rememberScrollState())
        ) {
            HeaderEntrenador(usuario, onCerrarSesion)

            Spacer(modifier = Modifier.height(20.dp))

            when (seccionActual) {
                0 -> EntrenadorInicio()
                1 -> EntrenadorClientes()
                2 -> EntrenadorRutinas()
                3 -> EntrenadorPerfil(usuario)
            }
        }
    }
}

@Composable
private fun HeaderEntrenador(usuario: String, onCerrarSesion: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "SPARTAN GYM",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "Entrenador · $usuario",
                color = Color.Gray,
                fontSize = 14.sp
            )
        }

        TextButton(onClick = onCerrarSesion) {
            Text("Salir", color = Color(0xFFE10613), fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun EntrenadorInicio() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        MiniCardEntrenador("Clientes", "18", Modifier.weight(1f))
        MiniCardEntrenador("Evaluaciones", "5", Modifier.weight(1f))
        MiniCardEntrenador("Rutinas", "24", Modifier.weight(1f))
    }

    Spacer(modifier = Modifier.height(18.dp))

    TituloSeccionEntrenador("Próximas sesiones", "Agenda del día")

    ItemEntrenador("Ana López", "Sesión a las 9:00 a. m.", "Hoy")
    ItemEntrenador("Carlos Ruiz", "Sesión a las 11:30 a. m.", "Hoy")
    ItemEntrenador("María Torres", "Sesión a las 4:00 p. m.", "Hoy")

    TarjetaEntrenador(
        titulo = "Gestión de rutinas",
        descripcion = "Crea, edita y asigna planes de entrenamiento personalizados."
    )

    TarjetaEntrenador(
        titulo = "Evaluaciones físicas",
        descripcion = "Registra peso, IMC y medidas corporales de tus clientes."
    )
}

@Composable
private fun EntrenadorClientes() {
    TituloSeccionEntrenador("Clientes", "Socios asignados")

    ItemEntrenador("Ana López", "Objetivo: tonificación", "Activa")
    ItemEntrenador("Carlos Ruiz", "Objetivo: hipertrofia", "Pendiente")
    ItemEntrenador("María Torres", "Objetivo: pérdida de grasa", "Activa")
    ItemEntrenador("Juan Pérez", "Objetivo: fuerza", "Activa")
}

@Composable
private fun EntrenadorRutinas() {
    TituloSeccionEntrenador("Rutinas", "Planes creados por el entrenador")

    TarjetaEntrenador(
        titulo = "Crear nueva rutina",
        descripcion = "Diseña un nuevo plan de entrenamiento según el objetivo del socio."
    )

    ItemEntrenador("Rutina de Hipertrofia", "Asignada a 8 clientes", "Activa")
    ItemEntrenador("Rutina de Pérdida de Grasa", "Asignada a 5 clientes", "Activa")
    ItemEntrenador("Rutina de Fuerza", "Asignada a 4 clientes", "Activa")
}

@Composable
private fun EntrenadorPerfil(usuario: String) {
    TituloSeccionEntrenador("Perfil", "Información del entrenador")

    ItemEntrenador("Nombre", usuario, "Entrenador")
    ItemEntrenador("Clientes asignados", "18 clientes activos", "Activo")
    ItemEntrenador("Rutinas creadas", "24 rutinas registradas", "Sistema")
    ItemEntrenador("Evaluaciones pendientes", "5 evaluaciones por realizar", "Pendiente")
}

@Composable
private fun BarraNavegacionEntrenador(
    seleccionado: Int,
    onSeleccionar: (Int) -> Unit
) {
    val opciones = listOf(
        "Inicio",
        "Clientes",
        "Rutinas",
        "Perfil"
    )

    NavigationBar(containerColor = Color(0xFF101010)) {
        opciones.forEachIndexed { index, texto ->
            NavigationBarItem(
                selected = seleccionado == index,
                onClick = { onSeleccionar(index) },
                icon = {
                    Text(
                        text = when (index) {
                            0 -> "⌂"
                            1 -> "☷"
                            2 -> "▣"
                            else -> "○"
                        },
                        fontSize = 22.sp
                    )
                },
                label = { Text(texto) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Color(0xFFE10613),
                    selectedTextColor = Color(0xFFE10613),
                    unselectedIconColor = Color.Gray,
                    unselectedTextColor = Color.Gray,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}

@Composable
private fun TituloSeccionEntrenador(titulo: String, subtitulo: String) {
    Text(
        text = titulo,
        color = Color.White,
        fontSize = 26.sp,
        fontWeight = FontWeight.Black
    )
    Text(
        text = subtitulo,
        color = Color.Gray,
        fontSize = 14.sp,
        modifier = Modifier.padding(bottom = 16.dp)
    )
}

@Composable
private fun MiniCardEntrenador(
    titulo: String,
    dato: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.height(110.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF141414)),
        border = BorderStroke(1.dp, Color(0xFF292929))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(titulo, color = Color.Gray, fontSize = 13.sp)
            Text(dato, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun TarjetaEntrenador(
    titulo: String,
    descripcion: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF141414)),
        border = BorderStroke(1.dp, Color(0xFF292929))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(titulo, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(descripcion, color = Color.Gray, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = {},
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE10613))
            ) {
                Text("Abrir", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ItemEntrenador(
    titulo: String,
    detalle: String,
    etiqueta: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 10.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF101010)),
        border = BorderStroke(1.dp, Color(0xFF292929))
    ) {
        Row(
            modifier = Modifier.padding(16.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(titulo, color = Color.White, fontWeight = FontWeight.Bold)
                Text(detalle, color = Color.Gray, fontSize = 13.sp)
            }

            Text(
                text = etiqueta,
                color = Color(0xFFE10613),
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
        }
    }
}