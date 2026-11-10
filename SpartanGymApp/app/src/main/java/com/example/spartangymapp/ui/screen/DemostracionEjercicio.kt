package com.example.spartangymapp.ui.screen

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.RectF
import android.provider.Settings
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.caverock.androidsvg.SVG
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.text.Normalizer
import kotlin.math.max

private const val FLOW_DATASET_BASE = "https://raw.githubusercontent.com/ozansozuozgit/flow-exercise-dataset/main/"
private const val FLOW_DATASET_ATTRIBUTION = "Demostraciones: Flow Exercise Dataset · ilustrativas"

private data class AnimacionMovimiento(
    val nombre: String,
    val imagenes: List<androidx.compose.ui.graphics.ImageBitmap>,
    val secuencia: List<Int>,
    val duracionMs: Long
)

@Composable
@OptIn(ExperimentalMaterial3Api::class)
internal fun DemostracionEjercicio(
    nombre: String,
    detalle: String,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val reducedMotion = remember {
        runCatching {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f
            ) == 0f
        }.getOrDefault(false)
    }
    var animacion by remember(nombre) { mutableStateOf<AnimacionMovimiento?>(null) }
    var cargando by remember(nombre) { mutableStateOf(true) }
    var frame by remember(nombre) { mutableIntStateOf(0) }
    var reproduciendo by remember(nombre) { mutableStateOf(!reducedMotion) }
    var sinCoincidencia by remember(nombre) { mutableStateOf(false) }

    LaunchedEffect(nombre) {
        cargando = true
        sinCoincidencia = false
        animacion = withContext(Dispatchers.IO) {
            cargarAnimacionEjercicio(context, nombre)
        }
        sinCoincidencia = animacion == null
        cargando = false
    }

    LaunchedEffect(animacion, reproduciendo) {
        val actual = animacion ?: return@LaunchedEffect
        if (!reproduciendo || actual.secuencia.isEmpty()) return@LaunchedEffect
        while (true) {
            delay(actual.duracionMs.coerceIn(140L, 900L))
            frame = (frame + 1) % actual.secuencia.size
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF111114),
        contentColor = Color.White,
        dragHandle = {
            Box(
                Modifier.padding(top = 12.dp).size(width = 38.dp, height = 4.dp)
                    .clip(CircleShape).background(Color(0xFF45454A))
            )
        }
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("DEMOSTRACIÓN", color = MaterialTheme.colorScheme.primary, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.1.sp)
            Text(nombre, color = Color.White, fontSize = 22.sp, lineHeight = 26.sp, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
            Text(detalle, color = Color(0xFFB8B8BE), fontSize = 13.sp)

            Box(
                modifier = Modifier.fillMaxWidth().height(190.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Brush.verticalGradient(listOf(Color(0xFF25252B), Color(0xFF17171B))))
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                val actual = animacion
                if (actual != null && actual.imagenes.isNotEmpty()) {
                    val indice = actual.secuencia.getOrElse(frame) { 0 }.coerceIn(actual.imagenes.indices)
                    Image(
                        bitmap = actual.imagenes[indice],
                        contentDescription = "Figura demostrando $nombre",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = androidx.compose.ui.layout.ContentScale.Fit
                    )
                } else {
                    FiguraEjercicioFallback(nombre = nombre, animando = reproduciendo && !reducedMotion)
                }

                if (cargando) {
                    Surface(
                        modifier = Modifier.align(Alignment.BottomCenter),
                        shape = RoundedCornerShape(20.dp),
                        color = Color.Black.copy(alpha = 0.62f)
                    ) {
                        Text("Cargando demostración…", color = Color.White, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp))
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    if (sinCoincidencia) "Vista orientativa" else FLOW_DATASET_ATTRIBUTION,
                    color = Color(0xFF8F9098),
                    fontSize = 11.sp,
                    modifier = Modifier.weight(1f)
                )
                TextButton(
                    onClick = { reproduciendo = !reproduciendo },
                    modifier = Modifier.height(48.dp)
                ) {
                    Icon(
                        imageVector = if (reproduciendo) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(if (reproduciendo) "Pausar" else "Reproducir", color = Color.White)
                }
            }

            Text(
                "Es una guía visual, no una indicación de técnica. Confirma la ejecución y las variantes con tu entrenador.",
                color = Color(0xFF9A9AA2),
                fontSize = 12.sp,
                lineHeight = 17.sp
            )
        }
    }
}

private suspend fun cargarAnimacionEjercicio(context: Context, nombre: String): AnimacionMovimiento? {
    val cache = File(context.cacheDir, "flow-exercise").apply { mkdirs() }
    return try {
        val indiceFile = File(cache, "exercises.json")
        val indice = leerTextoRemotoOCache(FLOW_DATASET_BASE + "data/exercises.json", indiceFile)
        val registros = JSONArray(indice)
        val consulta = normalizarEjercicio(nombre)
        val traducida = traducirEjercicio(consulta)
        val mejor = (0 until registros.length())
            .mapNotNull { i ->
                val item = registros.optJSONObject(i) ?: return@mapNotNull null
                val animation = item.optJSONObject("animation") ?: return@mapNotNull null
                if (item.optString("mediaStatus") != "custom-svg") return@mapNotNull null
                val candidato = normalizarEjercicio(item.optString("name"))
                val puntuacion = puntuarCoincidencia(traducida, candidato)
                if (puntuacion < 0.55) null else Triple(puntuacion, item, animation)
            }
            .maxByOrNull { it.first }
            ?: return null

        val item = mejor.second
        val animation = mejor.third
        val paths = animation.optJSONArray("frames") ?: return null
        val imagenes = buildList {
            for (i in 0 until paths.length()) {
                val path = paths.optString(i)
                if (!path.startsWith("assets/") || path.contains("..")) return null
                val archivo = File(cache, path.replace('/', '_'))
                val svgText = leerTextoRemotoOCache(FLOW_DATASET_BASE + path, archivo)
                add(renderizarSvg(svgText).asImageBitmap())
            }
        }
        if (imagenes.isEmpty()) return null

        val secuenciaJson = animation.optJSONArray("sequence")
        val secuencia = if (secuenciaJson == null || secuenciaJson.length() == 0) {
            imagenes.indices.toList()
        } else {
            (0 until secuenciaJson.length()).map { secuenciaJson.optInt(it, 0).coerceIn(imagenes.indices) }
        }
        AnimacionMovimiento(
            nombre = item.optString("name"),
            imagenes = imagenes,
            secuencia = secuencia,
            duracionMs = animation.optLong("frameDurationMs", 180L)
        )
    } catch (_: Exception) {
        null
    }
}

private fun leerTextoRemotoOCache(url: String, archivo: File): String {
    if (archivo.exists() && archivo.length() > 0L) return archivo.readText(Charsets.UTF_8)
    val conexion = URL(url).openConnection() as HttpURLConnection
    conexion.connectTimeout = 8_000
    conexion.readTimeout = 8_000
    conexion.setRequestProperty("User-Agent", "SpartanGym-Android")
    return try {
        conexion.inputStream.bufferedReader(Charsets.UTF_8).use { reader ->
            val texto = reader.readText()
            archivo.writeText(texto, Charsets.UTF_8)
            texto
        }
    } finally {
        conexion.disconnect()
    }
}

private fun renderizarSvg(texto: String): Bitmap {
    val svg = SVG.getFromString(texto)
    val ancho = 420
    val alto = 300
    val bitmap = Bitmap.createBitmap(ancho, alto, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    svg.renderToCanvas(canvas, RectF(0f, 0f, ancho.toFloat(), alto.toFloat()))
    return bitmap
}

private fun normalizarEjercicio(texto: String): String = Normalizer
    .normalize(texto, Normalizer.Form.NFD)
    .replace(Regex("\\p{Mn}+"), "")
    .lowercase()
    .replace(Regex("[^a-z0-9 ]+"), " ")
    .replace(Regex("\\s+"), " ")
    .trim()

private fun traducirEjercicio(texto: String): String {
    val equivalencias = listOf(
        "press de banca" to "bench press",
        "press banca" to "bench press",
        "sentadilla" to "squat",
        "sentadillas" to "squat",
        "peso muerto" to "deadlift",
        "flexion" to "push up",
        "flexiones" to "push up",
        "remo" to "row",
        "jalon" to "pulldown",
        "curl de biceps" to "biceps curl",
        "elevacion lateral" to "lateral raise",
        "extension de triceps" to "triceps extension",
        "puente de gluteos" to "glute bridge",
        "plancha" to "plank",
        "zancada" to "lunge",
        "zancadas" to "lunge"
    )
    return equivalencias.firstOrNull { (espanol, _) -> texto.contains(espanol) }
        ?.let { (espanol, ingles) -> texto.replace(espanol, ingles) }
        ?: texto
}

private fun puntuarCoincidencia(consulta: String, candidato: String): Double {
    if (consulta == candidato) return 1.0
    if (consulta.length >= 6 && (consulta.contains(candidato) || candidato.contains(consulta))) return 0.82
    val tokensConsulta = consulta.split(' ').filter { it.length > 2 }.toSet()
    val tokensCandidato = candidato.split(' ').filter { it.length > 2 }.toSet()
    if (tokensConsulta.isEmpty() || tokensCandidato.isEmpty()) return 0.0
    val compartidos = tokensConsulta.intersect(tokensCandidato).size.toDouble()
    return compartidos / max(tokensConsulta.size, tokensCandidato.size)
}

@Composable
private fun FiguraEjercicioFallback(nombre: String, animando: Boolean) {
    val movimiento = remember(nombre) {
        when {
            listOf("squat", "sentadilla", "lunge", "zancada", "prensa de pierna").any(nombre::contains) -> "piernas"
            listOf("curl", "biceps", "bíceps", "press", "push", "flexion", "empuje").any(nombre::contains) -> "brazos"
            listOf("row", "remo", "pull", "jalon", "jalón").any(nombre::contains) -> "tiron"
            else -> "general"
        }
    }
    val t = if (animando) {
        val transition = rememberInfiniteTransition(label = "Figura del ejercicio")
        val fase by transition.animateFloat(
            initialValue = 0f,
            targetValue = 1f,
            animationSpec = infiniteRepeatable(
                animation = tween(1_100, easing = LinearEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "Repetición ilustrativa"
        )
        fase
    } else {
        0f
    }
    val accent = MaterialTheme.colorScheme.primary

    Canvas(Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 10.dp)) {
        val cx = size.width * 0.5f
        val floor = size.height * 0.84f
        val head = Offset(cx, size.height * 0.18f)
        val shoulder = Offset(cx, size.height * 0.35f)
        val hipY = if (movimiento == "piernas") size.height * (0.58f + 0.12f * t) else size.height * 0.59f
        val hip = Offset(cx, hipY)
        val shoulderWidth = size.width * 0.13f
        val legSwing = size.width * 0.06f * t
        val armTargetY = when (movimiento) {
            "brazos" -> size.height * (0.50f - 0.10f * t)
            "tiron" -> size.height * (0.43f + 0.10f * t)
            else -> size.height * 0.50f
        }
        val lineWidth = size.width * 0.028f
        val body = Color(0xFFF2F2F4)

        drawLine(Color(0xFF48484E), Offset(size.width * 0.12f, floor), Offset(size.width * 0.88f, floor), 2.dp.toPx(), cap = StrokeCap.Round)
        drawCircle(body, radius = size.minDimension * 0.065f, center = head)
        drawLine(body, shoulder, hip, lineWidth, cap = StrokeCap.Round)
        drawLine(body, Offset(cx - shoulderWidth, shoulder.y), Offset(cx + shoulderWidth, shoulder.y), lineWidth, cap = StrokeCap.Round)
        drawLine(body, Offset(cx - shoulderWidth, shoulder.y), Offset(cx - shoulderWidth * 1.45f, armTargetY), lineWidth, cap = StrokeCap.Round)
        drawLine(body, Offset(cx - shoulderWidth * 1.45f, armTargetY), Offset(cx - shoulderWidth * 0.85f, armTargetY - size.height * 0.05f), lineWidth, cap = StrokeCap.Round)
        drawLine(body, Offset(cx + shoulderWidth, shoulder.y), Offset(cx + shoulderWidth * 1.45f, armTargetY), lineWidth, cap = StrokeCap.Round)
        drawLine(body, Offset(cx + shoulderWidth * 1.45f, armTargetY), Offset(cx + shoulderWidth * 0.85f, armTargetY - size.height * 0.05f), lineWidth, cap = StrokeCap.Round)
        drawLine(body, hip, Offset(cx - shoulderWidth * 0.72f - legSwing, floor), lineWidth, cap = StrokeCap.Round)
        drawLine(body, hip, Offset(cx + shoulderWidth * 0.72f + legSwing, floor), lineWidth, cap = StrokeCap.Round)
        drawCircle(accent, radius = lineWidth * 0.75f, center = Offset(cx, shoulder.y))
        drawCircle(accent, radius = lineWidth * 0.75f, center = hip)
        if (movimiento == "brazos") {
            drawLine(accent, Offset(cx - size.width * 0.28f, armTargetY - size.height * 0.07f), Offset(cx + size.width * 0.28f, armTargetY - size.height * 0.07f), lineWidth * 0.7f, cap = StrokeCap.Round)
            drawCircle(accent, size.minDimension * 0.02f, Offset(cx - size.width * 0.28f, armTargetY - size.height * 0.07f))
            drawCircle(accent, size.minDimension * 0.02f, Offset(cx + size.width * 0.28f, armTargetY - size.height * 0.07f))
        }
        drawArc(accent.copy(alpha = 0.45f), 205f, 130f, false, Offset(cx - 34.dp.toPx(), size.height * 0.36f), androidx.compose.ui.geometry.Size(68.dp.toPx(), 56.dp.toPx()), style = Stroke(2.dp.toPx(), cap = StrokeCap.Round))
    }
}
