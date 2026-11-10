// FILE: PantallaUsuario.kt (VERSIÓN PROFESIONAL - solo datos API)
package com.example.spartangymapp.ui.screen

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.util.Size as CameraSize
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.camera.core.CameraSelector
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
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ShowChart
import androidx.compose.material.icons.rounded.CreditCard
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.FitnessCenter
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Payments
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
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.spartangymapp.R
import com.example.spartangymapp.network.ActualizarFotoRequest
import com.example.spartangymapp.network.AppConfigResponse
import com.example.spartangymapp.ui.components.applePressScale
import com.example.spartangymapp.network.AsistenciaQrRequest
import com.example.spartangymapp.network.AsistenciaQrValidationResponse
import com.example.spartangymapp.network.CompraMembresiaAppRequest
import com.example.spartangymapp.network.CompraProductoAppRequest
import com.example.spartangymapp.network.ControlBiometricoResponse
import com.example.spartangymapp.network.DashboardResponse
import com.example.spartangymapp.network.EjercicioRutinaResponse
import com.example.spartangymapp.network.FacturaMembresiaAppResponse
import com.example.spartangymapp.network.TipoMembresiaResponse
import com.example.spartangymapp.network.MarcarEjercicioRequest
import com.example.spartangymapp.network.PagoSocioResponse
import com.example.spartangymapp.network.PerfilActualResponse
import com.example.spartangymapp.network.ProductoCatalogoResponse
import com.example.spartangymapp.network.RegistroProgresoRequest
import com.example.spartangymapp.network.RetrofitClient
import com.example.spartangymapp.network.mensajeDeError
import com.example.spartangymapp.network.RutinaResumenResponse
import com.example.spartangymapp.util.comprimirParaPerfil
import com.example.spartangymapp.util.rotarLuminancia
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.zxing.BinaryBitmap
import com.google.zxing.qrcode.QRCodeReader
import com.google.zxing.ReaderException
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.common.HybridBinarizer
import androidx.compose.ui.graphics.asImageBitmap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
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
    val ejercicioId: Long,
    val nombre: String,
    val detalle: String,
    val zona: String,
    val completado: Boolean = false
)

private data class RutinaSocio(
    val id: String,
    val nombre: String,
    val objetivo: String,
    val dificultad: String,
    val dias: Int,
    val foco: String,
    val progreso: Float,
    val ejercicios: List<EjercicioSocio>,
    val imagenUrl: String? = null
)

private data class SocioNavItem(
    val label: String,
    val icon: ImageVector
)

private fun EjercicioRutinaResponse.detalleTexto(): String {
    val partes = if (tipoEjercicio == "Cardio") {
        listOfNotNull(
            duracionSegundos?.let { "${it / 60} min" },
            velocidadNivel?.let { "${it} vel/nivel" },
            inclinacion?.let { "${it}% incl" },
            distanciaMetros?.let { "${it}m" },
            tiempoDescansoSegundos?.let { "${it}s descanso" }
        )
    } else {
        listOfNotNull(
            series?.let { "$it series" },
            repeticiones?.let { "$it reps" },
            pesoSugeridoKg?.let { "${it}kg" },
            duracionSegundos?.let { "${it / 60} min" },
            tiempoDescansoSegundos?.let { "${it}s descanso" }
        )
    }
    return partes.joinToString(" · ").ifBlank { "—" }
}

private fun RutinaResumenResponse.toRutinaSocio(index: Int): RutinaSocio {
    val ejerciciosMapeados = ejercicios.orEmpty().mapNotNull { e ->
        val ejercicioId = e.ejercicioId ?: return@mapNotNull null
        EjercicioSocio(
            ejercicioId = ejercicioId,
            nombre = e.ejercicio ?: "Ejercicio ${index + 1}",
            detalle = e.detalleTexto(),
            zona = e.grupoMuscular ?: "General",
            completado = e.completadoEstaSemana ?: false
        )
    }
    val zonas = ejerciciosMapeados.map { it.zona }.distinct().take(3).joinToString(" · ")
    return RutinaSocio(
        id = id.orEmpty(),
        nombre = nombre?.ifBlank { null } ?: objetivo?.ifBlank { null } ?: "Rutina ${index + 1}",
        objetivo = objetivo ?: "—",
        dificultad = tipoRutina?.ifBlank { null } ?: "Asignada",
        dias = ejerciciosMapeados.size,
        foco = zonas.ifBlank { "—" },
        progreso = (progresoSemana ?: 0.0).toFloat(),
        ejercicios = ejerciciosMapeados,
        imagenUrl = imagenUrl
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
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    // Mensaje local para el flujo de foto de perfil: NO reutiliza `error`, ya que
    // `error != null` reemplaza toda la pantalla (PantallaError) — no queremos que
    // un fallo al subir la foto saque al socio de la pestaña en la que está.
    var mensajeFoto by remember { mutableStateOf<String?>(null) }
    // Evita subidas superpuestas: mientras una foto está en proceso (comprimir + subir),
    // el botón se deshabilita para que no se pueda lanzar una segunda selección que
    // corra en paralelo y termine revirtiendo el resultado de la primera fuera de orden.
    var subiendoFoto by remember { mutableStateOf(false) }

    val seleccionarFoto = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        val fotoAnterior = perfilActual?.fotoUrl
        subiendoFoto = true
        scope.launch {
            mensajeFoto = null
            try {
                val dataUrl = try {
                    withContext(Dispatchers.IO) {
                        val bitmap = context.contentResolver.openInputStream(uri).use {
                            BitmapFactory.decodeStream(it)
                        } ?: throw java.io.IOException("No se pudo leer la imagen.")
                        comprimirParaPerfil(bitmap)
                    }
                } catch (_: Exception) {
                    mensajeFoto = "No se pudo procesar la imagen."
                    return@launch
                }
                // Actualizacion optimista: refleja el cambio de inmediato
                perfilActual = perfilActual?.copy(fotoUrl = dataUrl)
                try {
                    val resp = RetrofitClient.apiService.actualizarFotoPerfil(ActualizarFotoRequest(dataUrl))
                    if (!resp.isSuccessful) {
                        throw java.io.IOException("No se pudo actualizar la foto (${resp.code()}).")
                    }
                } catch (_: Exception) {
                    // Revertir si la llamada falla
                    perfilActual = perfilActual?.copy(fotoUrl = fotoAnterior)
                    mensajeFoto = "No se pudo actualizar la foto."
                }
            } finally {
                subiendoFoto = false
            }
        }
    }

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

    LaunchedEffect(seccionActual) {
        if (seccionActual == 2) {
            while (true) {
                runCatching { RetrofitClient.apiService.listarTiposMembresia() }
                    .getOrNull()?.body()?.let { tiposMembresia = it }
                delay(30_000)
            }
        }
    }

    val nombreMostrar = run {
        val n = listOfNotNull(perfilActual?.nombres, perfilActual?.apellidos)
            .filter { it.isNotBlank() }.joinToString(" ")
        n.ifBlank { dashboard?.nombreCompleto.apiValor(usuario) }
    }
    val planActivo = tiposMembresia.firstOrNull {
        it.nombre?.equals(dashboard?.tipoMembresia, ignoreCase = true) == true
    }

    val scrollPantalla = rememberScrollState()
    LaunchedEffect(seccionActual, subPantalla) { scrollPantalla.scrollTo(0) }
    Scaffold(
        containerColor = Negro,
        bottomBar = {
            BarraNavegacion(
                seleccionado = seccionActual,
                onSeleccionar = { seccionActual = it; subPantalla = "" }
            )
        }
    ) { padding ->
        Box(
            Modifier.fillMaxSize().padding(padding).background(Negro),
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .widthIn(max = 640.dp)
                    .fillMaxHeight()
                    .verticalScroll(scrollPantalla)
            ) {
                when {
                    cargando -> PantallaCargando(appConfig.nombreVisibleApp())
                    error != null -> PantallaError(error!!)
                    else -> when {
                    subPantalla == "membresia" -> DetalleMembresiaUsuario(
                        dashboard = dashboard, plan = planActivo, onVolver = { subPantalla = "" }
                    )
                    subPantalla == "rutina_detalle" && rutinas.isNotEmpty() ->
                        DetalleRutinaUsuario(
                            rutina = rutinas[rutinaSeleccionada],
                            onToggleEjercicio = { idx ->
                                val posicionRutina = rutinaSeleccionada
                                val r = rutinas[posicionRutina]
                                val ejercicio = r.ejercicios[idx]
                                val nuevoEstado = !ejercicio.completado

                                // Actualizacion optimista: refleja el cambio de inmediato
                                val listaOptimista = r.ejercicios.toMutableList()
                                listaOptimista[idx] = ejercicio.copy(completado = nuevoEstado)
                                val completadosOptimista = listaOptimista.count { it.completado }
                                val progresoOptimista = if (listaOptimista.isEmpty()) 0f
                                    else completadosOptimista.toFloat() / listaOptimista.size
                                rutinas[posicionRutina] = r.copy(ejercicios = listaOptimista, progreso = progresoOptimista)

                                scope.launch {
                                    try {
                                        val resp = RetrofitClient.apiService.marcarEjercicioCompletado(
                                            rutinaId = r.id,
                                            ejercicioId = ejercicio.ejercicioId,
                                            request = MarcarEjercicioRequest(completado = nuevoEstado)
                                        )
                                        if (!resp.isSuccessful) {
                                            throw java.io.IOException("No se pudo actualizar el ejercicio (${resp.code()}).")
                                        }
                                    } catch (_: Exception) {
                                        // Revertir si la llamada falla
                                        val listaRevertida = rutinas[posicionRutina].ejercicios.toMutableList()
                                        listaRevertida[idx] = ejercicio.copy(completado = !nuevoEstado)
                                        val completadosRevertido = listaRevertida.count { it.completado }
                                        val progresoRevertido = if (listaRevertida.isEmpty()) 0f
                                            else completadosRevertido.toFloat() / listaRevertida.size
                                        rutinas[posicionRutina] = rutinas[posicionRutina].copy(
                                            ejercicios = listaRevertida,
                                            progreso = progresoRevertido
                                        )
                                    }
                                }
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
                            desplazamiento = { scrollPantalla.value.toFloat() },
                            appConfig = appConfig,
                            dashboard = dashboard,
                            rutina = rutinas.getOrNull(rutinaSeleccionada),
                            productosCount = productos.size,
                            onMembresia = { subPantalla = "membresia" },
                            onRutina = { if (rutinas.isNotEmpty()) subPantalla = "rutina_detalle" else seccionActual = 1 },
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
                            appConfig = appConfig,
                            dashboard = dashboard,
                            plan = planActivo,
                            pagos = pagos,
                            onDetalles = { subPantalla = "membresia" },
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
                            fotoUrl = perfilActual?.fotoUrl,
                            appConfig = appConfig,
                            mensajeFoto = mensajeFoto,
                            subiendoFoto = subiendoFoto,
                            onCambiarFoto = {
                                seleccionarFoto.launch(
                                    androidx.activity.result.PickVisualMediaRequest(
                                        ActivityResultContracts.PickVisualMedia.ImageOnly
                                    )
                                )
                            }
                        )
                        else -> {}
                    }
                    }
                }
            }
        }
    }
}

// ─── Carga y error ──────────────────────────────────────────────────────────
@Composable
private fun PantallaCargando(nombreGimnasio: String) {
    Box(
        modifier = Modifier.fillMaxWidth().padding(64.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary, strokeWidth = 2.dp)
            Spacer(Modifier.height(16.dp))
            Text("Cargando $nombreGimnasio · tu perfil", color = GrisTexto, fontSize = 14.sp, textAlign = TextAlign.Center)
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
    appConfig: AppConfigResponse,
    dashboard: DashboardResponse?,
    rutina: RutinaSocio?,
    productosCount: Int,
    desplazamiento: () -> Float,
    onMembresia: () -> Unit,
    onRutina: () -> Unit,
    onProgreso: () -> Unit,
    onPago: () -> Unit,
    onProductos: () -> Unit
) {
    val nombreCorto = nombre.trim().substringBefore(" ").ifBlank { "Socio" }
    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Hola, $nombreCorto", color = GrisTexto, fontSize = 14.sp)
                Text("Vamos a entrenar", color = Color.White, fontSize = 27.sp, lineHeight = 31.sp, letterSpacing = (-0.6).sp, fontWeight = FontWeight.Bold)
            }
            EstadoBadge(dashboard?.estadoAcceso.apiValor())
        }
        PortadaMovil(
            imagen = rutina?.imagenUrl?.takeIf { it.isNotBlank() } ?: appConfig.fondoLogin,
            modifier = Modifier.fillMaxWidth().height(242.dp),
            desplazamiento = desplazamiento
        ) {
            Surface(Modifier.align(Alignment.TopStart).padding(18.dp), color = Color.Black.copy(alpha = 0.35f), shape = CircleShape) {
                Text(if (rutina == null) "TU ESPACIO DE ENTRENAMIENTO" else "TU PLAN DE HOY", color = Color.White, fontSize = 10.sp, letterSpacing = 1.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp))
            }
            Column(Modifier.align(Alignment.BottomStart).padding(20.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                Text(rutina?.nombre ?: "Todo empieza contigo", color = Color.White, fontSize = 25.sp, lineHeight = 29.sp, fontWeight = FontWeight.Bold, maxLines = 2)
                Text(if (rutina == null) "Tu plan aparecerá aquí cuando te lo asignen." else "${rutina.ejercicios.size} ejercicios · ${rutina.dificultad}", color = Color(0xFFDEDEE3), fontSize = 13.sp)
                val press = remember { MutableInteractionSource() }
                Button(onClick = onRutina, interactionSource = press, modifier = Modifier.heightIn(min = 48.dp).applePressScale(press), shape = CircleShape, colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF17171B))) {
                    Icon(Icons.Rounded.FitnessCenter, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(if (rutina == null) "Mis rutinas" else "Ver entrenamiento", fontWeight = FontWeight.SemiBold)
                    Icon(Icons.Rounded.ChevronRight, null, Modifier.padding(start = 6.dp).size(18.dp))
                }
            }
        }
        DashboardStats(dashboard?.totalEjercicios.apiValor(), dashboard?.ultimoPesoKg.apiValor(" kg"))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            AccionRapida("Mi plan", Icons.Rounded.CreditCard, Modifier.weight(1f), onMembresia)
            AccionRapida("Progreso", Icons.AutoMirrored.Rounded.ShowChart, Modifier.weight(1f), onProgreso)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            AccionRapida("Pagos", Icons.Rounded.Payments, Modifier.weight(1f), onPago)
            AccionRapida("Tienda", Icons.Rounded.ShoppingCart, Modifier.weight(1f), onProductos)
        }
        ResumenMembresia(dashboard?.tipoMembresia.apiValor(), fechaMovil(dashboard?.fechaVencimiento), dashboard?.nombreEntrenador.apiValor(), onMembresia)
    }
}

@Composable
private fun ResumenMembresia(tipo: String, vencimiento: String, entrenador: String, onClick: () -> Unit) {
    val interaccion = remember { MutableInteractionSource() }
    Surface(
        modifier = Modifier.fillMaxWidth().applePressScale(interaccion)
            .clickable(interactionSource = interaccion, indication = null, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = SuperficieOscura,
        border = BorderStroke(1.dp, BordeSutil)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier.size(38.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Rounded.CreditCard, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(19.dp))
            }
            Spacer(Modifier.width(11.dp))
            Column(Modifier.weight(1f)) {
                Text(tipo.ifBlank { "Membresía" }, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOfNotNull(
                        vencimiento.takeIf { it.isNotBlank() && it != "N/A" }?.let { "Vence $it" },
                        entrenador.takeIf { it.isNotBlank() && it != "N/A" }?.let { "Entrena con $it" }
                    ).joinToString(" · ").ifBlank { "Consulta los datos de tu plan" },
                    color = GrisTexto,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Icon(Icons.Rounded.ChevronRight, contentDescription = "Ver membresía", tint = GrisTexto, modifier = Modifier.size(20.dp))
        }
    }
}

// ─── Resumen de rutina ─────────────────────────────────────────────────────
@Composable
private fun RutinaDestacada(rutina: RutinaSocio?, onClick: () -> Unit) {
    val colorPrincipal = MaterialTheme.colorScheme.primary
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .animateContentSize(
                spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessMediumLow)
            )
            .clickable(enabled = rutina != null, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = SuperficieOscura,
        border = BorderStroke(1.dp, BordeSutil)
    ) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 13.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier.size(42.dp).clip(CircleShape).background(colorPrincipal.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Rounded.FitnessCenter, contentDescription = null, tint = colorPrincipal, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    if (rutina == null) "TU RUTINA" else "PLAN ACTIVO",
                    color = colorPrincipal,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.8.sp
                )
                Text(
                    rutina?.nombre ?: "Esperando tu plan",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    if (rutina == null) "Tu entrenador lo verá aquí"
                    else "${rutina.ejercicios.size} ejercicios · ${rutina.dificultad}",
                    color = GrisTexto,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            if (rutina != null) {
                Spacer(Modifier.width(8.dp))
                Icon(Icons.Rounded.ChevronRight, contentDescription = "Abrir rutina", tint = GrisTexto, modifier = Modifier.size(20.dp))
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
    var ejercicioActivo by remember { mutableStateOf<EjercicioSocio?>(null) }
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

        rutina.imagenUrl?.takeIf { it.isNotBlank() }?.let { imagen ->
            PortadaMovil(imagen, Modifier.fillMaxWidth().height(190.dp)) {
                Text(rutina.nombre, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.align(Alignment.BottomStart).padding(18.dp))
            }
            Spacer(Modifier.height(12.dp))
        }
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

        rutina.ejercicios.forEach { ejercicio ->
            ItemEjercicio(ejercicio, onOpen = { ejercicioActivo = ejercicio })
        }
    }
    ejercicioActivo?.let { ejercicio ->
        DemostracionEjercicio(ejercicio.nombre, ejercicio.detalle) { ejercicioActivo = null }
    }
}

// ─── TAB: Pagos ───────────────────────────────────────────────────────────
@Composable
private fun TabPagos(
    appConfig: AppConfigResponse,
    dashboard: DashboardResponse?,
    plan: TipoMembresiaResponse?,
    pagos: List<PagoSocioResponse>,
    onDetalles: () -> Unit,
    onRenovar: () -> Unit
) {
    val beneficios = plan?.beneficios.orEmpty().lines().map { it.trim() }.filter { it.isNotBlank() }
    Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        SeccionHeader("Tu membresía", "Plan, renovaciones y movimientos")
        PortadaMovil(plan?.imagenUrl, Modifier.fillMaxWidth().height(196.dp), mostrarImagenFallback = false) {
            Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.SpaceBetween) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.CreditCard, null, tint = Color.White, modifier = Modifier.size(24.dp))
                    Spacer(Modifier.weight(1f))
                    EstadoBadge(dashboard?.estadoAcceso.apiValor())
                }
                Column {
                    Text(dashboard?.tipoMembresia.apiValor("Tu plan"), color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Bold)
                    Text("Válida hasta el ${fechaMovil(dashboard?.fechaVencimiento)}", color = Color(0xFFDEDEE3), fontSize = 13.sp)
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            val press = remember { MutableInteractionSource() }
            Button(onClick = onRenovar, interactionSource = press, modifier = Modifier.weight(1f).heightIn(min = 50.dp).applePressScale(press), shape = RoundedCornerShape(16.dp)) { Text("Renovar plan", fontWeight = FontWeight.SemiBold) }
            OutlinedButton(onClick = onDetalles, modifier = Modifier.weight(1f).heightIn(min = 50.dp), shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, Color(0xFF38383D))) { Text("Ver detalles", color = Color.White) }
        }
        if (plan != null) {
            Surface(shape = RoundedCornerShape(20.dp), color = Color(0xFF1B1B20), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Tu plan incluye", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                        Text("${plan.duracionDias ?: 0} días", color = GrisTexto, fontSize = 12.sp)
                    }
                    if (beneficios.isEmpty()) Text("Consulta los detalles de tu membresía.", color = GrisTexto, fontSize = 12.sp)
                    beneficios.take(3).forEach { beneficio ->
                        Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                            Text("✓", color = Color(0xFF68D9A4), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text(beneficio, color = Color(0xFFE2E2E7), fontSize = 13.sp, lineHeight = 18.sp)
                        }
                    }
                    if (beneficios.size > 3) Text("Y ${beneficios.size - 3} más en Ver detalles", color = GrisTexto, fontSize = 12.sp)
                }
            }
        }
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Movimientos", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            Text("${pagos.size} pagos", color = GrisTexto, fontSize = 12.sp)
        }
        Surface(shape = RoundedCornerShape(22.dp), color = Color(0xFF1B1B20)) {
            Column(Modifier.padding(horizontal = 16.dp)) {
                if (pagos.isEmpty()) Text("Tus pagos aparecerán aquí.", color = GrisTexto, modifier = Modifier.padding(vertical = 22.dp))
                pagos.forEachIndexed { index, pago ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Rounded.Payments, null, tint = Color(0xFF68D9A4), modifier = Modifier.size(23.dp))
                        Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                            Text(pago.metodoPago.apiValor(), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            Text(fechaMovil(pago.fechaTransaccion), color = GrisTexto, fontSize = 12.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(pago.monto?.let { String.format(java.util.Locale.US, "%,.2f", it) } ?: "—", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                            Text("Pagado", color = Color(0xFF68D9A4), fontSize = 11.sp)
                        }
                    }
                    if (index < pagos.lastIndex) HorizontalDivider(color = Color.White.copy(alpha = 0.07f))
                }
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
private fun DetalleMembresiaUsuario(dashboard: DashboardResponse?, plan: TipoMembresiaResponse?, onVolver: () -> Unit) {
    val beneficios = plan?.beneficios.orEmpty().lines().map { it.trim() }.filter { it.isNotBlank() }
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        BotonVolver(onVolver)
        Spacer(Modifier.height(16.dp))
        SeccionHeader("Tu plan", "Detalles y beneficios de tu membresía")
        Spacer(Modifier.height(16.dp))
        PortadaMovil(plan?.imagenUrl, Modifier.fillMaxWidth().height(210.dp), mostrarImagenFallback = false) {
            Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.SpaceBetween) {
                EstadoBadge(dashboard?.estadoAcceso.apiValor())
                Column {
                    Text(dashboard?.tipoMembresia.apiValor("Sin plan activo"), color = Color.White, fontSize = 27.sp, fontWeight = FontWeight.Bold)
                    Text("Vence: ${fechaMovil(dashboard?.fechaVencimiento)}", color = Color(0xFFE2E2E7), fontSize = 13.sp)
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        if (plan != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(Modifier.weight(1f), shape = RoundedCornerShape(17.dp), color = Color(0xFF1B1B20)) {
                    Column(Modifier.padding(16.dp)) {
                        Text("DURACIÓN", color = GrisTexto, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        Text("${plan.duracionDias ?: 0} días", color = Color.White, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Surface(Modifier.weight(1f), shape = RoundedCornerShape(17.dp), color = Color(0xFF1B1B20)) {
                    Column(Modifier.padding(16.dp)) {
                        Text("PRECIO", color = GrisTexto, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        Text("${plan.precio?.let { String.format(java.util.Locale.US, "%,.2f", it) } ?: "—"}", color = Color.White, fontSize = 19.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(Modifier.height(18.dp))
        }
        Text("Beneficios", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(10.dp))
        Surface(shape = RoundedCornerShape(20.dp), color = Color(0xFF1B1B20), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (beneficios.isEmpty()) Text("Este plan todavía no tiene beneficios descritos.", color = GrisTexto, fontSize = 13.sp)
                beneficios.forEach { beneficio ->
                    Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("✓", color = Color(0xFF68D9A4), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text(beneficio, color = Color.White, fontSize = 14.sp, lineHeight = 20.sp)
                    }
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        FilaDatoAPI("Entrenador", dashboard?.nombreEntrenador.apiValor(), "API")
        FilaDatoAPI("Rutina objetivo", dashboard?.objetivoRutina.apiValor(), "API")
    }
}

@Composable
private fun DetalleRutinaUsuario(
    rutina: RutinaSocio,
    onToggleEjercicio: (Int) -> Unit,
    onVolver: () -> Unit
) {
    var ejercicioActivo by remember { mutableStateOf<EjercicioSocio?>(null) }
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)) {
        BotonVolver(onVolver)
        Spacer(Modifier.height(16.dp))
        SeccionHeader(rutina.nombre, rutina.objetivo)
        Spacer(Modifier.height(16.dp))

        rutina.imagenUrl?.takeIf { it.isNotBlank() }?.let { imagen ->
            PortadaMovil(imagen, Modifier.fillMaxWidth().height(210.dp)) {}
            Spacer(Modifier.height(16.dp))
        }
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
            ItemEjercicio(
                ejercicio = e,
                onOpen = { ejercicioActivo = e },
                onToggleCompletion = { onToggleEjercicio(i) }
            )
        }
    }
    ejercicioActivo?.let { ejercicio ->
        DemostracionEjercicio(ejercicio.nombre, ejercicio.detalle) { ejercicioActivo = null }
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
                    val detalle = mensajeDeError(resp.errorBody()?.string())
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
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
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
                        if (sel) {
                            val beneficios = tipo.beneficios.orEmpty().lines().map { it.trim() }.filter { it.isNotBlank() }
                            if (beneficios.isNotEmpty()) beneficios.forEach { beneficio ->
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
                                    Text("✓", color = Color(0xFF68D9A4), fontSize = 13.sp)
                                    Text(beneficio, color = Color(0xFFE2E2E7), fontSize = 12.sp, lineHeight = 17.sp)
                                }
                            } else Text("Aún no hay beneficios descritos para este plan.", color = GrisTexto, fontSize = 12.sp)
                        }
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
            .heightIn(min = 64.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(SuperficieOscura)
            .clickable(role = Role.Button, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.16f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.Rounded.ShoppingCart,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(19.dp)
            )
        }
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text("Tienda", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(
                if (productosCount > 0) "$productosCount productos disponibles" else "Ver catálogo de la tienda",
                color = GrisTexto,
                fontSize = 12.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Icon(Icons.Rounded.ChevronRight, contentDescription = "Abrir tienda", tint = GrisTexto, modifier = Modifier.size(20.dp))
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
                    val detalle = mensajeDeError(resp.errorBody()?.string())
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
    var intentoEscaneo by remember { mutableStateOf(0) }

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
                    val detalleError = mensajeDeError(respuesta.errorBody()?.string())
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
        SeccionHeader("Escanear QR", appConfig.nombreVisibleApp())
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
                    intento = intentoEscaneo,
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
                    FilaDatoAPI("Código leído", "QR de recepción", "Web")
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
                        intentoEscaneo++
                    },
                    enabled = !validando,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Escanear otro QR", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun QrScannerCamera(
    activo: Boolean,
    intento: Int,
    onTokenDetectado: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val onTokenActualizado = rememberUpdatedState(onTokenDetectado)
    val activoActualizado = rememberUpdatedState(activo)
    val mainExecutor = remember(context) { ContextCompat.getMainExecutor(context) }
    val ultimoToken = remember { AtomicReference("") }
    LaunchedEffect(intento) { ultimoToken.set("") }
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

private fun decodificarQr(imageProxy: ImageProxy): String? {
    val ancho = imageProxy.width
    val alto = imageProxy.height
    val planoY = imageProxy.planes.firstOrNull() ?: return null
    val buffer = planoY.buffer.duplicate()
    val inicio = buffer.position()
    val rowStride = planoY.rowStride
    val pixelStride = planoY.pixelStride
    if (ancho <= 0 || alto <= 0 || rowStride <= 0 || pixelStride <= 0 ||
        inicio.toLong() + (alto - 1L) * rowStride + (ancho - 1L) * pixelStride >= buffer.limit()
    ) return null

    val datos = ByteArray(ancho * alto)
    for (y in 0 until alto) {
        val fila = inicio + y * rowStride
        if (pixelStride == 1) {
            buffer.position(fila)
            buffer.get(datos, y * ancho, ancho)
        } else {
            for (x in 0 until ancho) datos[y * ancho + x] = buffer.get(fila + x * pixelStride)
        }
    }

    val frame = rotarLuminancia(datos, ancho, alto, imageProxy.imageInfo.rotationDegrees)
    val source = PlanarYUVLuminanceSource(frame.datos, frame.ancho, frame.alto, 0, 0, frame.ancho, frame.alto, false)
    return try {
        QRCodeReader().decode(BinaryBitmap(HybridBinarizer(source))).text
    } catch (_: ReaderException) {
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
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
        shape = RoundedCornerShape(28.dp),
        color = Color(0xF21B1B20),
        tonalElevation = 0.dp,
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.07f))
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
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = {
                    Text(
                        item.label,
                        fontSize = 12.sp,
                        fontWeight = if (activo) FontWeight.SemiBold else FontWeight.Medium
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
private fun DashboardStats(ejercicios: String, peso: String) {
    Surface(
        modifier = Modifier.fillMaxWidth().animateContentSize(
            spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessMediumLow)
        ),
        shape = RoundedCornerShape(16.dp),
        color = SuperficieOscura
    ) {
        Row(
            Modifier.fillMaxWidth().padding(vertical = 12.dp, horizontal = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            DashboardMetric("Ejercicios", ejercicios, Modifier.weight(1f))
            Box(Modifier.width(1.dp).height(34.dp).background(BordeSutil))
            DashboardMetric("Peso reciente", peso, Modifier.weight(1f))
        }
    }
}

@Composable
private fun DashboardMetric(label: String, value: String, modifier: Modifier = Modifier) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = Color.White, fontSize = 19.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(label, color = GrisTexto, fontSize = 12.sp, textAlign = TextAlign.Center, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun AccionRapida(
    titulo: String,
    icono: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    Row(
        modifier.heightIn(min = 58.dp).applePressScale(interactionSource).clip(RoundedCornerShape(18.dp))
            .background(Color(0xFF1B1B20)).clickable(interactionSource = interactionSource, indication = null, role = Role.Button, onClick = onClick).padding(horizontal = 14.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icono, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(21.dp))
        Text(titulo, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f).padding(start = 10.dp))
        Icon(Icons.Rounded.ChevronRight, null, tint = GrisTexto, modifier = Modifier.size(16.dp))
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
private fun ItemEjercicio(
    ejercicio: EjercicioSocio,
    onOpen: () -> Unit,
    onToggleCompletion: (() -> Unit)? = null
) {
    val interaccion = remember { MutableInteractionSource() }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 7.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(if (ejercicio.completado) Color(0xFF0D2116) else SuperficieOscura)
            .clickable(interactionSource = interaccion, indication = null, role = Role.Button, onClick = onOpen)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(
                    if (ejercicio.completado) VerdeEstado.copy(alpha = 0.16f) else MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                if (ejercicio.completado) "✓" else "▶",
                color = if (ejercicio.completado) VerdeEstado else MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Black,
                fontSize = 13.sp
            )
        }
        Spacer(Modifier.width(11.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(ejercicio.nombre, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(ejercicio.detalle, color = GrisTexto, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        if (ejercicio.zona.isNotBlank()) {
            Surface(shape = RoundedCornerShape(8.dp), color = Color(0xFF1A0608)) {
                Text(ejercicio.zona, color = MaterialTheme.colorScheme.primary, fontSize = 9.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        if (onToggleCompletion != null) {
            IconButton(onClick = onToggleCompletion, modifier = Modifier.size(48.dp)) {
                Text(
                    if (ejercicio.completado) "✓" else "○",
                    color = if (ejercicio.completado) VerdeEstado else GrisTexto,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        } else {
            Icon(Icons.Rounded.ChevronRight, contentDescription = "Ver demostración", tint = GrisTexto, modifier = Modifier.size(20.dp))
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
    fotoUrl: String? = null,
    appConfig: AppConfigResponse,
    mensajeFoto: String? = null,
    subiendoFoto: Boolean = false,
    onCambiarFoto: () -> Unit = {}
) {
    Column(modifier = Modifier.fillMaxWidth()) {
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
            onCambiarFoto = onCambiarFoto,
            subiendoFoto = subiendoFoto,
            fotoUrl = fotoUrl,
            appConfig = appConfig,
            modifier = Modifier.fillMaxWidth()
        )
        mensajeFoto?.let {
            Spacer(Modifier.height(8.dp))
            Text(
                it,
                color = MaterialTheme.colorScheme.primary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 20.dp)
            )
        }
    }
}
