package com.example.spartangymapp.ui.screen

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.spartangymapp.R
import com.example.spartangymapp.viewmodel.LoginViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
// Inyectamos el ViewModel aquí
fun PantallaInicio(loginViewModel: LoginViewModel = viewModel()) {
    val context = LocalContext.current
    var correo by remember { mutableStateOf("") }
    var contrasena by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var expanded by remember { mutableStateOf(false) }
    var selectedRole by remember { mutableStateOf("") }

    // ── Lógica de MVVM: Escuchar a la API ─────────────────────────────────────
    LaunchedEffect(loginViewModel.loginSuccess, loginViewModel.errorMessage) {
        if (loginViewModel.loginSuccess) {
            Toast.makeText(context, "¡Bienvenido, ${loginViewModel.userRole}!", Toast.LENGTH_SHORT).show()
            // TODO: Aquí agregaremos el código para saltar a la siguiente pantalla
        }
        if (loginViewModel.errorMessage != null) {
            Toast.makeText(context, loginViewModel.errorMessage, Toast.LENGTH_LONG).show()
        }
    }

    // ── Paleta de colores exacta a la imagen ──────────────────────────────────
    val spartanRed        = Color(0xFFE10613)   // Rojo principal (botón, borde rol activo)
    val redGradientDark   = Color(0xFFD50000)   // Rojo oscuro (gradiente inferior del botón)
    val cardBorder        = Color(0xFF6A0F15)   // Borde vino oscuro de la tarjeta
    val darkCardBg        = Color(0xEE080808)   // Fondo de la tarjeta (~93 % opacidad)
    val fieldBackground   = Color(0xFF141414)   // Fondo de los campos de texto
    val fieldBorder       = Color(0xFF292929)   // Borde inactivo de los campos
    val textLabel         = Color(0xFFE0E0E0)   // Etiquetas de campos
    val textPlaceholder   = Color(0xFF757575)   // Placeholder / iconos
    val textSubtitle      = Color(0xFFAAAAAA)   // "Sistema de Gestión Integral"
    val forgotRedLink     = Color(0xFFE10613)   // "¿Olvidaste tu contraseña?" — rojo vivo

    Box(modifier = Modifier.fillMaxSize()) {

        // ── 1. Imagen de fondo ────────────────────────────────────────────────
        Image(
            painter = painterResource(id = R.drawable.fondo_login),
            contentDescription = "Fondo del gimnasio",
            contentScale = ContentScale.Crop,
            alignment = Alignment.Center,
            modifier = Modifier.fillMaxSize()
        )

        // ── 2. Capa negra general ─────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.70f))
        )

        // ── 3. Contenido principal (scrollable para pantallas pequeñas) ───────
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {

            // ── Logo ────
            Spacer(modifier = Modifier.height(80.dp))

            Image(
                painter = painterResource(id = R.drawable.logo_spartangym),
                contentDescription = "Logo Spartan Gym",
                modifier = Modifier
                    .fillMaxWidth(0.95f)
                    .padding(horizontal = 8.dp),
                contentScale = ContentScale.Fit
            )

            // ── Tarjeta del formulario ────────────────────────────────────────
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-30).dp),
                shape = RoundedCornerShape(12.dp),
                color = darkCardBg,
                border = BorderStroke(1.dp, cardBorder)
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {

                    // ── Campo: Correo o usuario ───────────────────────────────
                    Column {
                        Text(
                            text = "Correo o usuario",
                            color = textLabel,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        OutlinedTextField(
                            value = correo,
                            onValueChange = { correo = it },
                            placeholder = {
                                Text(
                                    text = "Ingresa tu correo o usuario",
                                    color = textPlaceholder,
                                    fontSize = 14.sp
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Outlined.Person,
                                    contentDescription = null,
                                    tint = textPlaceholder,
                                    modifier = Modifier.size(20.dp)
                                )
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(62.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor   = fieldBackground,
                                unfocusedContainerColor = fieldBackground,
                                focusedBorderColor      = spartanRed,
                                unfocusedBorderColor    = fieldBorder,
                                focusedTextColor        = Color.White,
                                unfocusedTextColor      = Color.White,
                                cursorColor             = spartanRed
                            ),
                            singleLine = true
                        )
                    }

                    // ── Campo: Contraseña ─────────────────────────────────────
                    Column {
                        Text(
                            text = "Contraseña",
                            color = textLabel,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        OutlinedTextField(
                            value = contrasena,
                            onValueChange = { contrasena = it },
                            placeholder = {
                                Text(
                                    text = "Ingresa tu contraseña",
                                    color = textPlaceholder,
                                    fontSize = 14.sp
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Outlined.Lock,
                                    contentDescription = null,
                                    tint = textPlaceholder,
                                    modifier = Modifier.size(20.dp)
                                )
                            },
                            trailingIcon = {
                                val icon = if (passwordVisible)
                                    Icons.Outlined.Visibility
                                else
                                    Icons.Outlined.VisibilityOff
                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = if (passwordVisible) "Ocultar contraseña" else "Mostrar contraseña",
                                        tint = textPlaceholder,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            },
                            visualTransformation = if (passwordVisible)
                                VisualTransformation.None
                            else
                                PasswordVisualTransformation(),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(62.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor   = fieldBackground,
                                unfocusedContainerColor = fieldBackground,
                                focusedBorderColor      = spartanRed,
                                unfocusedBorderColor    = fieldBorder,
                                focusedTextColor        = Color.White,
                                unfocusedTextColor      = Color.White,
                                cursorColor             = spartanRed
                            ),
                            singleLine = true
                        )
                    }

                    // ── Campo: Rol (Dropdown) ─────────────────────────────────
                    Column {
                        Text(
                            text = "Rol",
                            color = textLabel,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )
                        ExposedDropdownMenuBox(
                            expanded = expanded,
                            onExpandedChange = { expanded = !expanded }
                        ) {
                            OutlinedTextField(
                                value = selectedRole,
                                onValueChange = {},
                                readOnly = true,
                                placeholder = {
                                    Text(
                                        text = "Selecciona tu rol",
                                        color = textPlaceholder,
                                        fontSize = 14.sp
                                    )
                                },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Outlined.Shield,
                                        contentDescription = null,
                                        tint = textPlaceholder,
                                        modifier = Modifier.size(20.dp)
                                    )
                                },
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(62.dp)
                                    .menuAnchor(),
                                shape = RoundedCornerShape(10.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor   = fieldBackground,
                                    unfocusedContainerColor = fieldBackground,
                                    focusedBorderColor      = spartanRed,
                                    unfocusedBorderColor    = if (selectedRole.isEmpty()) spartanRed else fieldBorder,
                                    focusedTextColor        = Color.White,
                                    unfocusedTextColor      = Color.White
                                )
                            )

                            ExposedDropdownMenu(
                                expanded = expanded,
                                onDismissRequest = { expanded = false },
                                modifier = Modifier
                                    .background(Color(0xFF0F0F0F))
                                    .border(1.dp, fieldBorder)
                            ) {
                                data class RoleItem(val label: String, val value: String)

                                val roles = listOf(
                                    RoleItem("Socio",          "Socio"),
                                    RoleItem("Entrenador",     "Entrenador"),
                                    RoleItem("Recepcionista",  "Recepcionista"),
                                    RoleItem("Administrador",  "Administrador")
                                )

                                val roleIcons = listOf(
                                    Icons.Outlined.Person,
                                    Icons.Default.FitnessCenter,
                                    Icons.Default.RoomService,
                                    Icons.Default.WorkspacePremium
                                )

                                roles.forEachIndexed { index, role ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = role.label,
                                                color = textLabel,
                                                fontSize = 14.sp
                                            )
                                        },
                                        leadingIcon = {
                                            Icon(
                                                imageVector = roleIcons[index],
                                                contentDescription = null,
                                                tint = textPlaceholder,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        },
                                        onClick = {
                                            selectedRole = role.value
                                            expanded = false
                                        },
                                        colors = MenuDefaults.itemColors(
                                            textColor = textLabel
                                        )
                                    )
                                    if (index < roles.size - 1) {
                                        HorizontalDivider(
                                            color = fieldBorder.copy(alpha = 0.5f),
                                            thickness = 0.5.dp,
                                            modifier = Modifier.padding(horizontal = 16.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // ── Botón: Iniciar sesión ─────────────────────────────────
                    Button(
                        // LÓGICA CONECTADA AL VIEWMODEL
                        onClick = {
                            if (correo.isNotEmpty() && contrasena.isNotEmpty()) {
                                loginViewModel.iniciarSesion(correo, contrasena)
                            } else {
                                Toast.makeText(context, "Por favor llena todos los campos", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(58.dp)
                            .background(
                                brush = Brush.verticalGradient(
                                    colors = listOf(
                                        Color(0xFFFF1A1A),
                                        redGradientDark
                                    )
                                ),
                                shape = RoundedCornerShape(14.dp)
                            ),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent
                        ),
                        contentPadding = PaddingValues(0.dp),
                        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp),
                        enabled = !loginViewModel.isLoading // Deshabilita el botón si está cargando
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            // ANIMACIÓN DE CARGA O TEXTO NORMAL
                            if (loginViewModel.isLoading) {
                                CircularProgressIndicator(
                                    color = Color.White,
                                    modifier = Modifier.size(26.dp).align(Alignment.Center)
                                )
                            } else {
                                Text(
                                    text = "Iniciar sesión",
                                    color = Color.White,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.align(Alignment.Center)
                                )
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier
                                        .align(Alignment.CenterEnd)
                                        .size(24.dp)
                                )
                            }
                        }
                    }

                    // ── Link: Olvidaste tu contraseña ─────────────────────────
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp, bottom = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "¿Olvidaste tu contraseña?",
                            color = forgotRedLink,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.clickable { /* TODO: recuperar contraseña */ }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(30.dp))
        }
    }
}