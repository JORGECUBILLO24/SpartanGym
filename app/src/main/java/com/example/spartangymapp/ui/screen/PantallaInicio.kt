package com.example.spartangymapp.ui.screen

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.spartangymapp.R
import com.example.spartangymapp.viewmodel.LoginViewModel

@Composable
fun PantallaInicio(
    onLoginSuccess: (String, String) -> Unit,
    loginViewModel: LoginViewModel = viewModel()
) {
    val context = LocalContext.current

    var modoCrearCuenta by remember { mutableStateOf(false) }
    var nombre by remember { mutableStateOf("") }
    var correo by remember { mutableStateOf("") }
    var contrasena by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var selectedRole by remember { mutableStateOf("SOCIO") }

    val spartanRed = Color(0xFFE10613)
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
                loginViewModel.userRole.ifBlank { selectedRole }
            )
            loginViewModel.limpiarEstado()
        }
    }

    LaunchedEffect(loginViewModel.registerSuccess) {
        if (loginViewModel.registerSuccess) {
            modoCrearCuenta = false
            nombre = ""
            correo = ""
            contrasena = ""
            Toast.makeText(context, "Cuenta creada. Inicia sesión.", Toast.LENGTH_LONG).show()
            loginViewModel.limpiarEstado()
        }
    }

    LaunchedEffect(loginViewModel.errorMessage) {
        loginViewModel.errorMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Image(
            painter = painterResource(id = R.drawable.fondo_login),
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

            Image(
                painter = painterResource(id = R.drawable.logo_spartangym),
                contentDescription = "Logo Spartan Gym",
                modifier = Modifier
                    .fillMaxWidth(0.95f)
                    .padding(horizontal = 8.dp),
                contentScale = ContentScale.Fit
            )

            Text(
                text = if (modoCrearCuenta) "CREAR CUENTA" else "INICIAR SESIÓN",
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
                    if (modoCrearCuenta) {
                        CampoInicio(
                            label = "Nombre completo",
                            value = nombre,
                            onValueChange = { nombre = it },
                            placeholder = "Ingresa tu nombre",
                            fieldBackground = fieldBackground,
                            fieldBorder = fieldBorder,
                            spartanRed = spartanRed,
                            textLabel = textLabel,
                            textPlaceholder = textPlaceholder
                        )
                    }

                    CampoInicio(
                        label = "Correo o usuario",
                        value = correo,
                        onValueChange = { correo = it },
                        placeholder = "Ingresa tu correo o usuario",
                        fieldBackground = fieldBackground,
                        fieldBorder = fieldBorder,
                        spartanRed = spartanRed,
                        textLabel = textLabel,
                        textPlaceholder = textPlaceholder,
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

                    Text(
                        text = "Rol",
                        color = textLabel,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        RolButtonInicio(
                            text = "Socio",
                            selected = selectedRole == "SOCIO",
                            onClick = { selectedRole = "SOCIO" },
                            modifier = Modifier.weight(1f),
                            spartanRed = spartanRed
                        )

                        RolButtonInicio(
                            text = "Entrenador",
                            selected = selectedRole == "ENTRENADOR",
                            onClick = { selectedRole = "ENTRENADOR" },
                            modifier = Modifier.weight(1f),
                            spartanRed = spartanRed
                        )
                    }

                    Button(
                        onClick = {
                            if (modoCrearCuenta) {
                                loginViewModel.crearCuenta(
                                    nombre = nombre,
                                    email = correo,
                                    password = contrasena,
                                    rolSeleccionado = selectedRole
                                )
                            } else {
                                loginViewModel.iniciarSesion(
                                    email = correo,
                                    pass = contrasena,
                                    rolSeleccionado = selectedRole
                                )
                            }
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
                                text = if (modoCrearCuenta) "CREAR CUENTA" else "ENTRAR",
                                color = Color.White,
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp
                            )
                        }
                    }

                    Text(
                        text = if (modoCrearCuenta) {
                            "¿Ya tienes cuenta? Inicia sesión"
                        } else {
                            "¿No tienes cuenta? Crea una"
                        },
                        color = spartanRed,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .clickable {
                                modoCrearCuenta = !modoCrearCuenta
                                nombre = ""
                                correo = ""
                                contrasena = ""
                                loginViewModel.limpiarEstado()
                            }
                    )
                }
            }

            Spacer(modifier = Modifier.height(30.dp))
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

@Composable
private fun RolButtonInicio(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier,
    spartanRed: Color
) {
    Surface(
        modifier = modifier
            .height(48.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(10.dp),
        color = if (selected) spartanRed.copy(alpha = 0.25f) else Color(0xFF141414),
        border = BorderStroke(
            width = 1.dp,
            color = if (selected) spartanRed else Color(0xFF292929)
        )
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            Text(
                text = text,
                color = if (selected) Color.White else Color.Gray,
                fontWeight = FontWeight.Bold
            )
        }
    }
}