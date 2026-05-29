package ni.edu.uam.spartangym.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ni.edu.uam.spartangym.ui.components.FondoSpartan
import ni.edu.uam.spartangym.ui.components.RolChip
import ni.edu.uam.spartangym.ui.components.SpartanLogo
import ni.edu.uam.spartangym.ui.theme.Blanco
import ni.edu.uam.spartangym.ui.theme.Gris
import ni.edu.uam.spartangym.ui.theme.Rojo
import ni.edu.uam.spartangym.ui.theme.Tarjeta

@Composable
fun RegistroScreen(
    onSocioClick: () -> Unit,
    onEntrenadorClick: () -> Unit
) {
    var usuario by rememberSaveable {
        mutableStateOf("")
    }

    var password by rememberSaveable {
        mutableStateOf("")
    }

    var passwordVisible by rememberSaveable {
        mutableStateOf(false)
    }

    var rolSeleccionado by rememberSaveable {
        mutableStateOf("Socio")
    }

    FondoSpartan {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(28.dp))

            SpartanLogo(
                boxWidth = 320.dp,
                boxHeight = 180.dp,
                logoSize = 145.dp,
                tituloSize = 48.sp,
                gymSize = 34.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Sistema de Gestión Integral",
                color = Gris,
                fontSize = 18.sp
            )

            Spacer(modifier = Modifier.height(28.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Tarjeta),
                border = BorderStroke(1.dp, Rojo.copy(alpha = 0.45f))
            ) {
                Column(
                    modifier = Modifier.padding(22.dp)
                ) {
                    Text(
                        text = "Correo o usuario",
                        color = Blanco,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = usuario,
                        onValueChange = { usuario = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = {
                            Text("Ingresa tu correo o usuario")
                        },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null
                            )
                        },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Blanco,
                            unfocusedTextColor = Blanco,
                            focusedBorderColor = Rojo,
                            unfocusedBorderColor = Gris,
                            focusedLeadingIconColor = Rojo,
                            unfocusedLeadingIconColor = Gris,
                            focusedPlaceholderColor = Gris,
                            unfocusedPlaceholderColor = Gris
                        )
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    Text(
                        text = "Contraseña",
                        color = Blanco,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = {
                            Text("Ingresa tu contraseña")
                        },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null
                            )
                        },
                        trailingIcon = {
                            IconButton(
                                onClick = {
                                    passwordVisible = !passwordVisible
                                }
                            ) {
                                Icon(
                                    imageVector = if (passwordVisible) {
                                        Icons.Default.VisibilityOff
                                    } else {
                                        Icons.Default.Visibility
                                    },
                                    contentDescription = null
                                )
                            }
                        },
                        singleLine = true,
                        visualTransformation = if (passwordVisible) {
                            VisualTransformation.None
                        } else {
                            PasswordVisualTransformation()
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Blanco,
                            unfocusedTextColor = Blanco,
                            focusedBorderColor = Rojo,
                            unfocusedBorderColor = Gris,
                            focusedLeadingIconColor = Rojo,
                            unfocusedLeadingIconColor = Gris,
                            focusedTrailingIconColor = Rojo,
                            unfocusedTrailingIconColor = Gris,
                            focusedPlaceholderColor = Gris,
                            unfocusedPlaceholderColor = Gris
                        )
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = "Rol",
                        color = Blanco,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        RolChip(
                            texto = "Socio",
                            seleccionado = rolSeleccionado == "Socio",
                            modifier = Modifier.weight(1f)
                        ) {
                            rolSeleccionado = "Socio"
                        }

                        RolChip(
                            texto = "Entrenador",
                            seleccionado = rolSeleccionado == "Entrenador",
                            modifier = Modifier.weight(1f)
                        ) {
                            rolSeleccionado = "Entrenador"
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = {
                            if (rolSeleccionado == "Socio") {
                                onSocioClick()
                            } else {
                                onEntrenadorClick()
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(58.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Rojo),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            text = "Iniciar sesión",
                            color = Blanco,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "¿Olvidaste tu contraseña?",
                        color = Rojo,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                }
            }
        }
    }
}