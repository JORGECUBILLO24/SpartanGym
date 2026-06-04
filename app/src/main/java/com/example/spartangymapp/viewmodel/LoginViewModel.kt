package com.example.spartangymapp.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.spartangymapp.network.LoginRequest
import com.example.spartangymapp.network.RetrofitClient
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {
    // Variables de estado que la pantalla va a "escuchar"
    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)
    var loginSuccess by mutableStateOf(false)
    var userRole by mutableStateOf("")

    fun iniciarSesion(email: String, pass: String) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null

            try {
                // Llamamos a la API (tu Spring Boot)
                val response = RetrofitClient.apiService.login(LoginRequest(email, pass))

                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    userRole = authResponse.rol
                    // Aquí en el futuro guardaremos el Token
                    loginSuccess = true
                } else {
                    errorMessage = "Credenciales incorrectas"
                }
            } catch (e: Exception) {
                errorMessage = "Error: ${e.message}"
            } finally {
                isLoading = false
            }
        }
    }
}