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
fun PantallaUsuario(
    usuario: String = "Socio",
    onCerrarSesion: () -> Unit = {}
) {
    var seccionActual by rememberSaveable { mutableStateOf(0) }

    Scaffold(
        containerColor = Color.Black,
        bottomBar = {
            BarraNavegacionUsuario(
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
            HeaderUsuario(usuario, onCerrarSesion)

            Spacer(modifier = Modifier.height(20.dp))

            when (seccionActual) {
                0 -> UsuarioInicio()
                1 -> UsuarioRutina()
                2 -> UsuarioPagos()
                3 -> UsuarioPerfil(usuario)
            }
        }
    }
}

@Composable
private fun HeaderUsuario(usuario: String, onCerrarSesion: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "SPARTAN GYM",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "Socio · $usuario",
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
private fun UsuarioInicio() {
    InfoCardUsuario("Estado de Membresía", "Activa", "Mensual · vence el 30 May 2026", Color(0xFF35C85A))
    InfoCardUsuario("Próximo pago", "30 May 2026", "Quedan 30 días", Color(0xFFE10613))
    InfoCardUsuario("Asistencias este mes", "12 asistencias", "de 30 posibles", Color.White)

    TarjetaUsuario(
        titulo = "Mi Rutina Actual",
        descripcion = "Rutina de Hipertrofia - Nivel Intermedio\nAsignada por: Carlos Mendoza"
    )

    TarjetaUsuario(
        titulo = "Mi Progreso",
        descripcion = "Peso: 78.5 kg ↓ 1.2 kg\nIMC: 24.8 ↓ 0.3\nGrasa corporal: 15.2% ↓ 1.1%"
    )
}

@Composable
private fun UsuarioRutina() {
    TituloSeccionUsuario("Mi Rutina", "Plan de entrenamiento asignado")

    ItemUsuario("Lunes - Pecho y tríceps", "Press banca, aperturas, fondos y polea", "Día 1")
    ItemUsuario("Martes - Espalda y bíceps", "Remo, jalón, dominadas y curl", "Día 2")
    ItemUsuario("Jueves - Piernas", "Sentadilla, prensa, extensión y femoral", "Día 3")
    ItemUsuario("Viernes - Hombro y abdomen", "Press militar, laterales, crunch y plancha", "Día 4")
}

@Composable
private fun UsuarioPagos() {
    TituloSeccionUsuario("Pagos", "Historial y próximos vencimientos")

    InfoCardUsuario("Próximo pago", "30 May 2026", "Mensualidad pendiente", Color(0xFFE10613))

    ItemUsuario("Pago Abril 2026", "Registrado el 30 Abr 2026", "Pagado")
    ItemUsuario("Pago Marzo 2026", "Registrado el 30 Mar 2026", "Pagado")
    ItemUsuario("Pago Febrero 2026", "Registrado el 28 Feb 2026", "Pagado")
}

@Composable
private fun UsuarioPerfil(usuario: String) {
    TituloSeccionUsuario("Perfil", "Información general del socio")

    ItemUsuario("Nombre", usuario, "Socio")
    ItemUsuario("Membresía", "Mensual", "Activa")
    ItemUsuario("Entrenador asignado", "Carlos Mendoza", "Asignado")
    ItemUsuario("Objetivo", "Hipertrofia y mejora de rendimiento", "Activo")
}

@Composable
private fun BarraNavegacionUsuario(
    seleccionado: Int,
    onSeleccionar: (Int) -> Unit
) {
    val opciones = listOf(
        "Inicio",
        "Rutina",
        "Pagos",
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
                            1 -> "▣"
                            2 -> "$"
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
private fun TituloSeccionUsuario(titulo: String, subtitulo: String) {
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
private fun InfoCardUsuario(
    titulo: String,
    dato: String,
    descripcion: String,
    colorDato: Color
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
            Text(titulo, color = Color.Gray, fontSize = 14.sp)
            Text(dato, color = colorDato, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text(descripcion, color = Color.Gray, fontSize = 13.sp)
        }
    }
}

@Composable
private fun TarjetaUsuario(
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
        }
    }
}

@Composable
private fun ItemUsuario(
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