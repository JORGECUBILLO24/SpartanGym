// FILE: PantallaUsuario.kt (VERSIÓN PROFESIONAL - solo datos API)
package com.example.spartangymapp.ui.screen

import android.Manifest
import android.content.pm.PackageManager
import android.util.Size as CameraSize
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CreditCard
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.QrCodeScanner
import androidx.compose.material.icons.rounded.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.spartangymapp.R
import com.example.spartangymapp.network.AppConfigResponse
import com.example.spartangymapp.network.AsistenciaQrRequest
import com.example.spartangymapp.network.AsistenciaQrValidationResponse
import com.example.spartangymapp.network.CompraMembresiaAppRequest
import com.example.spartangymapp.network.CompraProductoAppRequest
import com.example.spartangymapp.network.ControlBiometricoResponse
import com.example.spartangymapp.network.DashboardResponse
import com.example.spartangymapp.network.FacturaMembresiaAppResponse
import com.example.spartangymapp.network.TipoMembresiaResponse
import com.example.spartangymapp.network.PagoSocioResponse
import com.example.spartangymapp.network.PerfilActualResponse
import com.example.spartangymapp.network.ProductoCatalogoResponse
import com.example.spartangymapp.network.RegistroProgresoRequest
import com.example.spartangymapp.network.RetrofitClient
import com.example.spartangymapp.network.RutinaResumenResponse
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.zxing.BinaryBitmap
import com.google.zxing.MultiFormatReader
import com.google.zxing.NotFoundException
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.common.HybridBinarizer
import androidx.compose.ui.graphics.asImageBitmap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicReference

// ─── Colores del sistema ────────────────────────────────────────────────────
private val Rojo = Color(0xFFE10613)
private val RojoOscuro = Color(0xFF340609)
private val Negro = Color(0xFF0A0A0A)
private val SuperficieOscura = Color(0xFF111111)
private val Superficie = Color(0xFF181818)
private val BordeSutil = Color(0xFF242424)
private val GrisTexto = Color(0xFF8A8A8A)
private val VerdeEstado = Color(0xFF22C55E)

// ─── Modelos internos ──────────────────────────────────────────────────────
private data class EjercicioSocio(
    val nombre: String,
    val detalle: String,
    val zona: String,
    val completado: Boolean = false
)

private data class RutinaSocio(
    val nombre: String,
    val objetivo: String,
    val dificultad: String,
    val dias: Int,
    val foco: String,
    val progreso: Float,
    val ejercicios: List<EjercicioSocio>
)

private data class SocioNavItem(
    val label: String,
    val icon: ImageVector
)

private fun RutinaResumenResponse.toRutinaSocio(index: Int): RutinaSocio {
    val ejerciciosMapeados = ejercicios.orEmpty().map { e ->
        val partes = listOfNotNull(
            e.series?.let { "$it series" },
            e.repeticiones?.let { "$it reps" },
            e.pesoSugeridoKg?.let { "${it}kg" },
            e.tiempoDescansoSegundos?.let { "${it}s descanso" }
        )
        EjercicioSocio(
            nombre = e.ejercicio ?: "Ejercicio ${index + 1}",
            detalle = partes.joinToString(" · ").ifBlank { "—" },
            zona = e.grupoMuscular ?: "General"
        )
    }
    val zonas = ejerciciosMapeados.map { it.zona }.distinct().take(3).joinToString(" · ")
    return RutinaSocio(
        nombre = nombre?.ifBlank { null } ?: objetivo?.ifBlank { null } ?: "Rutina ${index + 1}",
        objetivo = objetivo ?: "—",
        dificultad = tipoRutina?.ifBlank { null } ?: "Asignada",
        dias = ejerciciosMapeados.size,
        foco = zonas.ifBlank { "—" },
        progreso = 0f,
        ejercicios = ejerciciosMapeados
    )
}

// Formatea valores nullable de API: null → "—"
private fun String?.apiValor(fallback: String = "—") =
    this?.trim()?.ifBlank { null } ?: fallback

private fun Double?.apiValor(unit: String = "") =
    this?.let { "$it$unit" } ?: "—"

private fun Int?.apiValor() = this?.toString() ?: "—"

// ─── Pantalla principal ────────────────────────────────────────────────────
@Composable
fun PantallaUsuario(
    usuario: String = "Socio",
    onCerrarSesion: () -> Unit = {},
    socioId: String,
    appConfig: AppConfigResponse
) {
    var seccionActual by rememberSaveable { mutableStateOf(0) }
    var subPantalla by rememberSaveable { mutableStateOf("") }
    var rutinaSeleccionada by rememberSaveable { mutableStateOf(0) }

    val rutinas = remember { mutableStateListOf<RutinaSocio>() }
    var dashboard by remember { mutableStateOf<DashboardResponse?>(null) }
    var perfilActual by remember { mutableStateOf<PerfilActualResponse?>(null) }
    var pagos by remember { mutableStateOf<List<PagoSocioResponse>>(emptyList()) }
    var productos by remember { mutableStateOf<List<ProductoCatalogoResponse>>(emptyList()) }
    var progreso by remember { mutableStateOf<List<ControlBiometricoResponse>>(emptyList()) }
    var tiposMembresia by remember { mutableStateOf<List<TipoMembresiaResponse>>(emptyList()) }
    var refreshKey by remember { mutableStateOf(0) }
    var cargando by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(socioId, refreshKey) {
        cargando = true
        error = null
        rutinas.clear()
        try {
            val d = RetrofitClient.apiService.obtenerDashboardSocio(socioId)
            val p = RetrofitClient.apiService.obtenerPerfilActual()
            val r = RetrofitClient.apiService.obtenerRutinasSocio(socioId)
            val pg = RetrofitClient.apiService.obtenerPagosSocio(socioId)
            val pr = RetrofitClient.apiService.listarProductosCatalogo()
            val bio = RetrofitClient.apiService.obtenerProgresoSocio(socioId)
            val tm = RetrofitClient.apiService.listarTiposMembresia()

            dashboard = d.body()
            perfilActual = p.body()
            rutinas.addAll(r.body().orEmpty().mapIndexed { i, it -> it.toRutinaSocio(i) })
            pagos = pg.body().orEmpty()
            productos = pr.body().orEmpty()
            progreso = bio.body().orEmpty()
            tiposMembresia = tm.body().orEmpty()
        } catch (e: Exception) {
            error = e.message
        } finally {
            cargando = false
        }
    }

    LaunchedEffect(rutinas.size) {
        if (rutinaSeleccionada >= rutinas.size) rutinaSeleccionada = 0
    }

    val nombreMostrar = run {
        val n = listOfNotNull(perfilActual?.nombres, perfilActual?.apellidos)
            .filter { it.isNotBlank() }.joinToString(" ")
        n.ifBlank { dashboard?.nombreCompleto.apiValor(usuario) }
    }

    Scaffold(
        containerColor = Negro,
        bottomBar = {
            BarraNavegacion(
                seleccionado = seccionActual,
                onSeleccionar = { seccionActual = it; subPantalla = "" }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Negro)
                .then(
                    if (seccionActual == 4 && subPantalla.isBlank()) Modifier
                    else Modifier.statusBarsPadding()
                )
                .verticalScroll(rememberScrollState())
        ) {
            when {
                cargando -> PantallaCargando()
                error != null -> PantallaError(error!!)
                else -> when {
                    subPantalla == "membresia" -> DetalleMembresiaUsuario(
                        dashboard = dashboard, onVolver = { subPantalla = "" }
                    )
                    subPantalla == "rutina_detalle" && rutinas.isNotEmpty() ->
                        DetalleRutinaUsuario(
                            rutina = rutinas[rutinaSeleccionada],
                            onToggleEjercicio = { idx ->
                                val r = rutinas[rutinaSeleccionada]
                                val lista = r.ejercicios.toMutableList()
                                lista[idx] = lista[idx].copy(completado = !lista[idx].completado)
                                rutinas[rutinaSeleccionada] = r.copy(ejercicios = lista)
                            },
                            onVolver = { subPantalla = "" }
                        )
                    subPantalla == "pago" -> PagoUsuario(
                        dashboard = dashboard, onVolver = { subPantalla = "" }
                    )
                    subPantalla == "progreso" -> ProgresoUsuario(
                        progreso = progreso,
                        socioId = socioId,
                        onActualizado = { progreso = it },
                        onVolver = { subPantalla = "" }
                    )
                    subPantalla == "productos" -> ProductosUsuario(
                        productos = productos,
                        appConfig = appConfig,
                        onActualizado = { productos = it },
                        onVolver = { subPantalla = "" }
                    )
                    subPantalla == "renovar_membresia" -> RenovarMembresiaUsuario(
                        tipos = tiposMembresia,
                        appConfig = appConfig,
                        onRenovado = { refreshKey++ },
                        onVolver = { subPantalla = "" }
                    )
                    else -> when (seccionActual) {
                        0 -> TabInicio(
                            nombre = nombreMostrar,
                            dashboard = dashboard,
                            rutina = rutinas.getOrNull(rutinaSeleccionada),
                            productosCount = productos.size,
                            onMembresia = { subPantalla = "membresia" },
                            onRutina = { subPantalla = "rutina_detalle" },
                            onProgreso = { subPantalla = "progreso" },
                            onPago = { seccionActual = 2; subPantalla = "pago" },
                            onProductos = { subPantalla = "productos" }
                        )
                        1 -> TabRutinas(
                            rutinas = rutinas,
                            rutinaSeleccionada = rutinaSeleccionada,
                            onSeleccionar = { rutinaSeleccionada = it },
                            onAbrirDetalle = { subPantalla = "rutina_detalle" }
                        )
                        2 -> TabPagos(
                            dashboard = dashboard,
                            pagos = pagos,
                            onPagar = { subPantalla = "pago" },
                            onRenovar = { subPantalla = "renovar_membresia" }
                        )
                        3 -> TabQrAsistencia(appConfig = appConfig)
                        4 -> TabPerfilCredencial(
                            nombre = nombreMostrar,
                            correo = perfilActual?.email.apiValor(),
                            telefono = perfilActual?.telefono.apiValor(),
                            rol = perfilActual?.rol.apiValor(),
                            estado = (perfilActual?.estadoAcceso ?: dashboard?.estadoAcceso).apiValor(),
                            membresia = (dashboard?.tipoMembresia ?: perfilActual?.tipo).apiValor(),
                            vencimiento = dashboard?.fechaVencimiento.apiValor(),
                            entrenador = dashboard?.nombreEntrenador.apiValor(),
                            ejercicios = dashboard?.totalEjercicios.apiValor(),
                            sucursal = perfilActual?.sucursal.apiValor(sucursalPrincipalTexto(appConfig)),
                            appConfig = appConfig
                        )
                        else -> {}
                    }
                }
            }
        }
    }
}

// ─── Carga y error ──────────────────────────────────────────────────────────
@Composable
private fun PantallaCargando() {
    Box(
        modifier = Modifier.fillMaxWidth().padding(64.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary, strokeWidth = 2.dp)
            Spacer(Modifier.height(16.dp))
            Text("Cargando tu perfil", color = GrisTexto, fontSize = 14.sp)
        }
    }
}

@Composable
private fun PantallaError(mensaje: String) {
    Column(modifier = Modifier.padding(20.dp)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1A0608), RoundedCornerShape(16.dp))
                .padding(20.dp)
        ) {
            Column {
                Text("Sin conexión", color = MaterialTheme.colorScheme.primary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text("No se pudo conectar con el servidor", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(8.dp))
                Text(mensaje, color = GrisTexto, fontSize = 12.sp)
            }
        }
    }
}

// ─── TAB: Inicio ───────────────────────────────────────────────────────────
@Composable
private fun TabInicio(
    nombre: String,
    dashboard: DashboardResponse?,
    rutina: RutinaSocio?,
    productosCount: Int,
    onMembresia: () -> Unit,
    onRutina: () -> Unit,
    onProgreso: () -> Unit,
    onPago: () -> Unit,
    onProductos: () -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        // Header
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Hola, ${nombre.split(" ").firstOrNull() ?: nombre}",
                    color = GrisTexto,
                    fontSize = 15.sp
                )
                Text(
                    text = "Tu plan hoy",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Image(
                    painter = painterResource(id = R.drawable.logo_spartangym),
                    contentDescription = "Spartan Gym",
                    modifier = Modifier
                        .width(76.dp)
                        .height(44.dp),
                    contentScale = ContentScale.Fit
                )
                Spacer(Modifier.height(6.dp))
                EstadoBadge(dashboard?.estadoAcceso.apiValor())
            }
        }

        Spacer(Modifier.height(24.dp))

        // Hero card — rutina activa
        HeroRutinaCard(rutina = rutina, onClick = onRutina)

        Spacer(Modifier.height(16.dp))

        // Stats rápidos desde dashboard
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard(
                label = "Ejercicios",
                valor = dashboard?.totalEjercicios.apiValor(),
                modifier = Modifier.weight(1f)
            )
            StatCard(
                label = "Peso",
                valor = dashboard?.ultimoPesoKg.apiValor("kg"),
                modifier = Modifier.weight(1f)
            )
            StatCard(
                label = "Membresía",
                valor = dashboard?.tipoMembresia.apiValor(),
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(Modifier.height(24.dp))

        // Acciones rápidas con borde izquierdo (firma visual)
        Text("Acciones rápidas", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            AccionCard("Membresía", dashboard?.tipoMembresia.apiValor(), onMembresia)
            AccionCard("Rutina", rutina?.nombre.apiValor(), onRutina)
            AccionCard("Progreso", dashboard?.ultimoPesoKg.apiValor("kg"), onProgreso)
            AccionCard("Pago", dashboard?.fechaVencimiento.apiValor(), onPago)
        }

        // Ventana de la tienda del gym
        Spacer(Modifier.height(24.dp))
        Text("Tienda del gym", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))
        ProductosBanner(productosCount = productosCount, onClick = onProductos)

        // Entrenador asignado (solo si API lo devuelve)
        if (!dashboard?.nombreEntrenador.isNullOrBlank()) {
            Spacer(Modifier.height(24.dp))
            FilaDatoAPI(
                titulo = "Entrenador asignado",
                valor = dashboard!!.nombreEntrenador!!,
                etiqueta = "API"
            )
        }
    }
}

// ─── Hero card ─────────────────────────────────────────────────────────────
@Composable
private fun HeroRutinaCard(rutina: RutinaSocio?, onClick: () -> Unit) {
    val colorPrincipal = MaterialTheme.colorScheme.primary
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 210.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(
                Brush.linearGradient(
                    listOf(colorPrincipal.copy(alpha = 0.22f), Color(0xFF0A0A0A))
                )
            )
            .clickable(enabled = rutina != null) { onClick() }
    ) {
        Image(
            painter = painterResource(id = R.drawable.image_03453d),
            contentDescription = "Entrenamiento Spartan Gym",
            modifier = Modifier.matchParentSize(),
            contentScale = ContentScale.Crop
        )
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Black.copy(alpha = 0.16f), Color.Black.copy(alpha = 0.88f))
                    )
                )
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(20.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .width(3.dp)
                        .height(40.dp)
                        .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(2.dp))
                )
                Spacer(Modifier.width(12.dp))
                Column {
                    Text("PLAN ACTIVO", color = MaterialTheme.colorScheme.primary, fontSize = 11.sp, fontWeight = FontWeight.Black)
                    Text(
                        text = rutina?.nombre?.uppercase() ?: "SIN RUTINA ASIGNADA",
                        color = Color.White,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            if (rutina != null) {
                Spacer(Modifier.height(16.dp))
                Text(
                    text = "Zonas: ${rutina.foco}",
                    color = GrisTexto,
                    fontSize = 13.sp
                )
                Spacer(Modifier.height(12.dp))
                BarraProgreso(rutina.progreso)
                Spacer(Modifier.height(12.dp))
                Text(
                    "${rutina.ejercicios.size} ejercicios · ${rutina.dificultad}",
                    color = GrisTexto,
                    fontSize = 12.sp
                )
            } else {
                Spacer(Modifier.height(12.dp))
                Text(
                    "El administrador aún no ha asignado una rutina.",
                    color = GrisTexto,
                    fontSize = 13.sp
                )
            }
        }
    }
}

// ─── TAB: Rutinas ──────────────────────────────────────────────────────────
@Composable
private fun TabRutinas(
    rutinas: List<RutinaSocio>,
    rutinaSeleccionada: Int,
    onSeleccionar: (Int) -> Unit,
    onAbrirDetalle: () -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        SeccionHeader("Mis rutinas", "Plan asignado desde el servidor")
        Spacer(Modifier.height(16.dp))

        if (rutinas.isEmpty()) {
            EstadoVacioAPI("Sin rutinas", "El administrador asignará tu plan desde el panel.")
            return@Column
        }

        if (rutinas.size > 1) {
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                rutinas.forEachIndexed { i, r ->
                    Chip(r.nombre, i == rutinaSeleccionada) { onSeleccionar(i) }
                }
            }
            Spacer(Modifier.height(16.dp))
        }

        val rutina = rutinas[rutinaSeleccionada]

        // Tarjeta resumen rutina
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Superficie)
                .padding(20.dp)
        ) {
            Column {
                Text(rutina.nombre, color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
                Text(rutina.objetivo, color = MaterialTheme.colorScheme.primary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Text("${rutina.dias} ejercicios · ${rutina.foco}", color = GrisTexto, fontSize = 13.sp)
                Spacer(Modifier.height(16.dp))
                BarraProgreso(rutina.progreso)
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = onAbrirDetalle,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Ver plan completo", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(Modifier.height(24.dp))
        Text("Ejercicios", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))

        rutina.ejercicios.forEach { ItemEjercicio(it) {} }
    }
}

// ─── TAB: Pagos ───────────────────────────────────────────────────────────
@Composable
private fun TabPagos(
    dashboard: DashboardResponse?,
    pagos: List<PagoSocioResponse>,
    onPagar: () -> Unit,
    onRenovar: () -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        SeccionHeader("Pagos", "Historial y estado de membresía")
        Spacer(Modifier.height(16.dp))

        // Estado membresía
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Superficie)
                .padding(20.dp)
        ) {
            Column {
                Text("Vencimiento", color = GrisTexto, fontSize = 12.sp)
                Spacer(Modifier.height(4.dp))
                Text(
                    dashboard?.fechaVencimiento.apiValor(),
                    color = Color.White,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Black
                )
                Spacer(Modifier.height(4.dp))
                Text(dashboard?.tipoMembresia.apiValor(), color = GrisTexto, fontSize = 14.sp)
                Spacer(Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilaDatoInline("Acceso", dashboard?.estadoAcceso.apiValor())
                }
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = onRenovar,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Renovar / Pagar membresía", color = Color.White, fontWeight = FontWeight.Bold)
                }
                TextButton(onClick = onPagar, modifier = Modifier.fillMaxWidth()) {
                    Text("Ver detalle de pago", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(Modifier.height(24.dp))
        Text("Historial", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))

        if (pagos.isEmpty()) {
            EstadoVacioAPI("Sin registros", "Los pagos aparecerán aquí cuando sean registrados.")
        } else {
            pagos.forEach { pago ->
                FilaDatoAPI(
                    titulo = pago.fechaTransaccion.apiValor(),
                    valor = pago.metodoPago.apiValor() + " · " + (pago.monto?.let { "$it" } ?: "—"),
                    etiqueta = "Pagado"
                )
            }
        }
    }
}

// ─── TAB: Perfil ──────────────────────────────────────────────────────────
@Composable
private fun TabPerfil(
    nombre: String, correo: String, telefono: String, rol: String,
    estado: String, membresia: String, vencimiento: String,
    entrenador: String, ejercicios: String, sucursal: String
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        // Avatar + nombre
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(MaterialTheme.colorScheme.primary, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    nombre.take(1).uppercase(),
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black
                )
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(nombre, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                Text(correo, color = GrisTexto, fontSize = 13.sp)
                Spacer(Modifier.height(4.dp))
                EstadoBadge(estado)
            }
        }

        Spacer(Modifier.height(24.dp))

        // Datos de API
        Text("Información de cuenta", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))

        val campos = listOf(
            "Teléfono" to telefono,
            "Rol" to rol,
            "Membresía" to membresia,
            "Vencimiento" to vencimiento,
            "Entrenador" to entrenador,
            "Ejercicios asignados" to ejercicios,
            "Sucursal" to sucursal
        )
        campos.forEach { (k, v) -> FilaDatoAPI(k, v, "API") }
    }
}

// ─── Sub-pantallas ─────────────────────────────────────────────────────────
@Composable
private fun DetalleMembresiaUsuario(dashboard: DashboardResponse?, onVolver: () -> Unit) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        BotonVolver(onVolver)
        Spacer(Modifier.height(16.dp))
        SeccionHeader("Membresía", "Estado de acceso")
        Spacer(Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Superficie)
                .padding(20.dp)
        ) {
            Column {
                Text(dashboard?.estadoAcceso.apiValor(), color = VerdeEstado, fontSize = 36.sp, fontWeight = FontWeight.Black)
                Text(dashboard?.tipoMembresia.apiValor(), color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text("Vence: ${dashboard?.fechaVencimiento.apiValor()}", color = GrisTexto, fontSize = 14.sp)
            }
        }

        Spacer(Modifier.height(16.dp))

        FilaDatoAPI("Entrenador", dashboard?.nombreEntrenador.apiValor(), "API")
        FilaDatoAPI("Rutina objetivo", dashboard?.objetivoRutina.apiValor(), "API")
        FilaDatoAPI("Total ejercicios", dashboard?.totalEjercicios.apiValor(), "API")
    }
}

@Composable
private fun DetalleRutinaUsuario(
    rutina: RutinaSocio,
    onToggleEjercicio: (Int) -> Unit,
    onVolver: () -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        BotonVolver(onVolver)
        Spacer(Modifier.height(16.dp))
        SeccionHeader(rutina.nombre, rutina.objetivo)
        Spacer(Modifier.height(16.dp))

        // Ring de progreso
        Row(verticalAlignment = Alignment.CenterVertically) {
            RingProgreso(rutina.progreso, Modifier.size(80.dp))
            Spacer(Modifier.width(16.dp))
            Column {
                Text("${rutina.ejercicios.size} ejercicios", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                Text(rutina.foco, color = GrisTexto, fontSize = 13.sp)
                Text(rutina.dificultad, color = MaterialTheme.colorScheme.primary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(Modifier.height(24.dp))
        Text("Ejercicios", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))

        rutina.ejercicios.forEachIndexed { i, e ->
            ItemEjercicio(e) { onToggleEjercicio(i) }
        }
    }
}

@Composable
private fun PagoUsuario(dashboard: DashboardResponse?, onVolver: () -> Unit) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        BotonVolver(onVolver)
        Spacer(Modifier.height(16.dp))
        SeccionHeader("Estado de pago", "Datos sincronizados con la API")
        Spacer(Modifier.height(16.dp))

        FilaDatoAPI("Membresía", dashboard?.tipoMembresia.apiValor(), "API")
        FilaDatoAPI("Vencimiento", dashboard?.fechaVencimiento.apiValor(), "Fecha")
        FilaDatoAPI("Estado de acceso", dashboard?.estadoAcceso.apiValor(), "API")

        Spacer(Modifier.height(16.dp))

        Button(
            onClick = onVolver,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Volver", color = Color.White, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ProgresoUsuario(
    progreso: List<ControlBiometricoResponse>,
    socioId: String,
    onActualizado: (List<ControlBiometricoResponse>) -> Unit,
    onVolver: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var peso by remember { mutableStateOf("") }
    var notas by remember { mutableStateOf("") }
    var guardando by remember { mutableStateOf(false) }
    var mensaje by remember { mutableStateOf<String?>(null) }

    fun registrar() {
        val pesoNum = peso.trim().replace(',', '.').toDoubleOrNull()
        if (pesoNum == null || pesoNum <= 0) {
            mensaje = "Ingresa un peso válido en kg."
            return
        }
        if (guardando) return
        guardando = true
        mensaje = null
        scope.launch {
            try {
                RetrofitClient.apiService.registrarProgreso(
                    RegistroProgresoRequest(idSocio = socioId, pesoKg = pesoNum, medidasNotas = notas.trim().ifBlank { null })
                )
                val actualizado = RetrofitClient.apiService.obtenerProgresoSocio(socioId).body().orEmpty()
                onActualizado(actualizado)
                peso = ""
                notas = ""
                mensaje = "✅ Progreso registrado"
            } catch (e: Exception) {
                mensaje = e.message ?: "No se pudo registrar el progreso."
            } finally {
                guardando = false
            }
        }
    }

    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        BotonVolver(onVolver)
        Spacer(Modifier.height(16.dp))
        SeccionHeader("Progreso", "Registra y sigue tu peso")
        Spacer(Modifier.height(16.dp))

        // Formulario para que el socio registre su propio progreso
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            color = Superficie,
            border = BorderStroke(1.dp, BordeSutil)
        ) {
            Column(Modifier.padding(18.dp)) {
                Text("Registrar medición", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = peso,
                    onValueChange = { peso = it },
                    label = { Text("Peso (kg)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                        focusedBorderColor = MaterialTheme.colorScheme.primary, unfocusedBorderColor = BordeSutil,
                        focusedLabelColor = MaterialTheme.colorScheme.primary, unfocusedLabelColor = GrisTexto,
                        cursorColor = MaterialTheme.colorScheme.primary
                    )
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = notas,
                    onValueChange = { notas = it },
                    label = { Text("Notas / medidas (opcional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                        focusedBorderColor = MaterialTheme.colorScheme.primary, unfocusedBorderColor = BordeSutil,
                        focusedLabelColor = MaterialTheme.colorScheme.primary, unfocusedLabelColor = GrisTexto,
                        cursorColor = MaterialTheme.colorScheme.primary
                    )
                )
                mensaje?.let {
                    Spacer(Modifier.height(10.dp))
                    Text(it, color = if (it.startsWith("✅")) VerdeEstado else MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { registrar() },
                    enabled = !guardando,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (guardando) {
                        CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(10.dp))
                    }
                    Text(if (guardando) "Guardando" else "Registrar progreso", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(Modifier.height(24.dp))

        if (progreso.isEmpty()) {
            EstadoVacioAPI("Sin mediciones", "Registra tu primer peso arriba para empezar a ver tu progreso.")
        } else {
            val ordenado = progreso.sortedByDescending { it.fechaRegistro ?: "" }
            val ultimo = ordenado.first()
            val primero = ordenado.last()
            val delta = if (ultimo.pesoKg != null && primero.pesoKg != null) ultimo.pesoKg - primero.pesoKg else null

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Superficie)
                    .padding(20.dp)
            ) {
                Column {
                    Text("Peso actual", color = GrisTexto, fontSize = 12.sp)
                    Spacer(Modifier.height(4.dp))
                    Text(ultimo.pesoKg.apiValor("kg"), color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Black)
                    if (delta != null) {
                        val signo = if (delta > 0) "+" else ""
                        Text(
                            "$signo${"%.1f".format(delta)} kg desde tu primera medición",
                            color = MaterialTheme.colorScheme.primary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(Modifier.height(2.dp))
                    Text("${progreso.size} mediciones registradas", color = GrisTexto, fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(24.dp))
            Text("Historial", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(10.dp))

            ordenado.forEach { registro ->
                val notas = registro.medidasNotas?.takeIf { it.isNotBlank() }?.let { " · $it" } ?: ""
                FilaDatoAPI(
                    titulo = (registro.fechaRegistro?.take(10)).apiValor(),
                    valor = registro.pesoKg.apiValor("kg") + notas,
                    etiqueta = "Peso"
                )
            }
        }
    }
}

// ─── Renovar / pagar membresia (socio desde la app) ─────────────────────────
@Composable
private fun RenovarMembresiaUsuario(
    tipos: List<TipoMembresiaResponse>,
    appConfig: AppConfigResponse,
    onRenovado: () -> Unit,
    onVolver: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var seleccionId by remember { mutableStateOf<Int?>(null) }
    var metodo by remember { mutableStateOf("Efectivo") }
    var procesando by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var factura by remember { mutableStateOf<FacturaMembresiaAppResponse?>(null) }

    fun pagar() {
        val id = seleccionId
        if (id == null) {
            error = "Selecciona un plan"
            return
        }
        if (procesando) return
        procesando = true
        error = null
        scope.launch {
            try {
                val resp = RetrofitClient.apiService.renovarMiMembresia(
                    CompraMembresiaAppRequest(tipoMembresiaId = id, metodoPago = metodo)
                )
                val cuerpo = resp.body()
                if (!resp.isSuccessful || cuerpo == null) {
                    val detalle = resp.errorBody()?.string()?.takeIf { it.isNotBlank() }
                    error = detalle ?: "No se pudo procesar el pago (${resp.code()})."
                } else {
                    factura = cuerpo
                    onRenovado()
                }
            } catch (e: Exception) {
                error = e.message ?: "No se pudo procesar el pago."
            } finally {
                procesando = false
            }
        }
    }

    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        BotonVolver(onVolver)
        Spacer(Modifier.height(16.dp))
        SeccionHeader("Membresía", "Renueva o paga tu plan")
        Spacer(Modifier.height(16.dp))

        val fac = factura
        if (fac != null) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color(0xFF0D2B18),
                border = BorderStroke(1.dp, VerdeEstado.copy(alpha = 0.35f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(Modifier.padding(20.dp)) {
                    Text("✅ Pago registrado", color = VerdeEstado, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    Spacer(Modifier.height(10.dp))
                    FilaDatoAPI("Factura", fac.numeroFactura.apiValor(), "MEM")
                    FilaDatoAPI("Plan", fac.tipoMembresia.apiValor(), "Membresía")
                    FilaDatoAPI("Total", "${simboloMoneda(appConfig.currency)}${"%.2f".format(fac.total ?: 0.0)}", "Pagado")
                    FilaDatoAPI("Vence", fac.fechaVencimiento.apiValor(), "Fecha")
                }
            }
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onVolver,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Listo", color = Color.White, fontWeight = FontWeight.Bold)
            }
        } else if (tipos.isEmpty()) {
            EstadoVacioAPI("Sin planes", "No hay planes de membresía disponibles.")
        } else {
            Text("Elige tu plan", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(10.dp))
            tipos.forEach { tipo ->
                val sel = seleccionId == tipo.id
                Surface(
                    modifier = Modifier.fillMaxWidth().clickable { seleccionId = tipo.id },
                    shape = RoundedCornerShape(14.dp),
                    color = if (sel) MaterialTheme.colorScheme.primary.copy(alpha = 0.16f) else Superficie,
                    border = BorderStroke(1.dp, if (sel) MaterialTheme.colorScheme.primary else BordeSutil)
                ) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(tipo.nombre.apiValor(), color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text("${tipo.duracionDias ?: 0} días", color = GrisTexto, fontSize = 12.sp)
                        }
                        Text(
                            "${simboloMoneda(appConfig.currency)}${"%.2f".format(tipo.precio ?: 0.0)}",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
            }

            Spacer(Modifier.height(8.dp))
            Text("Método de pago", color = GrisTexto, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Efectivo", "Tarjeta", "Transferencia").forEach { m ->
                    val activo = metodo == m
                    Surface(
                        modifier = Modifier.weight(1f).clickable { metodo = m },
                        shape = RoundedCornerShape(10.dp),
                        color = if (activo) MaterialTheme.colorScheme.primary.copy(alpha = 0.16f) else Superficie,
                        border = BorderStroke(1.dp, if (activo) MaterialTheme.colorScheme.primary else BordeSutil)
                    ) {
                        Text(
                            m,
                            color = if (activo) Color.White else GrisTexto,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp)
                        )
                    }
                }
            }

            error?.let {
                Spacer(Modifier.height(12.dp))
                Text(it, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(Modifier.height(16.dp))
            Button(
                onClick = { pagar() },
                enabled = !procesando && seleccionId != null,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    disabledContainerColor = BordeSutil
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (procesando) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(10.dp))
                }
                Text(if (procesando) "Procesando" else "Pagar y generar factura", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ─── Tienda / Productos ──────────────────────────────────────────────────────
private fun simboloMoneda(codigo: String?): String = when (codigo?.trim()?.uppercase()) {
    "NIO", "C$", "CORDOBA", "CÓRDOBA" -> "C$"
    "EUR" -> "€"
    else -> "$"
}

@Composable
private fun ProductosBanner(productosCount: Int, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Superficie)
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(46.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.16f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.Rounded.ShoppingCart,
                contentDescription = "Productos",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(22.dp)
            )
        }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text("Productos del gym", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
            Text(
                if (productosCount > 0) "$productosCount productos disponibles" else "Ver catálogo de la tienda",
                color = GrisTexto,
                fontSize = 12.sp
            )
        }
        Text("Ver →", color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ProductoImagen(imagenUrl: String?, modifier: Modifier = Modifier) {
    var bitmap by remember(imagenUrl) { mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null) }
    LaunchedEffect(imagenUrl) {
        bitmap = withContext(Dispatchers.IO) { cargarImagenConfiguracion(imagenUrl)?.asImageBitmap() }
    }
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        val img = bitmap
        if (img != null) {
            Image(
                bitmap = img,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Icon(
                Icons.Rounded.ShoppingCart,
                contentDescription = null,
                tint = GrisTexto,
                modifier = Modifier.size(22.dp)
            )
        }
    }
}

@Composable
private fun ProductosUsuario(
    productos: List<ProductoCatalogoResponse>,
    appConfig: AppConfigResponse,
    onActualizado: (List<ProductoCatalogoResponse>) -> Unit,
    onVolver: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var comprandoId by remember { mutableStateOf<String?>(null) }
    var mensaje by remember { mutableStateOf<String?>(null) }
    var esError by remember { mutableStateOf(false) }

    fun comprar(producto: ProductoCatalogoResponse) {
        val id = producto.id ?: return
        if (comprandoId != null) return
        comprandoId = id
        mensaje = null
        scope.launch {
            try {
                val resp = RetrofitClient.apiService.comprarProducto(CompraProductoAppRequest(productoId = id, cantidad = 1))
                val cuerpo = resp.body()
                if (!resp.isSuccessful || cuerpo == null) {
                    val detalle = resp.errorBody()?.string()?.takeIf { it.isNotBlank() }
                    esError = true
                    mensaje = detalle ?: "No se pudo completar la compra (${resp.code()})."
                } else {
                    esError = false
                    mensaje = "✅ Compra registrada. Factura ${cuerpo.numeroFactura ?: ""}. Retírala en recepción."
                    onActualizado(RetrofitClient.apiService.listarProductosCatalogo().body().orEmpty())
                }
            } catch (e: Exception) {
                esError = true
                mensaje = e.message ?: "No se pudo completar la compra."
            } finally {
                comprandoId = null
            }
        }
    }

    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        BotonVolver(onVolver)
        Spacer(Modifier.height(16.dp))
        SeccionHeader("Productos del gym", "Compra y retira en recepción")
        Spacer(Modifier.height(16.dp))

        mensaje?.let {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = if (esError) Color(0xFF1A0608) else Color(0xFF0D2B18),
                border = BorderStroke(1.dp, if (esError) MaterialTheme.colorScheme.primary.copy(alpha = 0.35f) else VerdeEstado.copy(alpha = 0.35f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    it,
                    color = if (esError) MaterialTheme.colorScheme.primary else VerdeEstado,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(14.dp)
                )
            }
            Spacer(Modifier.height(14.dp))
        }

        if (productos.isEmpty()) {
            EstadoVacioAPI("Sin productos", "Aún no hay productos disponibles en tu sucursal.")
        } else {
            productos.forEach { producto ->
                ItemProducto(
                    producto = producto,
                    appConfig = appConfig,
                    comprando = comprandoId == producto.id,
                    onComprar = { comprar(producto) }
                )
                Spacer(Modifier.height(10.dp))
            }
        }
    }
}

@Composable
private fun ItemProducto(
    producto: ProductoCatalogoResponse,
    appConfig: AppConfigResponse,
    comprando: Boolean,
    onComprar: () -> Unit
) {
    val agotado = (producto.stock ?: 0) <= 0
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Superficie,
        border = BorderStroke(1.dp, BordeSutil)
    ) {
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                ProductoImagen(
                    imagenUrl = producto.imagenUrl,
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF1A1A1A))
                )
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        producto.nombre.apiValor(),
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(producto.categoria.apiValor(), color = GrisTexto, fontSize = 12.sp)
                    Text(
                        if (agotado) "Agotado" else "Stock: ${producto.stock}",
                        color = if (agotado) MaterialTheme.colorScheme.primary else VerdeEstado,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    "${simboloMoneda(appConfig.currency)}${"%.2f".format(producto.precio ?: 0.0)}",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black
                )
            }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = onComprar,
                enabled = !agotado && !comprando,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    disabledContainerColor = BordeSutil
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (comprando) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                }
                Text(
                    if (agotado) "Agotado" else "Comprar (retiro en recepción)",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }
        }
    }
}

// ─── Barra de navegación ──────────────────────────────────────────────────
@Composable
private fun TabQrAsistencia(appConfig: AppConfigResponse) {
    val scope = rememberCoroutineScope()
    var tokenEscaneado by rememberSaveable { mutableStateOf("") }
    var validando by remember { mutableStateOf(false) }
    var errorQr by remember { mutableStateOf<String?>(null) }
    var mensajeQr by remember { mutableStateOf<String?>(null) }
    var validacion by remember { mutableStateOf<AsistenciaQrValidationResponse?>(null) }
    var ultimoTokenEnviado by rememberSaveable { mutableStateOf("") }

    fun validarTokenQrWeb(token: String) {
        val tokenLimpio = token.trim()

        if (tokenLimpio.isBlank()) {
            errorQr = "Primero escanea el QR que aparece en recepcion."
            return
        }

        if (!tokenLimpio.startsWith("SPARTAN_GYM_VALIDACION_WEB|")) {
            validacion = null
            mensajeQr = null
            errorQr = "Este QR no corresponde a la validacion web de asistencia."
            ultimoTokenEnviado = ""
            return
        }

        if (validando || ultimoTokenEnviado == tokenLimpio) return

        validando = true
        errorQr = null
        mensajeQr = "Validando asistencia..."
        ultimoTokenEnviado = tokenLimpio

        scope.launch {
            try {
                val respuesta = RetrofitClient.apiService.validarQrWeb(AsistenciaQrRequest(tokenLimpio))
                val cuerpo = respuesta.body()

                if (!respuesta.isSuccessful || cuerpo == null) {
                    val detalleError = respuesta.errorBody()?.string()?.takeIf { it.isNotBlank() }
                    errorQr = detalleError ?: "No se pudo validar la asistencia (${respuesta.code()})."
                    mensajeQr = null
                    ultimoTokenEnviado = ""
                } else {
                    validacion = cuerpo
                    errorQr = null
                    mensajeQr = "✅ Asistencia validada"
                }
            } catch (e: Exception) {
                errorQr = e.message ?: "No se pudo conectar con la API."
                mensajeQr = null
                ultimoTokenEnviado = ""
            } finally {
                validando = false
            }
        }
    }

    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        SeccionHeader("Escanear QR", appConfig.gymName?.takeIf { it.isNotBlank() } ?: "Spartan Gym")
        Spacer(Modifier.height(16.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            color = Superficie,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.34f))
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "Escanea el QR de recepcion",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    "Apunta la camara al codigo de la web y confirma tu asistencia.",
                    color = GrisTexto,
                    fontSize = 13.sp
                )

                Spacer(Modifier.height(20.dp))

                QrScannerCamera(
                    activo = !validando && validacion == null,
                    onTokenDetectado = { token ->
                        val tokenLimpio = token.trim()
                        tokenEscaneado = tokenLimpio
                        validacion = null
                        errorQr = null
                        mensajeQr = "QR detectado. Validando asistencia..."
                        validarTokenQrWeb(tokenLimpio)
                    }
                )

                Spacer(Modifier.height(16.dp))

                if (tokenEscaneado.isBlank()) {
                    EstadoVacioAPI("Sin QR detectado", "Coloca el codigo de la web dentro del visor.")
                } else {
                    FilaDatoAPI("QR detectado", tokenEscaneado.take(28) + "...", "Web")
                }

                validacion?.let { respuesta ->
                    Spacer(Modifier.height(10.dp))
                    FilaDatoAPI("Socio", respuesta.socio.apiValor(), "API")
                    FilaDatoAPI("Membresia", (respuesta.tipoMembresia ?: respuesta.membresia).apiValor(), "API")
                    FilaDatoAPI("Estado", respuesta.estado.apiValor(), "Check-in")
                    FilaDatoAPI("Hora", respuesta.fechaHora.apiValor(), "BD")
                }

                mensajeQr?.let { mensaje ->
                    Spacer(Modifier.height(12.dp))
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = if (validacion != null) Color(0xFF0D2B18) else MaterialTheme.colorScheme.primary.copy(alpha = 0.16f),
                        border = BorderStroke(1.dp, if (validacion != null) VerdeEstado.copy(alpha = 0.35f) else MaterialTheme.colorScheme.primary.copy(alpha = 0.35f))
                    ) {
                        Text(
                            mensaje,
                            color = if (validacion != null) VerdeEstado else MaterialTheme.colorScheme.primary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.fillMaxWidth().padding(14.dp)
                        )
                    }
                }

                errorQr?.let { error ->
                    Spacer(Modifier.height(12.dp))
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color(0xFF1A0608),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.35f))
                    ) {
                        Text(
                            error,
                            color = MaterialTheme.colorScheme.primary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.fillMaxWidth().padding(14.dp)
                        )
                    }
                }

                Spacer(Modifier.height(18.dp))

                Button(
                    onClick = {
                        val token = tokenEscaneado.trim()
                        validarTokenQrWeb(token)
                    },
                    enabled = !validando && validacion == null && tokenEscaneado.isNotBlank(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (validando) {
                        CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(10.dp))
                    }
                    Text(
                        when {
                            validando -> "Validando asistencia"
                            tokenEscaneado.isBlank() -> "Esperando QR"
                            else -> "Reintentar validacion"
                        },
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }

                TextButton(
                    onClick = {
                        tokenEscaneado = ""
                        validacion = null
                        mensajeQr = null
                        errorQr = null
                        ultimoTokenEnviado = ""
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Escanear otro QR", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@OptIn(ExperimentalGetImage::class)
@Composable
private fun QrScannerCamera(
    activo: Boolean,
    onTokenDetectado: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val onTokenActualizado = rememberUpdatedState(onTokenDetectado)
    val activoActualizado = rememberUpdatedState(activo)
    val mainExecutor = remember(context) { ContextCompat.getMainExecutor(context) }
    val ultimoToken = remember { AtomicReference("") }
    var tienePermiso by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
    }
    val pedirPermiso = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { concedido ->
        tienePermiso = concedido
    }
    val previewView = remember(context) {
        PreviewView(context).apply {
            implementationMode = PreviewView.ImplementationMode.COMPATIBLE
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }

    LaunchedEffect(Unit) {
        if (!tienePermiso) {
            pedirPermiso.launch(Manifest.permission.CAMERA)
        }
    }

    DisposableEffect(tienePermiso, lifecycleOwner) {
        if (!tienePermiso) {
            onDispose { }
        } else {
            val cameraExecutor = Executors.newSingleThreadExecutor()
            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
            val listener = Runnable {
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
                val analyzer = ImageAnalysis.Builder()
                    .setTargetResolution(CameraSize(1280, 720))
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { imageAnalysis ->
                        imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                            try {
                                if (!activoActualizado.value) return@setAnalyzer
                                val texto = decodificarQr(imageProxy)?.trim().orEmpty()
                                if (texto.isNotBlank() && ultimoToken.getAndSet(texto) != texto) {
                                    mainExecutor.execute { onTokenActualizado.value(texto) }
                                }
                            } finally {
                                imageProxy.close()
                            }
                        }
                    }

                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    analyzer
                )
            }

            cameraProviderFuture.addListener(listener, mainExecutor)

            onDispose {
                if (cameraProviderFuture.isDone) {
                    cameraProviderFuture.get().unbindAll()
                }
                cameraExecutor.shutdown()
            }
        }
    }

    if (!tienePermiso) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            EstadoVacioAPI("Permiso de camara", "Autoriza la camara para escanear el QR de recepcion.")
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = { pedirPermiso.launch(Manifest.permission.CAMERA) },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Permitir camara", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    } else {
        AndroidView(
            factory = { previewView },
            modifier = Modifier
                .fillMaxWidth()
                .height(320.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(Color.Black)
        )
    }
}

@androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
private fun decodificarQr(imageProxy: ImageProxy): String? {
    val imagen = imageProxy.image ?: return null
    val ancho = imagen.width
    val alto = imagen.height
    val planoY = imagen.planes[0]
    val buffer = planoY.buffer
    val rowStride = planoY.rowStride
    val pixelStride = planoY.pixelStride
    val datos = ByteArray(ancho * alto)
    val fila = ByteArray(rowStride)
    var offset = 0

    for (y in 0 until alto) {
        buffer.position(y * rowStride)
        buffer.get(fila, 0, minOf(rowStride, buffer.remaining()))
        for (x in 0 until ancho) {
            datos[offset++] = fila[x * pixelStride]
        }
    }

    val source = PlanarYUVLuminanceSource(datos, ancho, alto, 0, 0, ancho, alto, false)
    val bitmap = BinaryBitmap(HybridBinarizer(source))

    return try {
        MultiFormatReader().decode(bitmap).text
    } catch (_: NotFoundException) {
        null
    }
}

@Composable
private fun BarraNavegacion(seleccionado: Int, onSeleccionar: (Int) -> Unit) {
    val tabs = listOf(
        SocioNavItem("Inicio", Icons.Rounded.Home),
        SocioNavItem("Rutina", Icons.Rounded.FitnessCenter),
        SocioNavItem("Pagos", Icons.Rounded.CreditCard),
        SocioNavItem("QR", Icons.Rounded.QrCodeScanner),
        SocioNavItem("Perfil", Icons.Rounded.Person)
    )
    Surface(
        color = Color(0xFF0B0B0B),
        tonalElevation = 0.dp,
        border = BorderStroke(1.dp, Color(0xFF1F1F1F))
    ) {
        NavigationBar(containerColor = Color.Transparent, tonalElevation = 0.dp) {
            tabs.forEachIndexed { i, item ->
                val activo = seleccionado == i
            NavigationBarItem(
                selected = activo,
                onClick = { onSeleccionar(i) },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label,
                        modifier = Modifier.size(if (activo) 24.dp else 21.dp)
                    )
                },
                label = {
                    Text(
                        item.label,
                        fontSize = 11.sp,
                        fontWeight = if (activo) FontWeight.Black else FontWeight.Medium
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Color.White,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = GrisTexto,
                    unselectedTextColor = GrisTexto,
                    indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.18f)
                )
            )
            }
        }
    }
}

// ─── Componentes reutilizables ─────────────────────────────────────────────
@Composable
private fun SeccionHeader(titulo: String, subtitulo: String) {
    Text(titulo, color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Black)
    Text(subtitulo, color = GrisTexto, fontSize = 13.sp)
}

@Composable
private fun BotonVolver(onVolver: () -> Unit) {
    TextButton(onClick = onVolver, contentPadding = PaddingValues(0.dp)) {
        Text("← Volver", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
    }
}

@Composable
private fun EstadoBadge(texto: String) {
    val esActivo = texto.lowercase().contains("activ") || texto.lowercase().contains("access")
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = if (esActivo) Color(0xFF0D2B18) else Color(0xFF1A0608)
    ) {
        Text(
            texto,
            color = if (esActivo) VerdeEstado else MaterialTheme.colorScheme.primary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun StatCard(label: String, valor: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Superficie)
            .padding(14.dp)
    ) {
        Column {
            Text(label, color = GrisTexto, fontSize = 11.sp)
            Text(valor, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

// Firma visual: borde izquierdo rojo
@Composable
private fun AccionCard(titulo: String, dato: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .width(160.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Superficie)
            .clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .width(3.dp)
                .fillMaxHeight()
                .background(MaterialTheme.colorScheme.primary)
        )
        Column(modifier = Modifier.padding(14.dp)) {
            Text(titulo, color = GrisTexto, fontSize = 12.sp)
            Spacer(Modifier.height(6.dp))
            Text(dato, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Black, maxLines = 2, overflow = TextOverflow.Ellipsis)
            Spacer(Modifier.height(6.dp))
            Text("Ver →", color = MaterialTheme.colorScheme.primary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun FilaDatoAPI(titulo: String, valor: String, etiqueta: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(titulo, color = GrisTexto, fontSize = 12.sp)
            Text(valor, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
        }
        Surface(
            shape = RoundedCornerShape(6.dp),
            color = Color(0xFF1A1A1A)
        ) {
            Text(etiqueta, color = GrisTexto, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
        }
    }
    Divider(color = BordeSutil, thickness = 0.5.dp)
}

@Composable
private fun FilaDatoInline(label: String, valor: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label + ":", color = GrisTexto, fontSize = 13.sp)
        Text(valor, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ItemEjercicio(ejercicio: EjercicioSocio, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(if (ejercicio.completado) Color(0xFF0D2B18) else Superficie)
            .clickable { onClick() }
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(
                    if (ejercicio.completado) VerdeEstado else Color(0xFF242424),
                    CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                if (ejercicio.completado) "✓" else "●",
                color = Color.White,
                fontWeight = FontWeight.Black,
                fontSize = 14.sp
            )
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(ejercicio.nombre, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Text(ejercicio.detalle, color = GrisTexto, fontSize = 12.sp)
        }
        Surface(shape = RoundedCornerShape(6.dp), color = Color(0xFF1A0608)) {
            Text(ejercicio.zona, color = MaterialTheme.colorScheme.primary, fontSize = 10.sp, fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
        }
    }
}

@Composable
private fun Chip(texto: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.height(36.dp).clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        color = if (selected) MaterialTheme.colorScheme.primary else Superficie,
        border = if (!selected) BorderStroke(1.dp, BordeSutil) else null
    ) {
        Box(modifier = Modifier.padding(horizontal = 16.dp), contentAlignment = Alignment.Center) {
            Text(texto, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun BarraProgreso(progreso: Float) {
    Column {
        Row {
            Text("Progreso", color = GrisTexto, fontSize = 12.sp, modifier = Modifier.weight(1f))
            Text("${(progreso * 100).toInt()}%", color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Black)
        }
        Spacer(Modifier.height(6.dp))
        Box(
            modifier = Modifier.fillMaxWidth().height(4.dp)
                .background(BordeSutil, RoundedCornerShape(2.dp))
        ) {
            Box(
                modifier = Modifier.fillMaxWidth(progreso).height(4.dp)
                    .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(2.dp))
            )
        }
    }
}

@Composable
private fun RingProgreso(progreso: Float, modifier: Modifier = Modifier) {
    val colorPrincipal = MaterialTheme.colorScheme.primary
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawArc(Color(0xFF242424), -90f, 360f, false, style = Stroke(8f, cap = StrokeCap.Round))
            drawArc(colorPrincipal, -90f, 360f * progreso, false, style = Stroke(8f, cap = StrokeCap.Round))
        }
        Text("${(progreso * 100).toInt()}%", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun EstadoVacioAPI(titulo: String, detalle: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Superficie)
            .padding(20.dp)
    ) {
        Column {
            Text(titulo, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
            Spacer(Modifier.height(4.dp))
            Text(detalle, color = GrisTexto, fontSize = 13.sp)
        }
    }
}

@Composable
private fun TabPerfilCredencial(
    nombre: String,
    correo: String,
    telefono: String,
    rol: String,
    estado: String,
    membresia: String,
    vencimiento: String,
    entrenador: String,
    ejercicios: String,
    sucursal: String,
    appConfig: AppConfigResponse
) {
    CredencialSistemaCard(
        titulo = "",
        nombre = nombre,
        correo = correo,
        bloqueTitulo = "Membresia asignada",
        bloqueValor = membresia.ifBlank { "Sin asignar" },
        sucursal = sucursal,
        permisos = estado.ifBlank { "Activo" },
        detalles = listOf(
            "Telefono" to telefono.ifBlank { "N/A" },
            "Rol" to rolLegible(rol).ifBlank { "Socio" },
            "Estado" to estado.ifBlank { "Activo" },
            "Vencimiento" to vencimiento.ifBlank { "N/A" },
            "Entrenador" to entrenador.ifBlank { "N/A" },
            "Rutina" to ejercicios.ifBlank { "0 ejercicios" }
        ),
        integradaPantalla = true,
        appConfig = appConfig,
        modifier = Modifier.fillMaxWidth()
    )
}
