package com.example.spartangymapp.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.spartangymapp.network.LoginRequest
import com.example.spartangymapp.network.PasswordRecoveryRequest
import com.example.spartangymapp.network.RetrofitClient
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {

    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)
    var loginSuccess by mutableStateOf(false)
    var recoveryMessage by mutableStateOf<String?>(null)

    var userRole by mutableStateOf("")
    var userEmail by mutableStateOf("")
    var userId by mutableStateOf("")

    fun iniciarSesion(email: String, pass: String) {
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
                    userRole = authResponse.rol.orEmpty()
                    userId = authResponse.id.orEmpty()
                    RetrofitClient.setAuthToken(authResponse.token)

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

    fun solicitarRecuperacion(email: String) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            recoveryMessage = null

            try {
                val response = RetrofitClient.apiService.solicitarRestablecimiento(
                    PasswordRecoveryRequest(email = email.trim())
                )

                if (response.isSuccessful) {
                    recoveryMessage = "Hemos enviado un correo de recuperacion."
                } else {
                    errorMessage = "No se pudo solicitar la recuperacion."
                }
            } catch (e: Exception) {
                errorMessage = "No se pudo conectar con la API: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }

    fun limpiarEstado() {
        loginSuccess = false
        errorMessage = null
        recoveryMessage = null
    }
}
