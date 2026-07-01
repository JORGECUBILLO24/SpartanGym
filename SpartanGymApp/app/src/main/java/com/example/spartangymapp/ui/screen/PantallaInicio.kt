package com.example.spartangymapp.ui.screen

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.spartangymapp.R
import com.example.spartangymapp.network.AppConfigResponse
import com.example.spartangymapp.network.RetrofitClient
import com.example.spartangymapp.viewmodel.LoginViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun PantallaInicio(
    appConfig: AppConfigResponse = AppConfigResponse(),
    onLoginSuccess: (String, String, String) -> Unit,
    loginViewModel: LoginViewModel = viewModel()
) {
    val context = LocalContext.current

    var correo by remember { mutableStateOf("") }
    var contrasena by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var mostrarRecuperacion by remember { mutableStateOf(false) }
    var correoRecuperacion by remember { mutableStateOf("") }
    var mostrarServidor by remember { mutableStateOf(false) }
    var servidorInput by remember { mutableStateOf(RetrofitClient.getServidorMostrable()) }

    val spartanRed = MaterialTheme.colorScheme.primary
    val cardBorder = Color(0xFF6A0F15)
    val darkCardBg = Color(0xEE080808)
    val fieldBackground = Color(0xFF141414)
    val fieldBorder = Color(0xFF292929)
    val textLabel = Color(0xFFE0E0E0)
    val textPlaceholder = Color(0xFF757575)

    LaunchedEffect(loginViewModel.loginSuccess) {
        if (loginViewModel.loginSuccess) {
            Toast.makeText(context, "Bienvenido", Toast.LENGTH_SHORT).show()
            onLoginSuccess(
                loginViewModel.userEmail.ifBlank { correo },
                loginViewModel.userRole,
                loginViewModel.userId
            )
            loginViewModel.limpiarEstado()
        }
    }

    LaunchedEffect(loginViewModel.errorMessage) {
        loginViewModel.errorMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
        }
    }

    LaunchedEffect(loginViewModel.recoveryMessage) {
        loginViewModel.recoveryMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        ImagenConfiguracion(
            source = appConfig.fondoLogin,
            fallbackResource = R.drawable.fondo_login,
            contentDescription = "Fondo del gimnasio",
            contentScale = ContentScale.Crop,
            alignment = Alignment.Center,
            modifier = Modifier.fillMaxSize()
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.72f))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(70.dp))

            ImagenConfiguracion(
                source = appConfig.logoAcceso?.takeIf { it.isNotBlank() } ?: appConfig.logoPrincipal,
                fallbackResource = R.drawable.logo_spartangym,
                contentDescription = "Logo Spartan Gym",
                modifier = Modifier
                    .fillMaxWidth(0.95f)
                    .padding(horizontal = 8.dp),
                contentScale = ContentScale.Fit
            )

            Text(
                text = appConfig.gymName ?: "SPARTAN GYM",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center,
                style = TextStyle(
                    shadow = Shadow(
                        color = spartanRed,
                        blurRadius = 12f
                    )
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(20.dp))

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = darkCardBg,
                border = BorderStroke(1.dp, cardBorder)
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    CampoInicio(
                        label = "Correo electronico",
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
                                    contentDescription = null,
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

                    if (mostrarRecuperacion) {
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
                            loginViewModel.iniciarSesion(
                                email = correo,
                                pass = contrasena
                            )
                        },
                        enabled = !loginViewModel.isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(10.dp),
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
                                text = "ENTRAR",
                                color = Color.White,
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp
                            )
                        }
                    }

                    // ── Configuracion del servidor (para conexion por IP en celulares reales) ──
                    TextButton(
                        onClick = {
                            mostrarServidor = !mostrarServidor
                            if (mostrarServidor) servidorInput = RetrofitClient.getServidorMostrable()
                        },
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text(
                            text = if (mostrarServidor) "Ocultar configuracion de servidor" else "Configurar servidor",
                            color = textPlaceholder,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    if (mostrarServidor) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF101010),
                            border = BorderStroke(1.dp, spartanRed.copy(alpha = 0.35f))
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(
                                    text = "Direccion del servidor",
                                    color = Color.White,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = "Emulador: 10.0.2.2:8080\nCelular en la misma red Wi-Fi: IP del servidor (ej. 192.168.1.10:8080)",
                                    color = Color(0xFFBDBDBD),
                                    fontSize = 11.sp,
                                    lineHeight = 16.sp
                                )
                                CampoInicio(
                                    label = "IP o URL del servidor",
                                    value = servidorInput,
                                    onValueChange = { servidorInput = it },
                                    placeholder = "192.168.1.10:8080",
                                    fieldBackground = fieldBackground,
                                    fieldBorder = fieldBorder,
                                    spartanRed = spartanRed,
                                    textLabel = textLabel,
                                    textPlaceholder = textPlaceholder,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri)
                                )
                                OutlinedButton(
                                    onClick = {
                                        RetrofitClient.setBaseUrl(servidorInput)
                                        servidorInput = RetrofitClient.getServidorMostrable()
                                        Toast.makeText(
                                            context,
                                            "Servidor guardado: ${RetrofitClient.getBaseUrl()}",
                                            Toast.LENGTH_SHORT
                                        ).show()
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    border = BorderStroke(1.dp, spartanRed),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        text = "GUARDAR SERVIDOR",
                                        color = Color.White,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(30.dp))
        }
    }
}

@Composable
private fun ImagenConfiguracion(
    source: String?,
    fallbackResource: Int,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Fit,
    alignment: Alignment = Alignment.Center
) {
    var imageBitmap by remember(source) { mutableStateOf<androidx.compose.ui.graphics.ImageBitmap?>(null) }

    LaunchedEffect(source) {
        imageBitmap = withContext(Dispatchers.IO) {
            cargarImagenConfiguracion(source)?.asImageBitmap()
        }
    }

    val imagen = imageBitmap
    if (imagen != null) {
        Image(
            bitmap = imagen,
            contentDescription = contentDescription,
            contentScale = contentScale,
            alignment = alignment,
            modifier = modifier
        )
    } else {
        Image(
            painter = painterResource(id = fallbackResource),
            contentDescription = contentDescription,
            contentScale = contentScale,
            alignment = alignment,
            modifier = modifier
        )
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
                .height(62.dp),
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
