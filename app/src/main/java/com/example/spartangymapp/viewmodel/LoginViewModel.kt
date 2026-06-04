package com.example.spartangymapp.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.spartangymapp.network.LoginRequest
import com.example.spartangymapp.network.RegisterRequest
import com.example.spartangymapp.network.RetrofitClient
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {

    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)
    var loginSuccess by mutableStateOf(false)
    var registerSuccess by mutableStateOf(false)

    var userRole by mutableStateOf("")
    var userEmail by mutableStateOf("")

    fun iniciarSesion(email: String, pass: String, rolSeleccionado: String) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            loginSuccess = false

            try {
                val response = RetrofitClient.apiService.login(
                    LoginRequest(
                        email = email.trim(),
                        password = pass
                    )
                )

                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!

                    userEmail = authResponse.email ?: email.trim()
                    userRole = authResponse.rol ?: rolSeleccionado

                    loginSuccess = true
                } else {
                    errorMessage = "Credenciales incorrectas."
                }
            } catch (e: Exception) {
                errorMessage = "No se pudo conectar con la API: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    fun crearCuenta(
        nombre: String,
        email: String,
        password: String,
        rolSeleccionado: String
    ) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            registerSuccess = false

            try {
                val request = RegisterRequest(
                    nombreCompleto = nombre.trim(),
                    email = email.trim(),
                    password = password,
                    rol = rolSeleccionado
                )

                val response = if (rolSeleccionado.contains("ENTRENADOR", ignoreCase = true)) {
                    RetrofitClient.apiService.registrarEntrenador(request)
                } else {
                    RetrofitClient.apiService.registrarSocio(request)
                }

                if (response.isSuccessful) {
                    registerSuccess = true
                    errorMessage = "Cuenta creada correctamente. Ahora inicia sesión."
                } else {
                    errorMessage = "No se pudo crear la cuenta. Revisa los datos."
                }
            } catch (e: Exception) {
                errorMessage = "Error al crear cuenta: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    fun limpiarEstado() {
        loginSuccess = false
        registerSuccess = false
        errorMessage = null
    }
}