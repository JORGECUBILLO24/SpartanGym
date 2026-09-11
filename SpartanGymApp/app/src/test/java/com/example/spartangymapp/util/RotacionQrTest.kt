package com.example.spartangymapp.util

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Buffer de prueba de 3x2 (ancho=3, alto=2):
 *   fila 0: 1 2 3
 *   fila 1: 4 5 6
 */
private val ANCHO_ORIGINAL = 3
private val ALTO_ORIGINAL = 2
private val BUFFER_ORIGINAL = byteArrayOf(1, 2, 3, 4, 5, 6)

class RotacionQrTest {

    @Test
    fun `rotacion 0 grados devuelve el buffer sin cambios`() {
        val resultado = rotarLuminancia(BUFFER_ORIGINAL, ANCHO_ORIGINAL, ALTO_ORIGINAL, 0)

        assertEquals(ANCHO_ORIGINAL, resultado.ancho)
        assertEquals(ALTO_ORIGINAL, resultado.alto)
        assertArrayEquals(byteArrayOf(1, 2, 3, 4, 5, 6), resultado.datos)
    }

    @Test
    fun `rotacion 90 grados horario rota e intercambia ancho y alto`() {
        val resultado = rotarLuminancia(BUFFER_ORIGINAL, ANCHO_ORIGINAL, ALTO_ORIGINAL, 90)

        // Dimensiones intercambiadas: la imagen apaisada (3x2) pasa a vertical (2x3)
        assertEquals(ALTO_ORIGINAL, resultado.ancho)
        assertEquals(ANCHO_ORIGINAL, resultado.alto)
        // fila0: 4 1 | fila1: 5 2 | fila2: 6 3
        assertArrayEquals(byteArrayOf(4, 1, 5, 2, 6, 3), resultado.datos)
    }

    @Test
    fun `rotacion 180 grados invierte el buffer manteniendo dimensiones`() {
        val resultado = rotarLuminancia(BUFFER_ORIGINAL, ANCHO_ORIGINAL, ALTO_ORIGINAL, 180)

        assertEquals(ANCHO_ORIGINAL, resultado.ancho)
        assertEquals(ALTO_ORIGINAL, resultado.alto)
        assertArrayEquals(byteArrayOf(6, 5, 4, 3, 2, 1), resultado.datos)
    }

    @Test
    fun `rotacion 270 grados horario rota e intercambia ancho y alto en sentido opuesto a 90`() {
        val resultado = rotarLuminancia(BUFFER_ORIGINAL, ANCHO_ORIGINAL, ALTO_ORIGINAL, 270)

        assertEquals(ALTO_ORIGINAL, resultado.ancho)
        assertEquals(ANCHO_ORIGINAL, resultado.alto)
        // fila0: 3 6 | fila1: 2 5 | fila2: 1 4
        assertArrayEquals(byteArrayOf(3, 6, 2, 5, 1, 4), resultado.datos)
    }

    @Test
    fun `rotaciones fuera de rango 0 a 360 se normalizan (ej 450 equivale a 90, -90 equivale a 270)`() {
        val resultado450 = rotarLuminancia(BUFFER_ORIGINAL, ANCHO_ORIGINAL, ALTO_ORIGINAL, 450)
        val resultado90 = rotarLuminancia(BUFFER_ORIGINAL, ANCHO_ORIGINAL, ALTO_ORIGINAL, 90)
        assertArrayEquals(resultado90.datos, resultado450.datos)

        val resultadoNegativo90 = rotarLuminancia(BUFFER_ORIGINAL, ANCHO_ORIGINAL, ALTO_ORIGINAL, -90)
        val resultado270 = rotarLuminancia(BUFFER_ORIGINAL, ANCHO_ORIGINAL, ALTO_ORIGINAL, 270)
        assertArrayEquals(resultado270.datos, resultadoNegativo90.datos)
    }
}
