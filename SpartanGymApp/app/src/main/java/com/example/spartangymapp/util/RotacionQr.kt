package com.example.spartangymapp.util

/**
 * Buffer de luminancia (plano Y) con sus dimensiones asociadas.
 */
data class FrameLuminancia(
    val datos: ByteArray,
    val ancho: Int,
    val alto: Int
)

/**
 * Rota un buffer de luminancia (plano Y, un byte por pixel) el numero de grados
 * indicado en sentido horario. `rotacionGrados` es el valor que reporta CameraX
 * en `imageProxy.imageInfo.rotationDegrees` (0, 90, 180 o 270): la rotacion
 * horaria necesaria para que el frame quede en la orientacion "de pie" que ve
 * el usuario. Sin esta correccion, ZXing recibe el frame crudo del sensor
 * (normalmente apaisado) y falla en la mayoria de orientaciones normales de uso.
 *
 * Funcion pura, sin dependencias de Android/CameraX, para poder testearla sin
 * hardware de camara real.
 */
fun rotarLuminancia(datos: ByteArray, ancho: Int, alto: Int, rotacionGrados: Int): FrameLuminancia {
    return when (((rotacionGrados % 360) + 360) % 360) {
        90 -> rotar90Horario(datos, ancho, alto)
        180 -> rotar180(datos, ancho, alto)
        270 -> rotar270Horario(datos, ancho, alto)
        else -> FrameLuminancia(datos, ancho, alto)
    }
}

private fun rotar90Horario(datos: ByteArray, ancho: Int, alto: Int): FrameLuminancia {
    val salida = ByteArray(datos.size)
    for (filaDestino in 0 until ancho) {
        for (colDestino in 0 until alto) {
            val filaOrigen = alto - 1 - colDestino
            val colOrigen = filaDestino
            salida[filaDestino * alto + colDestino] = datos[filaOrigen * ancho + colOrigen]
        }
    }
    return FrameLuminancia(salida, alto, ancho)
}

private fun rotar180(datos: ByteArray, ancho: Int, alto: Int): FrameLuminancia {
    val salida = ByteArray(datos.size)
    val total = ancho * alto
    for (i in 0 until total) {
        salida[total - 1 - i] = datos[i]
    }
    return FrameLuminancia(salida, ancho, alto)
}

private fun rotar270Horario(datos: ByteArray, ancho: Int, alto: Int): FrameLuminancia {
    val salida = ByteArray(datos.size)
    for (filaDestino in 0 until ancho) {
        for (colDestino in 0 until alto) {
            val filaOrigen = colDestino
            val colOrigen = ancho - 1 - filaDestino
            salida[filaDestino * alto + colDestino] = datos[filaOrigen * ancho + colOrigen]
        }
    }
    return FrameLuminancia(salida, alto, ancho)
}
