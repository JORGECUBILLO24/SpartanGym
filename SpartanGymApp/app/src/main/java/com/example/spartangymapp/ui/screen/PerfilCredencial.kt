package com.example.spartangymapp.ui.screen

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.interaction.MutableInteractionSource
import com.example.spartangymapp.ui.components.applePressScale
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
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
    onCambiarFoto: (() -> Unit)? = null,
    subiendoFoto: Boolean = false,
    fotoUrl: String? = null,
    appConfig: AppConfigResponse = AppConfigResponse(),
    modifier: Modifier = Modifier.fillMaxWidth()
) {
    if (integradaPantalla) {
        CredencialPantallaIntegrada(
            onCambiarFoto = onCambiarFoto,
            subiendoFoto = subiendoFoto,            nombre = nombre,
            correo = correo,
            bloqueTitulo = bloqueTitulo,
            bloqueValor = bloqueValor,
            sucursal = sucursal,
            permisos = permisos,
            detalles = detalles,
            fotoUrl = fotoUrl,
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
                            FotoPerfilCredencial(
                                fotoUrl = fotoUrl,
                                modifier = Modifier.fillMaxSize()
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.CameraAlt,
                                    contentDescription = null,
                                    tint = Color(0xFF7E8796),
                                    modifier = Modifier.size(27.dp)
                                )
                            }
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
                        valor = sucursal.ifBlank { sucursalPrincipalTexto(appConfig) }
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
    fotoUrl: String? = null,
    appConfig: AppConfigResponse,
    onCambiarFoto: (() -> Unit)? = null,
    subiendoFoto: Boolean = false,
    modifier: Modifier = Modifier
) {
    val apariencia = remember(appConfig) { CredencialApariencia.desde(appConfig) }
    val press = remember { MutableInteractionSource() }
    val filas = detalles.distinctBy { it.first.lowercase() }
    val vencimiento = filas.firstOrNull { it.first.equals("Vencimiento", true) }?.second
    Column(modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        PortadaMovil(appConfig.fondoLogin, Modifier.fillMaxWidth().height(224.dp)) {
            Column(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.SpaceBetween) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text("Mi perfil", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                    Surface(shape = RoundedCornerShape(50), color = Color.Black.copy(alpha = 0.56f)) {
                        Text(permisos.ifBlank { "Cuenta" }, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp), maxLines = 1)
                    }
                }
                Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(
                        Modifier.size(108.dp).applePressScale(press)
                            .then(if (onCambiarFoto != null) Modifier.clickable(enabled = !subiendoFoto, interactionSource = press, indication = null, role = Role.Button, onClickLabel = "Cambiar foto de perfil", onClick = onCambiarFoto) else Modifier),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(Modifier.size(100.dp), shape = CircleShape, color = Color(0xFF303038), border = BorderStroke(3.dp, Color.White.copy(alpha = 0.88f))) {
                            FotoPerfilCredencial(fotoUrl, Modifier.fillMaxSize()) {
                                Text(nombre.trim().split(" ").filter { it.isNotBlank() }.take(2).joinToString("") { it.take(1) }.uppercase(), color = Color.White, fontSize = 27.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                        if (onCambiarFoto != null) Surface(Modifier.align(Alignment.BottomEnd).size(30.dp), shape = CircleShape, color = apariencia.accent, border = BorderStroke(2.dp, Color(0xFF0A0A0C))) {
                            Box(contentAlignment = Alignment.Center) {
                                if (subiendoFoto) CircularProgressIndicator(Modifier.size(15.dp), color = Color.White, strokeWidth = 2.dp)
                                else Icon(Icons.Outlined.CameraAlt, "Cambiar foto", Modifier.size(16.dp), tint = Color.White)
                            }
                        }
                    }
                    Column(Modifier.weight(1f).padding(bottom = 6.dp)) {
                        Text(nombre.ifBlank { "Mi perfil" }, color = Color.White, fontSize = 21.sp, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Text(correo.ifBlank { "Sin correo registrado" }, color = Color(0xFFE0E0E4), fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            CredencialDatoPrincipal(bloqueTitulo.replace("asignada", "").trim(), bloqueValor.ifBlank { "Sin asignar" }, Modifier.weight(1f))
            CredencialDatoPrincipal(if (vencimiento != null) "Vencimiento" else "Sucursal", if (vencimiento != null) fechaMovil(vencimiento) else sucursal.ifBlank { "Sin asignar" }, Modifier.weight(1f))
        }
        Text("Tu información", color = Color(0xFFAEAEB8), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 4.dp, top = 2.dp))
        Surface(shape = RoundedCornerShape(20.dp), color = Color(0xFF1B1B20), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(horizontal = 16.dp)) {
                val otrasFilas = listOf("Sucursal" to sucursal) + filas.filterNot { it.first.equals("Vencimiento", true) || it.first.equals("Sucursal", true) || it.first.equals("Estado", true) }
                otrasFilas.forEachIndexed { i, (titulo, valor) ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(titulo, color = Color(0xFFAEAEB8), fontSize = 13.sp, modifier = Modifier.weight(0.42f))
                        Text(valor.ifBlank { "Sin asignar" }, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.End, modifier = Modifier.weight(0.58f), maxLines = 2, overflow = TextOverflow.Ellipsis)
                    }
                    if (i < otrasFilas.lastIndex) HorizontalDivider(color = Color.White.copy(alpha = 0.07f))
                }
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
            modifier = Modifier.padding(11.dp),
            verticalArrangement = Arrangement.spacedBy(7.dp)
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
        color = Color(0xFF1B1B20),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f))
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
        modifier = modifier.height(62.dp),
        shape = RoundedCornerShape(12.dp),
        color = Color(0xFF0C0C0C),
        border = BorderStroke(1.dp, Color(0xFF191919))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = titulo.uppercase(),
                color = apariencia.textMuted,
                fontSize = 9.sp,
                fontWeight = FontWeight.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(3.dp))
            Text(
                text = valor,
                color = Color.White,
                fontSize = 13.sp,
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
            modifier = Modifier.padding(horizontal = 11.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(34.dp),
                shape = RoundedCornerShape(12.dp),
                color = Color.Black.copy(alpha = 0.25f),
                border = BorderStroke(1.dp, apariencia.accent.copy(alpha = 0.32f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Outlined.WorkOutline,
                        contentDescription = null,
                        tint = apariencia.textStrong,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(9.dp))

            Column(verticalArrangement = Arrangement.Center) {
                Text(
                    text = titulo.uppercase(),
                    color = apariencia.textMuted,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.8.sp
                )
                Text(
                    text = valor,
                    color = Color.White,
                    fontSize = 13.sp,
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
        Column(modifier = Modifier.padding(horizontal = 11.dp, vertical = 9.dp)) {
            Text(
                text = titulo.uppercase(),
                color = apariencia.textMuted,
                fontSize = 9.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 0.8.sp
            )

            Spacer(modifier = Modifier.height(5.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Outlined.Business,
                    contentDescription = null,
                    tint = apariencia.accent,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = valor,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Black,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
internal fun FotoPerfilCredencial(
    fotoUrl: String?,
    modifier: Modifier = Modifier,
    respaldo: @Composable () -> Unit
) {
    val fuente = fotoUrl?.trim()?.takeIf { it.isNotBlank() }
    var imageBitmap by remember(fuente) {
        mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null)
    }

    LaunchedEffect(fuente) {
        imageBitmap = if (fuente == null) {
            null
        } else {
            withContext(Dispatchers.IO) { cargarImagenConfiguracion(fuente)?.asImageBitmap() }
        }
    }

    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        val imagen = imageBitmap
        if (imagen != null) {
            Image(
                bitmap = imagen,
                contentDescription = "Foto de perfil",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            respaldo()
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
    val nombre = appConfig.nombreVisibleApp()
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
