package com.example.spartangymapp.network

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ErroresApiTest {

    @Test
    fun problemJson_devuelveElDetail() {
        val cuerpo = """{"status":409,"detail":"QR ya utilizado.","codigo":"CONFLICTO"}"""
        assertEquals("QR ya utilizado.", mensajeDeError(cuerpo))
    }

    @Test
    fun textoPlano_seDevuelveTalCual() {
        // Así responde la API vieja, o cualquier error que no venga en formato nuevo.
        assertEquals("Socio no encontrado", mensajeDeError("Socio no encontrado"))
    }

    @Test
    fun vacioONulo_devuelveNullParaUsarElMensajePorDefecto() {
        assertNull(mensajeDeError(null))
        assertNull(mensajeDeError("   "))
    }

    @Test
    fun jsonSinDetail_devuelveElTextoCompleto() {
        assertEquals("""{"otro":1}""", mensajeDeError("""{"otro":1}"""))
    }

    @Test
    fun jsonRoto_devuelveElTextoCompleto() {
        assertEquals("{no es json", mensajeDeError("{no es json"))
    }
}
