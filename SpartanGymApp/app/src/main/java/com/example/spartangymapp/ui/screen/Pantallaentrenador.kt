package com.example.spartangymapp.ui.screen

import android.app.DatePickerDialog
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Assignment
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import com.example.spartangymapp.R
import com.example.spartangymapp.network.*
import java.util.Calendar

// ─── Paleta ─────────────────────────────────────────────────────────────────
private val ENT_BG    = Color(0xFF050505)
private val ENT_CARD  = Color(0xFF111111)
private val ENT_CARD2 = Color(0xFF181818)
private val ENT_BORDE = Color(0xFF1E1E1E)
private val ENT_GRIS  = Color(0xFF6A6A6A)
private val ENT_GRIS2 = Color(0xFF9A9A9A)

// ─── Helpers color API ───────────────────────────────────────────────────────
private fun entHex(hex: String?, fb: Color): Color {
    val c = hex?.trim()?.removePrefix("#") ?: return fb
    if (!c.matches(Regex("[0-9a-fA-F]{6}"))) return fb
    return try { Color(("ff$c").toLong(16)) } catch (_: Exception) { fb }
}
private fun entDark(c: Color, p: Float): Color {
    val b = 1f - p.coerceIn(0f, 1f)
    return Color(c.red * b, c.green * b, c.blue * b, 1f)
}
private data class EntAp(val accent: Color, val hover: Color, val soft: Color) {
    companion object {
        fun desde(cfg: AppConfigResponse): EntAp {
            val a = entHex(cfg.accentColor, Color(0xFFE10613))
            return EntAp(a, entHex(cfg.accentHoverColor, entDark(a, .22f)), entHex(cfg.accentSoftColor, entDark(a, .66f)))
        }
    }
}

// ─── Helpers fecha — sin java.time (compatible con minSdk 24) ────────────────
private fun calHoy(): Calendar = Calendar.getInstance()
private fun calToIso(cal: Calendar): String =
    "%04d-%02d-%02d".format(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH))
private fun calMas(dias: Int): String {
    val c = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, dias) }
    return calToIso(c)
}
private fun isoADisplay(iso: String): String {
    val p = iso.split("-")
    if (p.size != 3) return iso
    return "${p[2]}/${p[1]}/${p[0]}"
}
private fun isoACal(iso: String): Calendar {
    val p = iso.split("-").map { it.toIntOrNull() ?: 0 }
    return Calendar.getInstance().apply {
        set(p.getOrElse(0) { 2024 }, (p.getOrElse(1) { 1 }) - 1, p.getOrElse(2) { 1 })
    }
}

private data class EntNavItem(val label: String, val icon: ImageVector)

// ═══════════════════════════════════════════════════════════════════════════
//  PANTALLA PRINCIPAL ENTRENADOR
// ═══════════════════════════════════════════════════════════════════════════
@Composable
fun PantallaEntrenador(
    usuario: String = "Entrenador",
    appConfig: AppConfigResponse,
    onCerrarSesion: () -> Unit = {}
) {
    var seccion     by rememberSaveable { mutableIntStateOf(0) }
    var subPantalla by rememberSaveable { mutableStateOf("") }

    var dash      by remember { mutableStateOf<EntrenadorDashboardResponse?>(null) }
    var clientes  by remember { mutableStateOf<List<EntrenadorClienteResponse>>(emptyList()) }
    var perfil    by remember { mutableStateOf<EntrenadorPerfilResponse?>(null) }
    val ejercicios = remember { mutableStateListOf<EjercicioCatalogoResponse>() }
    var cargando  by remember { mutableStateOf(true) }
    var error     by remember { mutableStateOf<String?>(null) }
    val scope     = rememberCoroutineScope()

    val ap = remember(appConfig.accentColor, appConfig.accentHoverColor, appConfig.accentSoftColor) {
        EntAp.desde(appConfig)
    }

    fun recargar() {
        scope.launch {
            cargando = true; error = null
            try {
                dash     = RetrofitClient.apiService.obtenerDashboardEntrenador().body()
                clientes = RetrofitClient.apiService.obtenerClientesEntrenador().body().orEmpty()
                perfil   = RetrofitClient.apiService.obtenerPerfilEntrenador().body()
                ejercicios.clear()
                ejercicios.addAll(RetrofitClient.apiService.listarEjercicios().body().orEmpty())
            } catch (e: Exception) { error = e.message }
            finally { cargando = false }
        }
    }
    LaunchedEffect(Unit) { recargar() }

    // Modo crear rutina: ocupa toda la pantalla sin scaffold
    if (subPantalla == "crear_rutina") {
        PantallaCrearRutina(
            perfil     = perfil,
            clientes   = clientes,
            ejercicios = ejercicios,
            ap         = ap,
            onVolver   = { subPantalla = "" },
            onGuardado = { subPantalla = ""; recargar() }
        )
        return
    }

    Scaffold(
        containerColor = ENT_BG,
        bottomBar = { EntBarraNav(seccion, ap.accent) { seccion = it } }
    ) { scaffoldPad ->
        Box(
            Modifier
                .fillMaxSize()
                .padding(scaffoldPad)
                .background(ENT_BG)
        ) {
            when {
                cargando    -> EntCargando(ap.accent)
                error != null -> EntError(error!!, ap)
                else -> when (seccion) {
                    0 -> TabInicio(dash, ap)
                    1 -> TabClientes(clientes, ap)
                    2 -> TabRutinas(dash?.rutinasRecientes.orEmpty(), ap) { subPantalla = "crear_rutina" }
                    3 -> TabPerfil(perfil, appConfig, ap, onCerrarSesion)
                }
            }
        }
    }
}

// ─── Bottom Nav ──────────────────────────────────────────────────────────────
@Composable
private fun EntBarraNav(sel: Int, accent: Color, onSelect: (Int) -> Unit) {
    val tabs = listOf(
        EntNavItem("Inicio",   Icons.Rounded.Home),
        EntNavItem("Clientes", Icons.Rounded.People),
        EntNavItem("Rutinas",  Icons.Rounded.FitnessCenter),
        EntNavItem("Perfil",   Icons.Rounded.Person)
    )
    NavigationBar(containerColor = ENT_CARD, tonalElevation = 0.dp) {
        tabs.forEachIndexed { i, t ->
            NavigationBarItem(
                selected = sel == i, onClick = { onSelect(i) },
                icon  = { Icon(t.icon, t.label) },
                label = { Text(t.label, fontSize = 10.sp, fontWeight = if (sel == i) FontWeight.Black else FontWeight.Normal) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = accent, selectedTextColor = accent,
                    indicatorColor = Color.Transparent,
                    unselectedIconColor = ENT_GRIS, unselectedTextColor = ENT_GRIS
                )
            )
        }
    }
}

// ─── Cargando / Error ────────────────────────────────────────────────────────
@Composable
private fun EntCargando(accent: Color) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = accent, strokeWidth = 2.dp)
            Spacer(Modifier.height(12.dp))
            Text("Cargando…", color = ENT_GRIS, fontSize = 13.sp)
        }
    }
}
@Composable
private fun EntError(msg: String, ap: EntAp) {
    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Surface(shape = RoundedCornerShape(18.dp), color = ENT_CARD, border = BorderStroke(1.dp, ap.accent.copy(.3f))) {
            Column(Modifier.padding(20.dp)) {
                Text("Error de conexión", color = ap.accent, fontSize = 12.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(6.dp))
                Text(msg, color = ENT_GRIS2, fontSize = 13.sp)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB INICIO
// ═══════════════════════════════════════════════════════════════════════════
@Composable
private fun TabInicio(dash: EntrenadorDashboardResponse?, ap: EntAp) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        Box(Modifier.fillMaxWidth().height(200.dp)) {
            Image(painterResource(R.drawable.image_03453d), null, contentScale = ContentScale.Crop, modifier = Modifier.matchParentSize())
            Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color.Black.copy(.5f), Color.Black.copy(.9f)))))
            Column(Modifier.align(Alignment.BottomStart).padding(18.dp)) {
                Surface(shape = RoundedCornerShape(6.dp), color = ap.accent.copy(.18f), border = BorderStroke(1.dp, ap.accent.copy(.4f))) {
                    Text("PANEL ENTRENADOR", color = ap.accent, fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 1.4.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
                }
                Spacer(Modifier.height(6.dp))
                Text("Panel Principal", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black)
                Text("Resumen de tu actividad", color = Color.White.copy(.5f), fontSize = 12.sp)
            }
        }
        Column(Modifier.padding(horizontal = 16.dp, vertical = 16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                EntStatCard("Clientes",   dash?.clientesAsignados?.toString() ?: "—", Icons.Rounded.People, ap, Modifier.weight(1f))
                EntStatCard("Rutinas",    dash?.rutinasCreadas?.toString() ?: "—",    Icons.Rounded.FitnessCenter, ap, Modifier.weight(1f))
                EntStatCard("Eval.",      dash?.evaluacionesPendientes?.toString() ?: "—", Icons.AutoMirrored.Rounded.Assignment, ap, Modifier.weight(1f))
            }
            val recientes = dash?.rutinasRecientes.orEmpty()
            if (recientes.isNotEmpty()) {
                Spacer(Modifier.height(22.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.width(3.dp).height(16.dp).background(ap.accent, RoundedCornerShape(2.dp)))
                    Spacer(Modifier.width(8.dp))
                    Text("Rutinas recientes", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.height(10.dp))
                recientes.take(5).forEach { r -> EntRutinaItem(r, ap); Spacer(Modifier.height(8.dp)) }
            } else {
                Spacer(Modifier.height(24.dp))
                Box(Modifier.fillMaxWidth().background(ENT_CARD, RoundedCornerShape(16.dp)).padding(28.dp), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Rounded.FitnessCenter, null, tint = ENT_GRIS, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.height(8.dp))
                        Text("Sin rutinas recientes", color = ENT_GRIS, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB CLIENTES
// ═══════════════════════════════════════════════════════════════════════════
@Composable
private fun TabClientes(clientes: List<EntrenadorClienteResponse>, ap: EntAp) {
    Column(Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxWidth().height(120.dp)) {
            Image(painterResource(R.drawable.fondo_login), null, contentScale = ContentScale.Crop, modifier = Modifier.matchParentSize())
            Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color.Black.copy(.7f), ENT_BG))))
            Column(Modifier.align(Alignment.BottomStart).padding(16.dp)) {
                Text("Mis Clientes", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                Text("${clientes.size} socios del gym asignados", color = ap.accent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
        if (clientes.isEmpty()) {
            Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Rounded.PeopleAlt, null, tint = ENT_GRIS, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(10.dp))
                    Text("Sin clientes asignados", color = ENT_GRIS, fontSize = 13.sp)
                }
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(clientes) { c ->
                    val ini = "${c.nombres?.firstOrNull() ?: ""}${c.apellidos?.firstOrNull() ?: ""}".uppercase().ifBlank { "?" }
                    val activo = c.estadoAcceso?.lowercase()?.contains("activ") == true
                    Surface(Modifier.fillMaxWidth(), RoundedCornerShape(14.dp), color = ENT_CARD, border = BorderStroke(1.dp, ENT_BORDE)) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(44.dp).background(ap.soft, CircleShape), contentAlignment = Alignment.Center) {
                                Text(ini, color = ap.accent, fontWeight = FontWeight.Black, fontSize = 15.sp)
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text("${c.nombres} ${c.apellidos}", color = Color.White, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(c.email ?: "Sin email", color = ENT_GRIS, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                            val dot by animateColorAsState(if (activo) Color(0xFF22C55E) else ENT_GRIS, tween(400), label = "")
                            Column(horizontalAlignment = Alignment.End) {
                                Box(Modifier.size(8.dp).background(dot, CircleShape))
                                Spacer(Modifier.height(3.dp))
                                Text(if (activo) "Activo" else "Inactivo", color = dot, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB RUTINAS
// ═══════════════════════════════════════════════════════════════════════════
@Composable
private fun TabRutinas(rutinas: List<RutinaResumenResponse>, ap: EntAp, onCrear: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxWidth().height(120.dp)) {
            Image(painterResource(R.drawable.image_03453d), null, contentScale = ContentScale.Crop, modifier = Modifier.matchParentSize())
            Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color.Black.copy(.65f), ENT_BG))))
            Row(Modifier.fillMaxWidth().align(Alignment.BottomStart).padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                Column {
                    Text("Rutinas", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                    Text("${rutinas.size} asignadas", color = ap.accent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Button(onClick = onCrear, colors = ButtonDefaults.buttonColors(containerColor = ap.accent), shape = RoundedCornerShape(12.dp), contentPadding = PaddingValues(horizontal = 14.dp, vertical = 9.dp)) {
                    Icon(Icons.Rounded.Add, null, modifier = Modifier.size(15.dp))
                    Spacer(Modifier.width(5.dp))
                    Text("Crear", color = Color.White, fontWeight = FontWeight.Black, fontSize = 12.sp)
                }
            }
        }
        if (rutinas.isEmpty()) {
            Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Rounded.FitnessCenter, null, tint = ENT_GRIS, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(10.dp))
                    Text("Sin rutinas creadas", color = ENT_GRIS, fontSize = 13.sp)
                    Spacer(Modifier.height(14.dp))
                    Button(onClick = onCrear, colors = ButtonDefaults.buttonColors(containerColor = ap.accent), shape = RoundedCornerShape(12.dp)) {
                        Icon(Icons.Rounded.Add, null, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(5.dp))
                        Text("Crear primera rutina", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(rutinas) { r -> EntRutinaItem(r, ap) }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAB PERFIL
// ═══════════════════════════════════════════════════════════════════════════
@Composable
private fun TabPerfil(perfil: EntrenadorPerfilResponse?, appConfig: AppConfigResponse, ap: EntAp, onCerrarSesion: () -> Unit) {
    val nombre   = listOfNotNull(perfil?.nombres, perfil?.apellidos).filter { it.isNotBlank() }.joinToString(" ").ifBlank { "Entrenador" }
    val correo   = perfil?.email?.ifBlank { null } ?: "—"
    val sucursal = perfil?.sucursal?.ifBlank { null } ?: sucursalPrincipalTexto(appConfig)
    val detalles = listOfNotNull(
        detalleCredencial("Especialidad", perfil?.especialidad),
        detalleCredencial("Teléfono",    perfil?.telefono),
        detalleCredencial("Rutinas",     perfil?.rutinasCreadas?.toString()),
        detalleCredencial("Estado",      if (perfil?.activo == true) "Activo" else if (perfil != null) "Inactivo" else null)
    )
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        CredencialSistemaCard(
            titulo = "", nombre = nombre, correo = correo,
            bloqueTitulo = "ESPECIALIDAD",
            bloqueValor  = perfil?.especialidad?.ifBlank { null } ?: "Entrenamiento General",
            sucursal = sucursal, permisos = rolLegible(perfil?.rol),
            detalles = detalles, integradaPantalla = true, appConfig = appConfig
        )
        Column(Modifier.padding(20.dp)) {
            Button(onClick = onCerrarSesion, modifier = Modifier.fillMaxWidth().height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ap.accent), shape = RoundedCornerShape(14.dp)) {
                Icon(Icons.AutoMirrored.Rounded.Logout, null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Cerrar Sesión", color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp)
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  CREAR RUTINA — pantalla completa (sin Scaffold anidado)
// ═══════════════════════════════════════════════════════════════════════════
private val TIPOS_RUTINA    = listOf("Hipertrofia", "Fuerza", "Definicion", "Resistencia", "Salud")
private val TIPOS_EJERCICIO = listOf("Fuerza", "Cardio", "Movilidad", "Funcional", "Estiramiento")
private val GENEROS         = listOf("Hombres", "Mujeres", "Todos")

private data class EjEd(
    val id: Long = 0L, val nombre: String = "",
    val tipo: String = "Fuerza", val series: Int = 3, val reps: Int = 12,
    val peso: String = "", val descanso: String = "60", val nota: String = "", val orden: Int = 1
)
private fun EjEd.toReq() = RutinaDetalleRequest(
    idEjercicio = id, tipoEjercicio = tipo, series = series, repeticiones = reps,
    pesoSugeridoKg = peso.toDoubleOrNull(), tiempoDescansoSegundos = descanso.toIntOrNull(),
    notas = nota.ifBlank { null }, orden = orden
)

@Composable
private fun PantallaCrearRutina(
    perfil:     EntrenadorPerfilResponse?,
    clientes:   List<EntrenadorClienteResponse>,
    ejercicios: List<EjercicioCatalogoResponse>,
    ap:         EntAp,
    onVolver:   () -> Unit,
    onGuardado: () -> Unit
) {
    val ctx = LocalContext.current

    var esGlobal   by remember { mutableStateOf(false) }
    var clienteId  by remember { mutableStateOf(clientes.firstOrNull()?.id ?: "") }
    var nombre     by remember { mutableStateOf("") }
    var tipo       by remember { mutableStateOf(TIPOS_RUTINA[0]) }
    var genero     by remember { mutableStateOf(GENEROS[2]) }
    var objetivo   by remember { mutableStateOf("") }
    var notasRut   by remember { mutableStateOf("") }
    var fInicio    by remember { mutableStateOf(calToIso(calHoy())) }
    var fFin       by remember { mutableStateOf(calMas(28)) }
    val listaEj    = remember { mutableStateListOf<EjEd>() }

    var openSocio  by remember { mutableStateOf(false) }
    var openTipo   by remember { mutableStateOf(false) }
    var openGenero by remember { mutableStateOf(false) }
    var guardando  by remember { mutableStateOf(false) }
    var errMsg     by remember { mutableStateOf<String?>(null) }
    val scope      = rememberCoroutineScope()

    // Auto-completar nombre y objetivo al cambiar tipo/género
    LaunchedEffect(tipo, genero) {
        if (nombre.isBlank() || nombre.startsWith("Rutina"))
            nombre = when (genero) { "Hombres" -> "Rutina hombre - $tipo"; "Mujeres" -> "Rutina mujer - $tipo"; else -> "Rutina mixta - $tipo" }
    }
    LaunchedEffect(genero) {
        if (objetivo.isBlank()) objetivo = when (genero) {
            "Hombres" -> "Hipertrofia, fuerza progresiva y control tecnico."
            "Mujeres" -> "Tonificacion, gluteos, fuerza funcional y resistencia."
            else      -> "Plan equilibrado adaptable para cualquier socio."
        }
    }

    fun abrirFecha(iso: String, onOk: (String) -> Unit) {
        val cal = isoACal(iso)
        DatePickerDialog(ctx, { _, y, m, d -> onOk("%04d-%02d-%02d".format(y, m + 1, d)) },
            cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show()
    }

    val valido = nombre.isNotBlank() && objetivo.isNotBlank() &&
            listaEj.isNotEmpty() && listaEj.all { it.id != 0L } &&
            (esGlobal || clienteId.isNotBlank())

    fun guardar() {
        if (!valido || guardando) return
        guardando = true; errMsg = null
        scope.launch {
            try {
                RetrofitClient.apiService.crearRutina(RutinaRequest(
                    idSocio = if (esGlobal) null else clienteId.ifBlank { null },
                    idEntrenador = perfil?.id ?: "",
                    esGlobal = esGlobal, nombre = nombre.trim(),
                    tipoRutina = tipo, generoObjetivo = genero,
                    fechaInicio = fInicio, fechaFin = fFin,
                    objetivo = objetivo.trim(), notas = notasRut.ifBlank { null },
                    detalles = listaEj.map { it.toReq() }
                ))
                onGuardado()
            } catch (e: Exception) { errMsg = e.message ?: "Error al guardar"; guardando = false }
        }
    }

    // Pantalla completa con insets correctos
    Column(
        Modifier.fillMaxSize().background(ENT_BG).statusBarsPadding().navigationBarsPadding()
    ) {
        // ── Top bar ──────────────────────────────────────────────────────
        Surface(color = ENT_CARD) {
            Row(Modifier.fillMaxWidth().padding(start = 4.dp, end = 8.dp, top = 4.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onVolver) { Icon(Icons.Rounded.Close, "Volver", tint = Color.White) }
                Column(Modifier.weight(1f)) {
                    Text("Constructor de rutinas", color = Color.White, fontWeight = FontWeight.Black, fontSize = 16.sp)
                    Text(if (esGlobal) "Global · todos los socios" else "Rutina personal", color = ap.accent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                if (guardando) {
                    CircularProgressIndicator(Modifier.size(22.dp), color = ap.accent, strokeWidth = 2.dp)
                    Spacer(Modifier.width(12.dp))
                } else {
                    IconButton(onClick = ::guardar, enabled = valido) {
                        Icon(Icons.Rounded.Check, "Guardar", tint = if (valido) ap.accent else ENT_GRIS)
                    }
                }
            }
        }

        // ── Contenido scrollable ──────────────────────────────────────────
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 14.dp)) {

            // Banner error
            if (errMsg != null) {
                Surface(Modifier.fillMaxWidth(), RoundedCornerShape(12.dp), color = ap.soft, border = BorderStroke(1.dp, ap.accent.copy(.3f))) {
                    Text(errMsg!!, color = ap.accent, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(12.dp))
                }
                Spacer(Modifier.height(12.dp))
            }

            // ALCANCE
            EntL("ALCANCE")
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                EntSeg("Personal", Icons.Rounded.Person, !esGlobal, ap, Modifier.weight(1f)) { esGlobal = false }
                EntSeg("Global",   Icons.Rounded.People, esGlobal,  ap, Modifier.weight(1f)) { esGlobal = true }
            }

            Spacer(Modifier.height(16.dp))

            // SOCIO
            if (!esGlobal) {
                EntL("SOCIO DEL GYM")
                Spacer(Modifier.height(6.dp))
                val cSel = clientes.find { it.id == clienteId }
                Box {
                    EntDrop(if (cSel != null) "${cSel.nombres} ${cSel.apellidos}" else "Selecciona socio", Icons.Rounded.Person, ap, cSel == null) { openSocio = true }
                    DropdownMenu(openSocio, { openSocio = false }, Modifier.background(Color(0xFF111111)).heightIn(max = 250.dp)) {
                        if (clientes.isEmpty()) {
                            DropdownMenuItem(text = { Text("Sin socios asignados", color = ENT_GRIS, fontSize = 13.sp) }, onClick = { openSocio = false })
                        } else {
                            clientes.forEach { c ->
                                DropdownMenuItem(
                                    text = { Column {
                                        Text("${c.nombres} ${c.apellidos}", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        if (!c.email.isNullOrBlank()) Text(c.email, color = ENT_GRIS, fontSize = 11.sp)
                                    }},
                                    onClick = { clienteId = c.id ?: ""; openSocio = false }
                                )
                            }
                        }
                    }
                }
                Spacer(Modifier.height(14.dp))
            }

            // NOMBRE
            EntL("NOMBRE DE RUTINA")
            Spacer(Modifier.height(6.dp))
            EntTF(nombre, "Ej. Rutina mujer - Glúteos", ap) { nombre = it }

            Spacer(Modifier.height(14.dp))

            // TIPO + GÉNERO
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Column(Modifier.weight(1f)) {
                    EntL("TIPO")
                    Spacer(Modifier.height(6.dp))
                    Box {
                        EntDrop(tipo, null, ap, false) { openTipo = true }
                        DropdownMenu(openTipo, { openTipo = false }, Modifier.background(Color(0xFF111111))) {
                            TIPOS_RUTINA.forEach { t ->
                                DropdownMenuItem(text = { Text(t, color = if (t == tipo) ap.accent else Color.White, fontWeight = if (t == tipo) FontWeight.Black else FontWeight.Normal) }, onClick = { tipo = t; openTipo = false })
                            }
                        }
                    }
                }
                Column(Modifier.weight(1f)) {
                    EntL("GÉNERO")
                    Spacer(Modifier.height(6.dp))
                    Box {
                        EntDrop(genero, null, ap, false) { openGenero = true }
                        DropdownMenu(openGenero, { openGenero = false }, Modifier.background(Color(0xFF111111))) {
                            GENEROS.forEach { g ->
                                DropdownMenuItem(text = { Text(g, color = if (g == genero) ap.accent else Color.White, fontWeight = if (g == genero) FontWeight.Black else FontWeight.Normal) }, onClick = { genero = g; openGenero = false })
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // FECHAS
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Column(Modifier.weight(1f)) {
                    EntL("FECHA INICIO")
                    Spacer(Modifier.height(6.dp))
                    EntFecha(isoADisplay(fInicio), ap) { abrirFecha(fInicio) { fInicio = it } }
                }
                Column(Modifier.weight(1f)) {
                    EntL("FECHA FIN")
                    Spacer(Modifier.height(6.dp))
                    EntFecha(isoADisplay(fFin), ap) { abrirFecha(fFin) { fFin = it } }
                }
            }

            Spacer(Modifier.height(14.dp))

            // OBJETIVO
            EntL("OBJETIVO")
            Spacer(Modifier.height(6.dp))
            EntTF(objetivo, "Ej. Hipertrofia, fuerza progresiva…", ap) { objetivo = it }

            Spacer(Modifier.height(14.dp))

            // NOTAS
            EntL("NOTAS (opcional)")
            Spacer(Modifier.height(6.dp))
            EntTA(notasRut, "Indicaciones generales, calentamiento…", ap) { notasRut = it }

            Spacer(Modifier.height(22.dp))

            // EJERCICIOS
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.width(3.dp).height(15.dp).background(ap.accent, RoundedCornerShape(2.dp)))
                        Spacer(Modifier.width(8.dp))
                        Text("Ejercicios del plan", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
                    }
                    Text("${listaEj.size} añadidos", color = ENT_GRIS, fontSize = 11.sp, modifier = Modifier.padding(start = 11.dp))
                }
                OutlinedButton(
                    onClick = {
                        val e = ejercicios.firstOrNull()
                        listaEj.add(EjEd(id = e?.id ?: 0L, nombre = e?.nombre ?: "", orden = listaEj.size + 1))
                    },
                    enabled = ejercicios.isNotEmpty(),
                    border  = BorderStroke(1.dp, ap.accent.copy(.5f)),
                    shape   = RoundedCornerShape(10.dp),
                    colors  = ButtonDefaults.outlinedButtonColors(contentColor = ap.accent)
                ) {
                    Icon(Icons.Rounded.Add, null, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("+ Agregar", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            if (ejercicios.isEmpty()) {
                Spacer(Modifier.height(10.dp))
                Surface(Modifier.fillMaxWidth(), RoundedCornerShape(12.dp), color = ENT_CARD, border = BorderStroke(1.dp, ENT_BORDE)) {
                    Text("⚠ Sin ejercicios en catálogo. Regístralos desde la web.", color = ENT_GRIS, fontSize = 12.sp, modifier = Modifier.padding(14.dp))
                }
            }

            Spacer(Modifier.height(12.dp))

            listaEj.forEachIndexed { idx, ej ->
                EjBloque(idx, ej, ejercicios, ap, { listaEj[idx] = it }) {
                    listaEj.removeAt(idx)
                    listaEj.forEachIndexed { i, e -> listaEj[i] = e.copy(orden = i + 1) }
                }
                Spacer(Modifier.height(10.dp))
            }

            Spacer(Modifier.height(18.dp))

            // Botón guardar
            Button(
                onClick  = ::guardar,
                enabled  = valido && !guardando,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                colors   = ButtonDefaults.buttonColors(containerColor = ap.accent, disabledContainerColor = ap.soft),
                shape    = RoundedCornerShape(14.dp)
            ) {
                if (guardando) { CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp); Spacer(Modifier.width(8.dp)) }
                else { Icon(Icons.Rounded.FitnessCenter, null, modifier = Modifier.size(17.dp)); Spacer(Modifier.width(7.dp)) }
                Text(if (guardando) "Asignando…" else if (esGlobal) "Asignar a todos" else "Asignar rutina",
                    color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

// ─── Bloque ejercicio — estado aislado ──────────────────────────────────────
@Composable
private fun EjBloque(idx: Int, ej: EjEd, ejercicios: List<EjercicioCatalogoResponse>, ap: EntAp, onChange: (EjEd) -> Unit, onDel: () -> Unit) {
    var openEj   by remember { mutableStateOf(false) }
    var openTipo by remember { mutableStateOf(false) }

    Surface(Modifier.fillMaxWidth(), RoundedCornerShape(16.dp), color = ENT_CARD, border = BorderStroke(1.dp, ENT_BORDE)) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(26.dp).background(ap.soft, CircleShape), contentAlignment = Alignment.Center) {
                        Text("${idx + 1}", color = ap.accent, fontSize = 11.sp, fontWeight = FontWeight.Black)
                    }
                    Spacer(Modifier.width(8.dp))
                    Text("EJERCICIO ${idx + 1}", color = ap.accent, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                }
                IconButton(onClick = onDel, modifier = Modifier.size(30.dp)) {
                    Icon(Icons.Rounded.Delete, null, tint = ENT_GRIS, modifier = Modifier.size(16.dp))
                }
            }
            Spacer(Modifier.height(10.dp))
            EntL("EJERCICIO")
            Spacer(Modifier.height(4.dp))
            Box {
                EntDrop(ej.nombre.ifBlank { "Selecciona ejercicio" }, Icons.Rounded.FitnessCenter, ap, ej.id == 0L) { openEj = true }
                DropdownMenu(openEj, { openEj = false }, Modifier.background(Color(0xFF111111)).heightIn(max = 260.dp)) {
                    ejercicios.forEach { e ->
                        DropdownMenuItem(
                            text = { Column {
                                Text(e.nombre ?: "—", color = if (e.id == ej.id) ap.accent else Color.White, fontSize = 13.sp)
                                if (e.grupoMuscular?.nombre != null) Text(e.grupoMuscular.nombre, color = ENT_GRIS, fontSize = 11.sp)
                            }},
                            onClick = { onChange(ej.copy(id = e.id ?: 0L, nombre = e.nombre ?: "")); openEj = false }
                        )
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
            EntL("TIPO")
            Spacer(Modifier.height(4.dp))
            Box {
                EntDrop(ej.tipo, null, ap, false) { openTipo = true }
                DropdownMenu(openTipo, { openTipo = false }, Modifier.background(Color(0xFF111111))) {
                    TIPOS_EJERCICIO.forEach { t ->
                        DropdownMenuItem(text = { Text(t, color = if (t == ej.tipo) ap.accent else Color.White) }, onClick = { onChange(ej.copy(tipo = t)); openTipo = false })
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
            EntL("SERIES · REPS · PESO KG · DESCANSO SEG")
            Spacer(Modifier.height(6.dp))
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                EntNum("Series",  ej.series.toString(), "3")  { v -> onChange(ej.copy(series  = v.toIntOrNull() ?: ej.series)) }
                EntNum("Reps",    ej.reps.toString(),   "12") { v -> onChange(ej.copy(reps    = v.toIntOrNull() ?: ej.reps)) }
                EntNum("Peso kg", ej.peso,              "—")  { v -> onChange(ej.copy(peso    = v)) }
                EntNum("Desc. s", ej.descanso,          "60") { v -> onChange(ej.copy(descanso= v)) }
            }
            Spacer(Modifier.height(10.dp))
            EntL("NOTA (opcional)")
            Spacer(Modifier.height(4.dp))
            OutlinedTextField(
                value = ej.nota, onValueChange = { onChange(ej.copy(nota = it)) },
                placeholder = { Text("Ej. Controlar técnica, tempo 3-1-1…", color = ENT_GRIS, fontSize = 12.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                    focusedBorderColor = ENT_GRIS.copy(.4f), unfocusedBorderColor = ENT_BORDE,
                    focusedContainerColor = ENT_CARD2, unfocusedContainerColor = ENT_CARD2
                ),
                shape = RoundedCornerShape(10.dp), textStyle = TextStyle(fontSize = 13.sp),
                modifier = Modifier.fillMaxWidth(), singleLine = true
            )
        }
    }
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
@Composable private fun EntL(text: String) =
    Text(text, color = ENT_GRIS, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)

@Composable private fun EntSeg(label: String, icon: ImageVector, activo: Boolean, ap: EntAp, modifier: Modifier, onClick: () -> Unit) {
    Surface(modifier.clickable { onClick() }, RoundedCornerShape(12.dp), color = if (activo) ap.soft else ENT_CARD2, border = BorderStroke(1.dp, if (activo) ap.accent.copy(.55f) else ENT_BORDE)) {
        Row(Modifier.padding(horizontal = 14.dp, vertical = 13.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = if (activo) ap.accent else ENT_GRIS, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text(label, color = if (activo) ap.accent else ENT_GRIS, fontSize = 13.sp, fontWeight = if (activo) FontWeight.Black else FontWeight.Medium)
        }
    }
}

@Composable private fun EntDrop(label: String, icono: ImageVector?, ap: EntAp, vacio: Boolean, onClick: () -> Unit) {
    Surface(Modifier.fillMaxWidth().clickable { onClick() }, RoundedCornerShape(12.dp), color = ENT_CARD2, border = BorderStroke(1.dp, ENT_BORDE)) {
        Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
            if (icono != null) { Icon(icono, null, tint = ENT_GRIS, modifier = Modifier.size(15.dp)); Spacer(Modifier.width(9.dp)) }
            Text(label, color = if (vacio) ENT_GRIS else Color.White, fontSize = 13.sp, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
            Icon(Icons.Rounded.KeyboardArrowDown, null, tint = ENT_GRIS, modifier = Modifier.size(17.dp))
        }
    }
}

@Composable private fun EntFecha(label: String, ap: EntAp, onClick: () -> Unit) {
    Surface(Modifier.fillMaxWidth().clickable { onClick() }, RoundedCornerShape(12.dp), color = ENT_CARD2, border = BorderStroke(1.dp, ENT_BORDE)) {
        Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.CalendarMonth, null, tint = ap.accent, modifier = Modifier.size(15.dp))
            Spacer(Modifier.width(9.dp))
            Text(label, color = Color.White, fontSize = 13.sp, modifier = Modifier.weight(1f))
        }
    }
}

@Composable private fun EntTF(v: String, ph: String, ap: EntAp, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = v, onValueChange = onChange,
        placeholder = { Text(ph, color = ENT_GRIS, fontSize = 13.sp) },
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.White, unfocusedTextColor = Color.White,
            focusedBorderColor = ap.accent.copy(.7f), unfocusedBorderColor = ENT_BORDE,
            cursorColor = ap.accent, focusedContainerColor = ENT_CARD2, unfocusedContainerColor = ENT_CARD2
        ),
        shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth(), singleLine = true
    )
}

@Composable private fun EntTA(v: String, ph: String, ap: EntAp, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = v, onValueChange = onChange,
        placeholder = { Text(ph, color = ENT_GRIS, fontSize = 13.sp) },
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.White, unfocusedTextColor = Color.White,
            focusedBorderColor = ap.accent.copy(.6f), unfocusedBorderColor = ENT_BORDE,
            cursorColor = ap.accent, focusedContainerColor = ENT_CARD2, unfocusedContainerColor = ENT_CARD2
        ),
        shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().heightIn(min = 76.dp), maxLines = 4
    )
}

@Composable private fun EntNum(label: String, value: String, hint: String, onChange: (String) -> Unit) {
    Surface(Modifier.width(82.dp), RoundedCornerShape(10.dp), color = ENT_CARD, border = BorderStroke(1.dp, ENT_BORDE)) {
        Column(Modifier.padding(10.dp)) {
            Text(label, color = ENT_GRIS, fontSize = 9.sp, fontWeight = FontWeight.Black, maxLines = 1)
            Spacer(Modifier.height(4.dp))
            BasicTextField(
                value = value, onValueChange = onChange,
                textStyle = TextStyle(color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                decorationBox = { inner -> if (value.isEmpty()) Text(hint, color = ENT_GRIS, fontSize = 14.sp) else inner() }
            )
        }
    }
}

@Composable private fun EntRutinaItem(r: RutinaResumenResponse, ap: EntAp) {
    Surface(Modifier.fillMaxWidth(), RoundedCornerShape(13.dp), color = ENT_CARD, border = BorderStroke(1.dp, ENT_BORDE)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(40.dp).background(ap.soft, RoundedCornerShape(11.dp)), contentAlignment = Alignment.Center) {
                Icon(Icons.Rounded.FitnessCenter, null, tint = ap.accent, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(r.nombre ?: r.objetivo ?: "Sin nombre", color = Color.White, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("${r.tipoRutina ?: "General"} · ${r.socio ?: "Global"}", color = ENT_GRIS, fontSize = 11.sp)
            }
            if (r.esGlobal == true) {
                Surface(shape = RoundedCornerShape(20.dp), color = ap.soft) {
                    Text("GLOBAL", color = ap.accent, fontSize = 9.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }
        }
    }
}

@Composable private fun EntStatCard(label: String, valor: String, icono: ImageVector, ap: EntAp, modifier: Modifier) {
    Surface(modifier, RoundedCornerShape(16.dp), color = ENT_CARD, border = BorderStroke(1.dp, ENT_BORDE)) {
        Column(Modifier.padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.size(36.dp).background(ap.soft, RoundedCornerShape(10.dp)), contentAlignment = Alignment.Center) {
                Icon(icono, null, tint = ap.accent, modifier = Modifier.size(17.dp))
            }
            Spacer(Modifier.height(8.dp))
            Text(valor, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
            Text(label, color = ENT_GRIS, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}