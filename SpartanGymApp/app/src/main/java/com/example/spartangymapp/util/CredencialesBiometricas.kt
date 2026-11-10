package com.example.spartangymapp.util

import android.content.Context
import android.os.Build
import android.util.Base64
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties

data class CredencialesBiometricas(val correo: String, val contrasena: String)

object CredencialesBiometricasStore {
    private const val PREFERENCIAS = "acceso_biometrico"
    private const val ALIAS = "spartangym_biometric_credentials"
    private const val CLAVE_CIFRADO = "credentials_ciphertext"
    private const val CLAVE_IV = "credentials_iv"
    private const val CLAVE_CORREO_HASH = "credentials_email_hash"

    fun disponibles(context: Context): Boolean = preferencias(context).contains(CLAVE_CIFRADO)

    fun correspondenA(context: Context, correo: String): Boolean {
        val hashGuardado = preferencias(context).getString(CLAVE_CORREO_HASH, null) ?: return false
        return hashGuardado == hashCorreo(correo)
    }

    fun prepararCifrado(): Cipher {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, obtenerOCrearClave())
        return cipher
    }

    fun prepararDescifrado(context: Context): Cipher {
        val preferencias = preferencias(context)
        val iv = preferencias.getString(CLAVE_IV, null)
            ?.let { Base64.decode(it, Base64.NO_WRAP) }
            ?: throw IllegalStateException("No hay una clave biométrica guardada.")
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, obtenerClave(), GCMParameterSpec(128, iv))
        return cipher
    }

    fun guardar(context: Context, cipher: Cipher, correo: String, contrasena: String) {
        val contenido = JSONObject()
            .put("email", correo.trim())
            .put("password", contrasena)
            .toString()
            .toByteArray(StandardCharsets.UTF_8)
        val cifrado = cipher.doFinal(contenido)
        preferencias(context).edit()
            .putString(CLAVE_CIFRADO, Base64.encodeToString(cifrado, Base64.NO_WRAP))
            .putString(CLAVE_IV, Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
            .putString(CLAVE_CORREO_HASH, hashCorreo(correo))
            .apply()
    }

    fun leer(context: Context, cipher: Cipher): CredencialesBiometricas {
        val contenidoCifrado = preferencias(context).getString(CLAVE_CIFRADO, null)
            ?.let { Base64.decode(it, Base64.NO_WRAP) }
            ?: throw IllegalStateException("No hay un acceso biométrico configurado.")
        val json = JSONObject(String(cipher.doFinal(contenidoCifrado), StandardCharsets.UTF_8))
        return CredencialesBiometricas(
            correo = json.getString("email"),
            contrasena = json.getString("password")
        )
    }

    fun borrar(context: Context) {
        preferencias(context).edit().clear().apply()
        runCatching {
            KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.deleteEntry(ALIAS)
        }
    }

    private fun obtenerOCrearClave(): SecretKey {
        val existente = runCatching { obtenerClave() }.getOrNull()
        if (existente != null) return existente

        val generador = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        val builder = KeyGenParameterSpec.Builder(
                ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setUserAuthenticationRequired(true)
                .setInvalidatedByBiometricEnrollment(true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
        } else {
            @Suppress("DEPRECATION")
            builder.setUserAuthenticationValidityDurationSeconds(-1)
        }
        generador.init(builder.build())
        return generador.generateKey()
    }

    private fun obtenerClave(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        return keyStore.getKey(ALIAS, null) as? SecretKey
            ?: throw IllegalStateException("No hay una clave biométrica configurada.")
    }

    private fun preferencias(context: Context) = context.getSharedPreferences(PREFERENCIAS, Context.MODE_PRIVATE)

    private fun hashCorreo(correo: String): String = MessageDigest.getInstance("SHA-256")
        .digest(correo.trim().lowercase().toByteArray(StandardCharsets.UTF_8))
        .joinToString("") { byte -> "%02x".format(byte) }
}
