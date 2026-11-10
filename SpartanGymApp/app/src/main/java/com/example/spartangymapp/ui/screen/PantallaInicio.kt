package com.example.spartangymapp.ui.screen

import android.widget.Toast
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.spartangymapp.R
import com.example.spartangymapp.ui.components.applePressScale
import com.example.spartangymapp.util.CredencialesBiometricasStore
import com.example.spartangymapp.network.AppConfigResponse
import com.example.spartangymapp.viewmodel.LoginViewModel
import javax.crypto.Cipher

private enum class AccionHuella { NINGUNA, INICIAR_SESION, GUARDAR_CREDENCIALES }

@Composable
fun PantallaInicio(
    appConfig: AppConfigResponse = AppConfigResponse(),
    onLoginSuccess: (String, String, String) -> Unit,
    loginViewModel: LoginViewModel = viewModel()
) {
    val context = LocalContext.current
    val scrollLogin = rememberScrollState()
    val reducirMovimiento = movimientoReducido()

    var correo by remember { mutableStateOf("") }
    var contrasena by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var mostrarRecuperacion by remember { mutableStateOf(false) }
    var correoRecuperacion by remember { mutableStateOf("") }
    var mostrarDialogoHuella by remember { mutableStateOf(false) }
    var accionHuella by remember { mutableStateOf(AccionHuella.NINGUNA) }
    var loginPorHuella by remember { mutableStateOf(false) }
    var huellaConfigurada by remember { mutableStateOf(CredencialesBiometricasStore.disponibles(context)) }

    val spartanRed = MaterialTheme.colorScheme.primary
    val darkCardBg = Color(0xED1B1B22)
    val fieldBackground = Color(0xFF222226)
    val fieldBorder = Color(0xFF3A3A3F)
    val textLabel = Color(0xFFE0E0E0)
    val textPlaceholder = Color(0xFFA6A6A6)
    val actividad = context as? FragmentActivity
    val huellaDisponible = remember(context) {
        context.packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_FINGERPRINT) &&
                BiometricManager.from(context).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) ==
                BiometricManager.BIOMETRIC_SUCCESS
    }
    val loginInteractionSource = remember { MutableInteractionSource() }
    val huellaInteractionSource = remember { MutableInteractionSource() }

    fun completarAcceso() {
        mostrarDialogoHuella = false
        Toast.makeText(context, "Bienvenido", Toast.LENGTH_SHORT).show()
        onLoginSuccess(
            loginViewModel.userEmail.ifBlank { correo },
            loginViewModel.userRole,
            loginViewModel.userId
        )
        loginPorHuella = false
        loginViewModel.limpiarEstado()
    }

    fun mostrarPromptHuella(cipher: Cipher, titulo: String, subtitulo: String, onAutenticado: (Cipher) -> Unit) {
        val host = actividad
        if (host == null) {
            accionHuella = AccionHuella.NINGUNA
            Toast.makeText(context, "La huella no está disponible en esta pantalla.", Toast.LENGTH_SHORT).show()
            if (loginViewModel.loginSuccess) completarAcceso()
            return
        }

        val prompt = BiometricPrompt(
            host,
            ContextCompat.getMainExecutor(context),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    val cipherAutenticado = result.cryptoObject?.cipher
                    if (cipherAutenticado == null) {
                        accionHuella = AccionHuella.NINGUNA
                        Toast.makeText(context, "No se pudo abrir el acceso seguro.", Toast.LENGTH_SHORT).show()
                        if (loginViewModel.loginSuccess) completarAcceso()
                    } else {
                        onAutenticado(cipherAutenticado)
                    }
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    val accionCancelada = accionHuella
                    accionHuella = AccionHuella.NINGUNA
                    if (accionCancelada == AccionHuella.GUARDAR_CREDENCIALES) {
                        Toast.makeText(context, "Puedes activar la huella más tarde.", Toast.LENGTH_SHORT).show()
                        completarAcceso()
                    } else if (accionCancelada == AccionHuella.INICIAR_SESION &&
                        errorCode != BiometricPrompt.ERROR_NEGATIVE_BUTTON &&
                        errorCode != BiometricPrompt.ERROR_USER_CANCELED
                    ) {
                        Toast.makeText(context, errString, Toast.LENGTH_SHORT).show()
                    }
                }
            }
        )
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(titulo)
            .setSubtitle(subtitulo)
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .setNegativeButtonText("Cancelar")
            .setConfirmationRequired(false)
            .build()
        runCatching {
            prompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))
        }.onFailure { error ->
            accionHuella = AccionHuella.NINGUNA
            Toast.makeText(context, error.message ?: "No se pudo iniciar la huella.", Toast.LENGTH_SHORT).show()
            if (loginViewModel.loginSuccess) completarAcceso()
        }
    }

    LaunchedEffect(loginViewModel.loginSuccess) {
        if (loginViewModel.loginSuccess) {
            val correoAutenticado = loginViewModel.userEmail.ifBlank { correo }
            if (loginPorHuella || (huellaConfigurada && CredencialesBiometricasStore.correspondenA(context, correoAutenticado))) {
                completarAcceso()
            } else {
                if (huellaConfigurada) {
                    CredencialesBiometricasStore.borrar(context)
                    huellaConfigurada = false
                }
                if (huellaDisponible && actividad != null) {
                    mostrarDialogoHuella = true
                } else {
                    completarAcceso()
                }
            }
        }
    }

    LaunchedEffect(loginViewModel.errorMessage) {
        loginViewModel.errorMessage?.let {
            if (loginPorHuella && it.contains("Credenciales incorrectas", ignoreCase = true)) {
                CredencialesBiometricasStore.borrar(context)
                huellaConfigurada = false
                loginPorHuella = false
            }
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
        }
    }

    LaunchedEffect(loginViewModel.recoveryMessage) {
        loginViewModel.recoveryMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
        }
    }

    if (mostrarDialogoHuella) {
        AlertDialog(
            onDismissRequest = {
                mostrarDialogoHuella = false
                completarAcceso()
            },
            icon = {
                Icon(Icons.Outlined.Fingerprint, contentDescription = null, tint = spartanRed, modifier = Modifier.size(28.dp))
            },
            title = { Text("Acceso con huella", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    "¿Quieres proteger este acceso en este dispositivo? La contraseña se guarda cifrada y solo se abre después de confirmar tu huella.",
                    color = textPlaceholder
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val cipher = runCatching { CredencialesBiometricasStore.prepararCifrado() }.getOrElse {
                            Toast.makeText(context, "No se pudo preparar el acceso seguro.", Toast.LENGTH_SHORT).show()
                            completarAcceso()
                            return@Button
                        }
                        accionHuella = AccionHuella.GUARDAR_CREDENCIALES
                        mostrarPromptHuella(
                            cipher,
                            "Activar acceso con huella",
                            "Confirma para cifrar tus credenciales en este dispositivo"
                        ) { cipherAutenticado ->
                            runCatching {
                                CredencialesBiometricasStore.guardar(context, cipherAutenticado, correo, contrasena)
                                huellaConfigurada = true
                            }.onFailure {
                                Toast.makeText(context, "No se pudo guardar el acceso biométrico.", Toast.LENGTH_SHORT).show()
                            }
                            accionHuella = AccionHuella.NINGUNA
                            completarAcceso()
                        }
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = spartanRed)
                ) { Text("Activar") }
            },
            dismissButton = {
                TextButton(onClick = {
                    mostrarDialogoHuella = false
                    completarAcceso()
                }) { Text("Ahora no", color = textPlaceholder) }
            },
            containerColor = Color(0xFF1B1B1F),
            shape = RoundedCornerShape(24.dp)
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        ImagenMarca(
            source = appConfig.fondoLogin,
            fallbackResource = R.drawable.fondo_login,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize().graphicsLayer {
                scaleX = 1.12f
                scaleY = 1.12f
                translationY = if (reducirMovimiento) 0f else (scrollLogin.value * 0.22f).coerceAtMost(70f)
            }
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        listOf(Color.Black.copy(alpha = 0.15f), Color.Black.copy(alpha = 0.32f), Color(0xF50A0A0D))
                    )
                )
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .imePadding(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .widthIn(max = 440.dp)
                    .fillMaxWidth()
                    .verticalScroll(scrollLogin)
                    .padding(horizontal = 20.dp, vertical = 18.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {

            MarcaAplicacion(
                appConfig = appConfig,
                alturaLogo = 148.dp,
                mostrarNombre = false,
                modifier = Modifier.fillMaxWidth(0.9f)
            )

            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Iniciar sesión",
                color = Color.White,
                fontSize = 25.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Bienvenido a ${appConfig.nombreVisibleApp()}",
                color = textPlaceholder,
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 4.dp, bottom = 18.dp)
            )

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = darkCardBg,
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.10f))
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    loginViewModel.errorMessage?.let { message ->
                        Text(message, color = Color(0xFFFFB4AB), style = MaterialTheme.typography.bodyMedium)
                    }
                    CampoInicio(
                        label = "Correo electrónico",
                        value = correo,
                        onValueChange = { correo = it },
                        placeholder = "Ingresa tu correo",
                        fieldBackground = fieldBackground,
                        fieldBorder = fieldBorder,
                        spartanRed = spartanRed,
                        textLabel = textLabel,
                        textPlaceholder = textPlaceholder,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Outlined.Person,
                                contentDescription = null,
                                tint = textPlaceholder,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    )

                    CampoInicio(
                        label = "Contraseña",
                        value = contrasena,
                        onValueChange = { contrasena = it },
                        placeholder = "Ingresa tu contraseña",
                        fieldBackground = fieldBackground,
                        fieldBorder = fieldBorder,
                        spartanRed = spartanRed,
                        textLabel = textLabel,
                        textPlaceholder = textPlaceholder,
                        isPassword = !passwordVisible,
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Outlined.Lock,
                                contentDescription = null,
                                tint = textPlaceholder,
                                modifier = Modifier.size(20.dp)
                            )
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) {
                                        Icons.Outlined.Visibility
                                    } else {
                                        Icons.Outlined.VisibilityOff
                                    },
                                    contentDescription = if (passwordVisible) "Ocultar contraseña" else "Mostrar contraseña",
                                    tint = textPlaceholder
                                )
                            }
                        }
                    )

                    TextButton(
                        onClick = {
                            mostrarRecuperacion = !mostrarRecuperacion
                            if (correoRecuperacion.isBlank()) {
                                correoRecuperacion = correo
                            }
                        },
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text(
                            text = "Recuperar contraseña",
                            color = spartanRed,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    AnimatedVisibility(visible = mostrarRecuperacion, enter = fadeIn(tween(150)), exit = fadeOut(tween(100))) {
                        val usaCorreoLogin = correo.trim().isNotBlank()

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF101010),
                            border = BorderStroke(1.dp, spartanRed.copy(alpha = 0.35f))
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(
                                    text = "¿Has olvidado la contraseña?",
                                    color = Color.White,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Black,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Text(
                                    text = if (usaCorreoLogin) {
                                        "Enviaremos un enlace seguro al correo que escribiste para iniciar sesion."
                                    } else {
                                        "Escribe el correo registrado para recibir el enlace seguro."
                                    },
                                    color = Color(0xFFBDBDBD),
                                    fontSize = 12.sp,
                                    lineHeight = 18.sp,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                if (!usaCorreoLogin) {
                                    CampoInicio(
                                        label = "Correo registrado",
                                        value = correoRecuperacion,
                                        onValueChange = { correoRecuperacion = it },
                                        placeholder = "correo@ejemplo.com",
                                        fieldBackground = fieldBackground,
                                        fieldBorder = fieldBorder,
                                        spartanRed = spartanRed,
                                        textLabel = textLabel,
                                        textPlaceholder = textPlaceholder,
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                        leadingIcon = {
                                            Icon(
                                                imageVector = Icons.Outlined.Email,
                                                contentDescription = null,
                                                tint = textPlaceholder,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    )
                                }

                                loginViewModel.recoveryMessage?.let { mensaje ->
                                    Surface(
                                        color = Color(0xFF0B2A17),
                                        border = BorderStroke(1.dp, Color(0xFF22C55E).copy(alpha = 0.35f)),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = mensaje,
                                            color = Color(0xFF86EFAC),
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            textAlign = TextAlign.Center,
                                            modifier = Modifier.padding(12.dp)
                                        )
                                    }
                                }

                                OutlinedButton(
                                    onClick = {
                                        val emailParaEnviar = correo.trim().ifBlank { correoRecuperacion.trim() }
                                        if (emailParaEnviar.isBlank()) {
                                            Toast.makeText(context, "Ingresa tu correo registrado", Toast.LENGTH_SHORT).show()
                                        } else {
                                            loginViewModel.solicitarRecuperacion(emailParaEnviar)
                                        }
                                    },
                                    enabled = !loginViewModel.isLoading,
                                    modifier = Modifier.fillMaxWidth(),
                                    border = BorderStroke(1.dp, spartanRed),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        text = if (loginViewModel.isLoading) "ENVIANDO..." else "ENVIAR ENLACE SEGURO",
                                        color = Color.White,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }
                        }
                    }

                    Button(
                        onClick = {
                            loginPorHuella = false
                            loginViewModel.iniciarSesion(
                                email = correo,
                                pass = contrasena
                            )
                        },
                        enabled = !loginViewModel.isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp)
                            .applePressScale(loginInteractionSource),
                        interactionSource = loginInteractionSource,
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = spartanRed)
                    ) {
                        if (loginViewModel.isLoading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(22.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = "Iniciar sesión",
                                color = Color.White,
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp
                            )
                        }
                    }

                    if (huellaConfigurada && huellaDisponible) {
                        OutlinedButton(
                            onClick = {
                                val cipher = runCatching { CredencialesBiometricasStore.prepararDescifrado(context) }.getOrElse {
                                    CredencialesBiometricasStore.borrar(context)
                                    huellaConfigurada = false
                                    Toast.makeText(context, "Vuelve a iniciar sesión para activar la huella.", Toast.LENGTH_LONG).show()
                                    return@OutlinedButton
                                }
                                accionHuella = AccionHuella.INICIAR_SESION
                                mostrarPromptHuella(
                                    cipher,
                                    "Iniciar con huella",
                                    "Confirma tu identidad para acceder a ${appConfig.nombreVisibleApp()}"
                                ) { cipherAutenticado ->
                                    runCatching {
                                        val credenciales = CredencialesBiometricasStore.leer(context, cipherAutenticado)
                                        correo = credenciales.correo
                                        contrasena = credenciales.contrasena
                                        loginPorHuella = true
                                        accionHuella = AccionHuella.NINGUNA
                                        loginViewModel.iniciarSesion(credenciales.correo, credenciales.contrasena)
                                    }.onFailure {
                                        CredencialesBiometricasStore.borrar(context)
                                        huellaConfigurada = false
                                        accionHuella = AccionHuella.NINGUNA
                                        Toast.makeText(context, "Vuelve a iniciar sesión y activa la huella otra vez.", Toast.LENGTH_LONG).show()
                                    }
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .applePressScale(huellaInteractionSource),
                            interactionSource = huellaInteractionSource,
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.16f)),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                        ) {
                            Icon(Icons.Outlined.Fingerprint, contentDescription = null, modifier = Modifier.size(19.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Continuar con huella", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }

                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}

@Composable
private fun CampoInicio(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    fieldBackground: Color,
    fieldBorder: Color,
    spartanRed: Color,
    textLabel: Color,
    textPlaceholder: Color,
    isPassword: Boolean = false,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null
) {
    Column {
        Text(
            text = label,
            color = textLabel,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = {
                Text(
                    text = placeholder,
                    color = textPlaceholder,
                    fontSize = 14.sp
                )
            },
            leadingIcon = leadingIcon,
            trailingIcon = trailingIcon,
            keyboardOptions = keyboardOptions,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = fieldBackground,
                unfocusedContainerColor = fieldBackground,
                focusedBorderColor = spartanRed,
                unfocusedBorderColor = fieldBorder,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                cursorColor = spartanRed
            ),
            visualTransformation = if (isPassword) {
                PasswordVisualTransformation()
            } else {
                VisualTransformation.None
            },
            singleLine = true
        )
    }
}
