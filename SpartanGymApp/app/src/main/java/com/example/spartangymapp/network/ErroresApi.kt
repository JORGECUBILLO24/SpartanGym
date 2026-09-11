package com.example.spartangymapp.network

import com.google.gson.Gson
import com.google.gson.JsonObject

/** Pide a la API el formato de error RFC 9457. Sin este header la API responde texto plano. */
const val ACCEPT_ERRORES = "application/problem+json, application/json;q=0.9, */*;q=0.8"

/**
 * Mensaje para mostrarle al usuario a partir del cuerpo de un error de la API.
 * Si es RFC 9457 devuelve `detail`; si es texto plano (API vieja), el texto tal cual;
 * si está vacío, null, para que la pantalla use su mensaje por defecto con el código.
 */
fun mensajeDeError(cuerpo: String?): String? {
    val texto = cuerpo?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    if (!texto.startsWith("{")) return texto
    // Gson().fromJson y no JsonParser.parseString: este último no existe en la Gson 2.8.5
    // que trae converter-gson 2.9.0.
    val detalle: String? = runCatching {
        val json: JsonObject = Gson().fromJson(texto, JsonObject::class.java)
        val valor = json.get("detail")
        if (valor == null || valor.isJsonNull) null else valor.asString
    }.getOrNull()
    return detalle?.takeIf { it.isNotBlank() } ?: texto
}
