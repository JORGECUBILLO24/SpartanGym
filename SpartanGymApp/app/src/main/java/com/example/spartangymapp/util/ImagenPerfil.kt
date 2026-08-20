package com.example.spartangymapp.util

import android.graphics.Bitmap
import android.util.Base64
import java.io.ByteArrayOutputStream

/**
 * Calcula (ancho, alto) escalados para que el lado mayor no supere `ladoMaximo`,
 * manteniendo la proporción. No agranda imágenes ya menores. Función pura, sin
 * dependencias de Android, para poder testearla sin dispositivo (mismo criterio
 * que RotacionQr/RotacionQrTest).
 */
fun calcularDimensionesEscaladas(
    anchoOriginal: Int,
    altoOriginal: Int,
    ladoMaximo: Int = 512
): Pair<Int, Int> {
    if (anchoOriginal <= 0 || altoOriginal <= 0) return Pair(1, 1)
    val ladoMayor = maxOf(anchoOriginal, altoOriginal)
    if (ladoMayor <= ladoMaximo) return Pair(anchoOriginal, altoOriginal)
    val escala = ladoMaximo.toDouble() / ladoMayor
    val ancho = maxOf(1, Math.round(anchoOriginal * escala).toInt())
    val alto = maxOf(1, Math.round(altoOriginal * escala).toInt())
    return Pair(ancho, alto)
}

/**
 * Comprime un bitmap a webp base64 (data URL) listo para PUT /operacion/me/foto.
 * Usa la constante WEBP (deprecada desde API 30 pero no eliminada) y NO WEBP_LOSSY
 * (API 30+), porque minSdk = 24.
 */
fun comprimirParaPerfil(bitmap: Bitmap): String {
    val (ancho, alto) = calcularDimensionesEscaladas(bitmap.width, bitmap.height)
    val escalado = Bitmap.createScaledBitmap(bitmap, ancho, alto, true)
    val salida = ByteArrayOutputStream()
    @Suppress("DEPRECATION")
    escalado.compress(Bitmap.CompressFormat.WEBP, 80, salida)
    val base64 = Base64.encodeToString(salida.toByteArray(), Base64.NO_WRAP)
    return "data:image/webp;base64,$base64"
}
