package com.example.spartangymapp.ui.screen

import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.spartangymapp.R
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun movimientoReducido(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        runCatching { Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f }.getOrDefault(false)
    }
}

/** The image moves behind a clipped surface while the text stays attached to the card. */
@Composable
internal fun PortadaMovil(
    imagen: String?,
    modifier: Modifier = Modifier,
    fallbackResource: Int = R.drawable.fondo_login,
    mostrarImagenFallback: Boolean = true,
    desplazamiento: () -> Float = { 0f },
    content: @Composable BoxScope.() -> Unit
) {
    val reducir = movimientoReducido()
    val acento = MaterialTheme.colorScheme.primary
    Box(modifier.clip(RoundedCornerShape(28.dp)).background(Brush.linearGradient(listOf(Color(0xFF321316), Color(0xFF1B1B20), Color(0xFF0C0C0F))))) {
        if (!imagen.isNullOrBlank() || mostrarImagenFallback) {
            ImagenMarca(
                source = imagen,
                fallbackResource = fallbackResource,
                contentDescription = null,
                modifier = Modifier.matchParentSize().graphicsLayer {
                    scaleX = 1.16f
                    scaleY = 1.16f
                    translationY = if (reducir) 0f else (desplazamiento() * 0.18f).coerceIn(-36.dp.toPx(), 36.dp.toPx())
                }
            )
        }
        Box(Modifier.matchParentSize().background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = 0.06f), Color.Black.copy(alpha = 0.28f), Color(0xF20D0D12)))))
        Box(Modifier.matchParentSize().background(Brush.horizontalGradient(listOf(acento.copy(alpha = 0.12f), Color.Transparent))))
        content()
    }
}

internal fun fechaMovil(valor: String?): String = runCatching {
    LocalDate.parse(valor.orEmpty().take(10)).format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.forLanguageTag("es")))
}.getOrElse { "Sin fecha" }
