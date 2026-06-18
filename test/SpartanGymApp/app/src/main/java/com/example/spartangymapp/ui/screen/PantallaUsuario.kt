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
import com.example.spartangymapp.network.DashboardResponse
import com.example.spartangymapp.network.RetrofitClient

@Composable
fun PantallaUsuario(
    usuario: String = "Socio",
    socioId: String = "",
    onCerrarSesion: () -> Unit = {}
) {
    var seccionActual by rememberSaveable { mutableStateOf(0) }
    var dashboard by remember { mutableStateOf<DashboardResponse?>(null) }
    var errorCarga by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(socioId) {
        if (socioId.isNotBlank()) {
            try {
                val response = RetrofitClient.apiService.obtenerDashboardSocio(socioId)
                if (response.isSuccessful) {
                    dashboard = response.body()
                    errorCarga = null
                } else {
                    errorCarga = "No se pudo cargar tu información desde la API."
                }
            } catch (e: Exception) {
                errorCarga = "No se pudo conectar con la API: ${e.message}"
            }
        }
    }

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
                0 -> UsuarioInicio(dashboard, errorCarga)
                1 -> UsuarioRutina(dashboard)
                2 -> UsuarioPagos(dashboard)
                3 -> UsuarioPerfil(usuario, dashboard)
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
private fun UsuarioInicio(dashboard: DashboardResponse?, errorCarga: String?) {
    val estadoAcceso = dashboard?.estadoAcceso ?: "Sin datos"
    val tipoMembresia = dashboard?.tipoMembresia ?: "Sin Membresía Activa"
    val fechaVencimiento = dashboard?.fechaVencimiento ?: "N/A"
    val objetivoRutina = dashboard?.objetivoRutina ?: "Sin rutina asignada"
    val nombreEntrenador = dashboard?.nombreEntrenador ?: "N/A"
    val totalEjercicios = dashboard?.totalEjercicios ?: 0
    val ultimoPeso = dashboard?.ultimoPesoKg?.toString() ?: "Sin registro"
    val notasMedidas = dashboard?.notasMedidas ?: "Sin notas registradas"

    errorCarga?.let { InfoCardUsuario("Conexión", "API no disponible", it, Color(0xFFE10613)) }

    InfoCardUsuario("Estado de Membresía", estadoAcceso, "$tipoMembresia · vence $fechaVencimiento", Color(0xFF35C85A))
    InfoCardUsuario("Próximo pago", fechaVencimiento, tipoMembresia, Color(0xFFE10613))

    TarjetaUsuario(
        titulo = "Mi Rutina Actual",
        descripcion = "Objetivo: $objetivoRutina\nAsignada por: $nombreEntrenador\nEjercicios: $totalEjercicios"
    )

    TarjetaUsuario(
        titulo = "Mi Progreso",
        descripcion = "Peso: $ultimoPeso kg\nNotas: $notasMedidas"
    )
}

@Composable
private fun UsuarioRutina(dashboard: DashboardResponse?) {
    val objetivoRutina = dashboard?.objetivoRutina ?: "Sin rutina asignada"
    val nombreEntrenador = dashboard?.nombreEntrenador ?: "N/A"
    val totalEjercicios = dashboard?.totalEjercicios ?: 0

    TituloSeccionUsuario("Mi Rutina", "Plan de entrenamiento asignado")

    ItemUsuario("Rutina actual", objetivoRutina, "$totalEjercicios ejercicios")
    ItemUsuario("Entrenador", nombreEntrenador, "Asignado")
}

@Composable
private fun UsuarioPagos(dashboard: DashboardResponse?) {
    TituloSeccionUsuario("Pagos", "Historial y próximos vencimientos")

    InfoCardUsuario("Próximo pago", dashboard?.fechaVencimiento ?: "N/A", dashboard?.tipoMembresia ?: "Sin membresía activa", Color(0xFFE10613))

    ItemUsuario("Estado", dashboard?.estadoAcceso ?: "Sin datos", "Base de datos")
}

@Composable
private fun UsuarioPerfil(usuario: String, dashboard: DashboardResponse?) {
    TituloSeccionUsuario("Perfil", "Información general del socio")

    ItemUsuario("Nombre", dashboard?.nombreCompleto ?: usuario, "Socio")
    ItemUsuario("Membresía", dashboard?.tipoMembresia ?: "Sin membresía activa", dashboard?.estadoAcceso ?: "Sin datos")
    ItemUsuario("Entrenador asignado", dashboard?.nombreEntrenador ?: "N/A", "Asignado")
    ItemUsuario("Objetivo", dashboard?.objetivoRutina ?: "Sin rutina asignada", "Activo")
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