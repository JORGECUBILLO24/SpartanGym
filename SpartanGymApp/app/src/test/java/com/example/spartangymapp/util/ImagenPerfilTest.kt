package com.example.spartangymapp.util

import org.junit.Assert.assertEquals
import org.junit.Test

class ImagenPerfilTest {

    @Test
    fun `imagen mas ancha que alta se limita a 512 en el lado mayor`() {
        val (ancho, alto) = calcularDimensionesEscaladas(1024, 512)
        assertEquals(512, ancho)
        assertEquals(256, alto)
    }

    @Test
    fun `imagen mas alta que ancha se limita a 512 en el lado mayor`() {
        val (ancho, alto) = calcularDimensionesEscaladas(600, 1200)
        assertEquals(256, ancho)
        assertEquals(512, alto)
    }

    @Test
    fun `imagen ya menor a 512 no se agranda`() {
        val (ancho, alto) = calcularDimensionesEscaladas(300, 200)
        assertEquals(300, ancho)
        assertEquals(200, alto)
    }

    @Test
    fun `imagen cuadrada mayor a 512 se escala a 512x512`() {
        val (ancho, alto) = calcularDimensionesEscaladas(1000, 1000)
        assertEquals(512, ancho)
        assertEquals(512, alto)
    }
}
