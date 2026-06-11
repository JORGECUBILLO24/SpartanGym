package com.example.spartangymapp.ui.screen

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.spartangymapp.R

@Composable
fun PantallaUsuario() {
    val spartanRed = Color(0xFFE10613)
    val cardBg = Color(0xFF141414)

    Scaffold(
        containerColor = Color.Black,
        bottomBar = { BarraNavegacionInferior(spartanRed) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            HeaderSpartan()

            InfoCardExacta(
                titulo = "Estado de Membresía",
                valor = "Activa",
                sub1 = "Mensual",
                sub2 = "Vence el 30 May 2026",
                icono = Icons.Filled.CheckCircle,
                colorIcono = Color(0xFF4CAF50),
                boton = "Ver detalles >"
            )

            InfoCardSimple("Próximo Pago", "30 May 2026", "Quedan 30 días", Icons.Outlined.CalendarToday, spartanRed, "Ver historial >")

            AsistenciasCardCompact(spartanRed)

            RutinaActualCard(spartanRed, cardBg)

            ProgresoCard()

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

@Composable
fun HeaderSpartan() {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            painter = painterResource(id = R.drawable.logo_web),
            contentDescription = "Logo",
            modifier = Modifier.height(30.dp)
        )
        BadgedBox(badge = { Badge(containerColor = Color(0xFFE10613)) { Text("3") } }) {
            Icon(Icons.Outlined.Notifications, null, tint = Color.White, modifier = Modifier.size(24.dp))
        }
    }
}

@Composable
fun InfoCardExacta(titulo: String, valor: String, sub1: String, sub2: String, icono: androidx.compose.ui.graphics.vector.ImageVector, colorIcono: Color, boton: String) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF141414))) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icono, null, tint = colorIcono, modifier = Modifier.size(32.dp))
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(titulo, color = Color.Gray, fontSize = 12.sp)
                Text(valor, color = colorIcono, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                Text(sub1, color = Color.White, fontSize = 14.sp)
                Text(sub2, color = Color.Gray, fontSize = 12.sp)
            }
            Text(boton, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun InfoCardSimple(titulo: String, valor: String, sub1: String, icono: androidx.compose.ui.graphics.vector.ImageVector, colorIcono: Color, botonTexto: String) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF141414))) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icono, null, tint = colorIcono, modifier = Modifier.size(28.dp))
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(titulo, color = Color.Gray, fontSize = 12.sp)
                Text(valor, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(sub1, color = Color.LightGray, fontSize = 14.sp)
            }
            Text(botonTexto, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun AsistenciasCardCompact(redColor: Color) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF141414))) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.FitnessCenter, null, tint = redColor, modifier = Modifier.size(32.dp))
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("Asistencias este mes", color = Color.Gray, fontSize = 12.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("12 ", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("asistencias", color = redColor, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(Modifier.width(12.dp))
                    LinearProgressIndicator(progress = 0.4f, modifier = Modifier.width(60.dp).height(6.dp).clip(RoundedCornerShape(3.dp)), color = redColor, trackColor = Color.DarkGray)
                }
                Text("de 30 posibles", color = Color.Gray, fontSize = 12.sp)
            }
            Spacer(Modifier.width(12.dp))
            Surface(onClick = {}, shape = RoundedCornerShape(8.dp), color = Color.Transparent, border = BorderStroke(1.dp, Color.Gray)) {
                Text("Ver más", modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp), color = Color.White, fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun RutinaActualCard(redColor: Color, cardBg: Color) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = cardBg)) {
        Row(modifier = Modifier.padding(20.dp)) {
            Column(modifier = Modifier.weight(1.5f)) {
                Text("Mi Rutina Actual", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(Modifier.height(6.dp))
                Text("Rutina de Hipertrofia - Nivel Intermedio", color = Color.White, fontSize = 14.sp)
                Text("Asignado por: Carlos Mendoza", color = Color.Gray, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
                Button(onClick = {}, colors = ButtonDefaults.buttonColors(containerColor = redColor), shape = RoundedCornerShape(8.dp), contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp)) {
                    Text("Ver rutina completa", fontSize = 13.sp)
                }
            }
            Spacer(Modifier.width(12.dp))
            Image(painter = painterResource(id = R.drawable.image_03453d), contentDescription = null, modifier = Modifier.size(110.dp).clip(RoundedCornerShape(10.dp)), contentScale = ContentScale.Crop)
        }
    }
}

@Composable
fun ProgresoCard() {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF141414))) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Mi Progreso", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("Ver progreso completo >", color = Color.Gray, fontSize = 12.sp)
            }
            Text("Evolución de medidas", color = Color.Gray, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(12.dp))
            ProgresoRow("Peso", "78.5 kg", "↓ 1.2 kg")
            Divider(color = Color.DarkGray, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 12.dp))
            ProgresoRow("IMC", "24.8", "↓ 0.3")
            Divider(color = Color.DarkGray, thickness = 0.5.dp, modifier = Modifier.padding(vertical = 12.dp))
            ProgresoRow("% Grasa Corporal", "15.2 %", "↓ 1.1 %")
        }
    }
}

@Composable
fun ProgresoRow(label: String, valor: String, cambio: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Color.LightGray, fontSize = 14.sp)
        Row {
            Text(valor, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(Modifier.width(16.dp))
            Text(cambio, color = Color.Green, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
    }
}

@Composable
fun BarraNavegacionInferior(red: Color) {
    NavigationBar(containerColor = Color.Black) {
        val items = listOf("Inicio" to Icons.Filled.Home, "Rutina" to Icons.Filled.FitnessCenter, "Pagos" to Icons.Filled.Wallet, "Perfil" to Icons.Filled.Person)
        items.forEachIndexed { index, item ->
            NavigationBarItem(selected = index == 0, onClick = {}, icon = { Icon(item.second, null) }, label = { Text(item.first, fontSize = 12.sp) }, colors = NavigationBarItemDefaults.colors(selectedIconColor = red, unselectedIconColor = Color.Gray, indicatorColor = Color.Transparent))
        }
    }
}