package com.example.spartangymapp.ui.screen

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Business
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material.icons.outlined.WorkOutline
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.spartangymapp.network.AppConfigResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL

@Composable
internal fun CredencialSistemaCard(
    titulo: String,
    nombre: String,
    correo: String,
    bloqueTitulo: String,
    bloqueValor: String,
    sucursal: String,
    permisos: String,
    detalles: List<Pair<String, String>> = emptyList(),
    integradaPantalla: Boolean = false,
    appConfig: AppConfigResponse = AppConfigResponse(),
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    if (integradaPantalla) {
        CredencialPantallaIntegrada(
            nombre = nombre,
            correo = correo,
            bloqueTitulo = bloqueTitulo,
            bloqueValor = bloqueValor,
            sucursal = sucursal,
            permisos = permisos,
            detalles = detalles,
            appConfig = appConfig,
            modifier = modifier
        )
        return
    }

    Column(modifier = modifier) {
        if (titulo.isNotBlank()) {
            Text(
                text = titulo.uppercase(),
                color = Color(0xFF8F96A8),
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.6.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 10.dp)
            )
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = if (integradaPantalla) RoundedCornerShape(0.dp) else RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            border = if (integradaPantalla) null else BorderStroke(1.dp, Color(0xFF1D1D1D))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color(0xFF181818),
                                Color(0xFF090909),
                                Color(0xFF050505)
                            )
                        )
                    )
                    .padding(
                        horizontal = if (integradaPantalla) 14.dp else 18.dp,
                        vertical = if (integradaPantalla) 12.dp else 18.dp
                    )
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    if (!integradaPantalla) {
                        Box(
                            modifier = Modifier
                                .width(42.dp)
                                .height(5.dp)
                                .clip(RoundedCornerShape(999.dp))
                                .background(Color(0xFF303030))
                        )

                        Spacer(modifier = Modifier.height(20.dp))
                    }

                    Surface(
                        modifier = Modifier
                            .size(if (integradaPantalla) 66.dp else 76.dp)
                            .graphicsLayer(rotationZ = 3f),
                        shape = RoundedCornerShape(18.dp),
                        color = Color(0xFF0C141B),
                        border = BorderStroke(1.dp, Color(0xFF00AEEF))
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Outlined.CameraAlt,
                                contentDescription = null,
                                tint = Color(0xFF7E8796),
                                modifier = Modifier.size(27.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = nombre.ifBlank { "Sin nombre registrado" },
                        color = Color.White,
                        fontSize = 21.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Text(
                        text = correo.ifBlank { "Sin correo registrado" },
                        color = Color(0xFF9AA1AD),
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    CredencialBloqueDestacado(
                        titulo = bloqueTitulo,
                        valor = bloqueValor.ifBlank { "Sin asignar" }
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    CredencialBloqueSucursal(
                        titulo = "SUCURSAL ASIGNADA",
                        valor = sucursal.ifBlank { "Spartan Gym, Centro de Mando" }
                    )

                    if (detalles.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        CredencialDetallesApi(detalles.take(6))
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.VerifiedUser,
                            contentDescription = null,
                            tint = Color(0xFF7E8796),
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(7.dp))
                        Text(
                            text = permisos.uppercase(),
                            color = Color(0xFF9AA1AD),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Icon(
                            imageVector = Icons.Outlined.MoreHoriz,
                            contentDescription = null,
                            tint = Color(0xFF5C78A6),
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CredencialPantallaIntegrada(
    nombre: String,
    correo: String,
    bloqueTitulo: String,
    bloqueValor: String,
    sucursal: String,
    permisos: String,
    detalles: List<Pair<String, String>>,
    appConfig: AppConfigResponse,
    modifier: Modifier = Modifier
) {
    val minHeight = (LocalConfiguration.current.screenHeightDp - 88).coerceAtLeast(560).dp
    val apariencia = remember(appConfig.accentColor, appConfig.accentHoverColor, appConfig.accentSoftColor) {
        CredencialApariencia.desde(appConfig)
    }
    val logoPrincipal = appConfig.logoPrincipal?.trim()?.takeIf { it.isNotBlank() }
    val logoAcceso = appConfig.logoAcceso?.trim()?.takeIf { it.isNotBlank() }
    val logo = logoPrincipal ?: logoAcceso

    Box(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = minHeight)
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        apariencia.soft.copy(alpha = 0.34f),
                        Color(0xFF080808),
                        Color(0xFF000000),
                        Color(0xFF000000)
                    )
                )
            )
            .padding(horizontal = 20.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 56.dp, bottom = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .width(44.dp)
                    .height(5.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color(0xFF272727))
            )

            Spacer(modifier = Modifier.height(26.dp))

            Surface(
                modifier = Modifier
                    .size(84.dp)
                    .graphicsLayer(rotationZ = 3f),
                shape = RoundedCornerShape(18.dp),
                color = Color(0xFF0B1118),
                border = BorderStroke(1.dp, apariencia.accent)
            ) {
                LogoConfiguracion(
                    source = logo,
                    fallbackTint = apariencia.textMuted,
                    modifier = Modifier.padding(10.dp)
                )
            }

            Spacer(modifier = Modifier.height(22.dp))

            Text(
                text = nombre.ifBlank { "Nombre del Staff" },
                color = Color.White,
                fontSize = 22.sp,
                lineHeight = 24.sp,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth()
            )

            Text(
                text = correo.ifBlank { "usuario@spartangym.com" },
                color = Color(0xFF9AA1AD),
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(22.dp))

            CredencialBloqueDestacado(
                titulo = bloqueTitulo,
                valor = bloqueValor.ifBlank { "Sin asignar" },
                apariencia = apariencia
            )

            Spacer(modifier = Modifier.height(14.dp))

            CredencialBloqueSucursal(
                titulo = "Sucursal asignada",
                valor = sucursal.ifBlank { "Spartan Gym, Centro de Mando" },
                apariencia = apariencia
            )

            val detallesVisibles = detalles.distinctBy { it.first.lowercase() }
            if (detallesVisibles.isNotEmpty()) {
                Spacer(modifier = Modifier.height(14.dp))
                CredencialDatosRegistrados(detallesVisibles, apariencia)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Outlined.VerifiedUser,
                    contentDescription = null,
                    tint = apariencia.textMuted,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(7.dp))
                Text(
                    text = permisos.ifBlank { "Sin permisos asignados" }.uppercase(),
                    color = apariencia.textMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Icon(
                    imageVector = Icons.Outlined.MoreHoriz,
                    contentDescription = null,
                    tint = apariencia.accent,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}

@Composable
private fun CredencialDatosRegistrados(
    detalles: List<Pair<String, String>>,
    apariencia: CredencialApariencia
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF050505),
        border = BorderStroke(1.dp, Color(0xFF151515))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "DATOS REGISTRADOS",
                color = apariencia.textMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 0.9.sp
            )

            detalles.chunked(2).forEach { fila ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    fila.forEach { (titulo, valor) ->
                        CredencialDetalleMini(
                            titulo = titulo,
                            valor = valor,
                            apariencia = apariencia,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    if (fila.size == 1) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun CredencialDatoPrincipal(
    titulo: String,
    valor: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.height(76.dp),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF1B2A3F),
        border = BorderStroke(1.dp, Color(0xFF29405E))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 11.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = titulo.uppercase(),
                color = Color(0xFFA8B2C2),
                fontSize = 9.sp,
                fontWeight = FontWeight.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = valor,
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Black,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun CredencialDetallesApi(detalles: List<Pair<String, String>>) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        detalles.chunked(2).forEach { fila ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                fila.forEach { (titulo, valor) ->
                    CredencialDetalleMini(
                        titulo = titulo,
                        valor = valor,
                        modifier = Modifier.weight(1f)
                    )
                }

                if (fila.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun CredencialDetalleMini(
    titulo: String,
    valor: String,
    apariencia: CredencialApariencia = CredencialApariencia.defecto(),
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.height(88.dp),
        shape = RoundedCornerShape(14.dp),
        color = Color(0xFF0C0C0C),
        border = BorderStroke(1.dp, Color(0xFF191919))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 13.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = titulo.uppercase(),
                color = apariencia.textMuted,
                fontSize = 10.sp,
                fontWeight = FontWeight.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = valor,
                color = Color.White,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun CredencialBloqueDestacado(
    titulo: String,
    valor: String,
    apariencia: CredencialApariencia = CredencialApariencia.defecto()
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = apariencia.soft,
        border = BorderStroke(1.dp, apariencia.hover.copy(alpha = 0.55f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(44.dp),
                shape = RoundedCornerShape(12.dp),
                color = Color.Black.copy(alpha = 0.25f),
                border = BorderStroke(1.dp, apariencia.accent.copy(alpha = 0.32f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Outlined.WorkOutline,
                        contentDescription = null,
                        tint = apariencia.textStrong,
                        modifier = Modifier.size(21.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(verticalArrangement = Arrangement.Center) {
                Text(
                    text = titulo.uppercase(),
                    color = apariencia.textMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.8.sp
                )
                Text(
                    text = valor,
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun CredencialBloqueSucursal(
    titulo: String,
    valor: String,
    apariencia: CredencialApariencia = CredencialApariencia.defecto()
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF070707),
        border = BorderStroke(1.dp, Color(0xFF171717))
    ) {
        Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 16.dp)) {
            Text(
                text = titulo.uppercase(),
                color = apariencia.textMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 0.8.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Outlined.Business,
                    contentDescription = null,
                    tint = apariencia.accent,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = valor,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun LogoConfiguracion(
    source: String?,
    fallbackTint: Color,
    modifier: Modifier = Modifier
) {
    var imageBitmap by remember(source) { mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null) }

    LaunchedEffect(source) {
        imageBitmap = withContext(Dispatchers.IO) {
            cargarImagenConfiguracion(source)?.asImageBitmap()
        }
    }

    Box(contentAlignment = Alignment.Center) {
        val imagen = imageBitmap
        if (imagen != null) {
            Image(
                bitmap = imagen,
                contentDescription = "Logo configurado",
                contentScale = ContentScale.Fit,
                modifier = modifier.fillMaxWidth()
            )
        } else {
            Icon(
                imageVector = Icons.Outlined.CameraAlt,
                contentDescription = null,
                tint = fallbackTint,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}

internal fun cargarImagenConfiguracion(source: String?): android.graphics.Bitmap? {
    val value = source?.trim()?.takeIf { it.isNotBlank() } ?: return null
    return try {
        val bytes = when {
            value.startsWith("data:", ignoreCase = true) -> {
                val base64 = value.substringAfter(",", missingDelimiterValue = "")
                if (base64.isBlank()) null else Base64.decode(base64, Base64.DEFAULT)
            }

            value.startsWith("http://", ignoreCase = true) ||
                value.startsWith("https://", ignoreCase = true) -> URL(value).openStream().use { it.readBytes() }

            value.length > 80 && !value.contains("/") -> Base64.decode(value, Base64.DEFAULT)
            else -> null
        } ?: return null

        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    } catch (_: Exception) {
        null
    }
}

private data class CredencialApariencia(
    val accent: Color,
    val hover: Color,
    val soft: Color,
    val textMuted: Color,
    val textStrong: Color
) {
    companion object {
        fun defecto() = CredencialApariencia(
            accent = Color(0xFFE10613),
            hover = Color(0xFFB91C1C),
            soft = Color(0xFF1B2A3F),
            textMuted = Color(0xFF9AA1AD),
            textStrong = Color.White
        )

        fun desde(appConfig: AppConfigResponse): CredencialApariencia {
            val accent = colorDesdeHex(appConfig.accentColor, Color(0xFFE10613))
            val hover = colorDesdeHex(appConfig.accentHoverColor, oscurecer(accent, 0.2f))
            val soft = colorDesdeHex(appConfig.accentSoftColor, oscurecer(accent, 0.62f))

            return CredencialApariencia(
                accent = accent,
                hover = hover,
                soft = soft,
                textMuted = Color(0xFFAAB3C2),
                textStrong = Color.White
            )
        }
    }
}

private fun colorDesdeHex(hex: String?, fallback: Color): Color {
    val clean = hex?.trim()?.removePrefix("#") ?: return fallback
    if (!clean.matches(Regex("[0-9a-fA-F]{6}"))) return fallback
    return try {
        Color(("ff$clean").toLong(16))
    } catch (_: Exception) {
        fallback
    }
}

private fun oscurecer(color: Color, pesoNegro: Float): Color {
    val base = 1f - pesoNegro.coerceIn(0f, 1f)
    return Color(
        red = color.red * base,
        green = color.green * base,
        blue = color.blue * base,
        alpha = 1f
    )
}

internal fun sucursalPrincipalTexto(appConfig: AppConfigResponse): String {
    val nombre = appConfig.gymName?.trim().orEmpty()
    return when {
        nombre.isBlank() -> "Spartan Gym, Centro de Mando"
        nombre.contains(",") -> nombre
        else -> "$nombre, Centro de Mando"
    }
}

internal fun detalleCredencial(titulo: String, valor: String?): Pair<String, String>? {
    val limpio = valor?.trim().orEmpty()
    if (limpio.isBlank()) return null
    val normalizado = limpio.lowercase()
    if (normalizado.startsWith("sin ") || normalizado == "null") return null
    return titulo to limpio
}

internal fun rolLegible(rol: String?): String {
    val limpio = rol?.trim().orEmpty()
        .removePrefix("ROLE_")
        .replace("_", " ")
        .lowercase()
    return limpio.split(" ")
        .filter { it.isNotBlank() }
        .joinToString(" ") { palabra ->
            palabra.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
        .ifBlank { "Sin asignar" }
}
