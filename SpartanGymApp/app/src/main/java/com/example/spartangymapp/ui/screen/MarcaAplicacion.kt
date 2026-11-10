package com.example.spartangymapp.ui.screen

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.spartangymapp.R
import com.example.spartangymapp.network.AppConfigResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
internal fun ImagenMarca(
    source: String?,
    fallbackResource: Int?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop
) {
    var bitmap by remember(source) { mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null) }

    LaunchedEffect(source) {
        bitmap = withContext(Dispatchers.IO) {
            cargarImagenConfiguracion(source)?.asImageBitmap()
        }
    }

    when {
        bitmap != null -> Image(
            bitmap = bitmap!!,
            contentDescription = contentDescription,
            contentScale = contentScale,
            modifier = modifier
        )
        fallbackResource != null -> Image(
            painter = painterResource(fallbackResource),
            contentDescription = contentDescription,
            contentScale = contentScale,
            modifier = modifier
        )
    }
}

@Composable
internal fun MarcaAplicacion(
    appConfig: AppConfigResponse,
    modifier: Modifier = Modifier,
    contentDescription: String = appConfig.nombreVisibleApp(),
    alturaLogo: androidx.compose.ui.unit.Dp = 72.dp,
    mostrarNombre: Boolean = false
) {
    val nombre = appConfig.nombreVisibleApp()
    val nombreGym = appConfig.gymName?.trim()?.takeIf { it.isNotEmpty() } ?: "Spartan Gym"
    val nombreAppAlineado = appConfig.appName.isNullOrBlank() || appConfig.appName.trim().equals(nombreGym, ignoreCase = true)
    val source = appConfig.logoAppActual() ?: if (nombreAppAlineado) {
        appConfig.logoAccesoActual() ?: appConfig.logoPrincipalActual()
    } else null
    var bitmap by remember(source) { mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null) }

    LaunchedEffect(source) {
        bitmap = withContext(Dispatchers.IO) {
            cargarImagenConfiguracion(source)?.asImageBitmap()
        }
    }

    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        when {
            bitmap != null -> Image(
                bitmap = bitmap!!,
                contentDescription = contentDescription,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxWidth().height(alturaLogo)
            )
            else -> Image(
                painter = painterResource(R.drawable.logo_marca_sistema),
                contentDescription = contentDescription,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxWidth().height(alturaLogo)
            )
        }

        if (mostrarNombre) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = nombre,
                color = Color(0xFFD1D1D6),
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
