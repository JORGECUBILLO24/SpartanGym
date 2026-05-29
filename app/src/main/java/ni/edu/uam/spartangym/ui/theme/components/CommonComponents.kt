package ni.edu.uam.spartangym.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ni.edu.uam.spartangym.R
import ni.edu.uam.spartangym.ui.theme.*

@Composable
fun FondoSpartan(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF020202),
                        Color(0xFF101010),
                        Fondo
                    )
                )
            )
            .padding(20.dp),
        content = content
    )
}

@Composable
fun SpartanLogo(
    modifier: Modifier = Modifier,
    boxWidth: Dp = 210.dp,
    boxHeight: Dp = 100.dp,
    logoSize: Dp = 85.dp,
    tituloSize: TextUnit = 34.sp,
    gymSize: TextUnit = 22.sp
) {
    Box(
        modifier = modifier
            .width(boxWidth)
            .height(boxHeight),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(id = R.drawable.spartan_logo),
            contentDescription = "Logo Spartan Gym",
            modifier = Modifier
                .size(logoSize)
                .alpha(0.9f),
            contentScale = ContentScale.Fit
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "SPARTAN",
                color = Blanco,
                fontSize = tituloSize,
                fontWeight = FontWeight.Black
            )

            Text(
                text = "GYM",
                color = Rojo,
                fontSize = gymSize,
                fontWeight = FontWeight.Black
            )
        }
    }
}

@Composable
fun HeaderConNotificacion(
    rol: String? = null,
    onCerrarSesion: () -> Unit
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            SpartanLogo(
                boxWidth = 170.dp,
                boxHeight = 82.dp,
                logoSize = 72.dp,
                tituloSize = 28.sp,
                gymSize = 18.sp
            )

            Spacer(modifier = Modifier.weight(1f))

            Text(
                text = "🔔",
                color = Gris,
                fontSize = 28.sp
            )

            Spacer(modifier = Modifier.width(14.dp))

            Text(
                text = "Salir",
                color = Rojo,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable {
                    onCerrarSesion()
                }
            )
        }

        if (rol != null) {
            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = rol.uppercase(),
                color = Rojo,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun RolChip(
    texto: String,
    seleccionado: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .height(50.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (seleccionado) Rojo.copy(alpha = 0.25f) else TarjetaOscura
        ),
        border = BorderStroke(
            width = 1.dp,
            color = if (seleccionado) Rojo else Color.DarkGray
        )
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = texto,
                color = if (seleccionado) Rojo else Blanco,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun InfoCard(
    icono: String,
    titulo: String,
    dato: String,
    descripcion: String,
    colorDato: Color,
    boton: String,
    onClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 14.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Tarjeta),
        border = BorderStroke(1.dp, Color.DarkGray.copy(alpha = 0.7f))
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = icono,
                fontSize = 34.sp,
                color = Rojo
            )

            Spacer(modifier = Modifier.width(18.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = titulo,
                    color = Gris,
                    fontSize = 15.sp
                )

                Text(
                    text = dato,
                    color = colorDato,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = descripcion,
                    color = Gris,
                    fontSize = 14.sp
                )
            }

            Text(
                text = "$boton ›",
                color = Rojo,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
        }
    }
}

@Composable
fun MiniCard(
    icono: String,
    titulo: String,
    dato: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Card(
        modifier = modifier
            .height(125.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Tarjeta),
        border = BorderStroke(1.dp, Color.DarkGray.copy(alpha = 0.7f))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = icono,
                fontSize = 26.sp,
                color = Rojo
            )

            Text(
                text = titulo,
                color = Gris,
                fontSize = 13.sp
            )

            Text(
                text = dato,
                color = Blanco,
                fontSize = 30.sp,
                fontWeight = FontWeight.Black
            )
        }
    }
}

@Composable
fun CardGrande(
    icono: String,
    titulo: String,
    descripcion: String,
    boton: String,
    onClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 14.dp),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Tarjeta),
        border = BorderStroke(1.dp, Color.DarkGray.copy(alpha = 0.7f))
    ) {
        Column(
            modifier = Modifier.padding(22.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = icono,
                    fontSize = 30.sp,
                    color = Rojo
                )

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = titulo,
                    color = Blanco,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = descripcion,
                color = Gris,
                fontSize = 15.sp,
                lineHeight = 22.sp
            )

            Spacer(modifier = Modifier.height(18.dp))

            Button(
                onClick = onClick,
                colors = ButtonDefaults.buttonColors(containerColor = Rojo),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(
                    text = "$boton  ›",
                    color = Blanco,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun CardProgreso() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 22.dp),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Tarjeta),
        border = BorderStroke(1.dp, Color.DarkGray.copy(alpha = 0.7f))
    ) {
        Column(
            modifier = Modifier.padding(22.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📈",
                    fontSize = 30.sp,
                    color = Rojo
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = "Mi Progreso",
                        color = Blanco,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = "Última actualización: 28 Abr 2026",
                        color = Gris,
                        fontSize = 14.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            FilaProgreso("Peso", "78.5 kg", "↓ 1.2 kg")
            FilaProgreso("IMC", "24.8", "↓ 0.3")
            FilaProgreso("% Grasa Corporal", "15.2 %", "↓ 1.1 %")
        }
    }
}

@Composable
fun FilaProgreso(
    nombre: String,
    valor: String,
    cambio: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = nombre,
            color = Blanco,
            modifier = Modifier.weight(1f)
        )

        Text(
            text = valor,
            color = Blanco,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.width(18.dp))

        Text(
            text = cambio,
            color = Verde,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun SeccionTitulo(
    titulo: String,
    subtitulo: String? = null
) {
    Column(
        modifier = Modifier.padding(bottom = 16.dp)
    ) {
        Text(
            text = titulo,
            color = Blanco,
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold
        )

        if (subtitulo != null) {
            Text(
                text = subtitulo,
                color = Gris,
                fontSize = 15.sp
            )
        }
    }
}

@Composable
fun ListaItem(
    titulo: String,
    detalle: String,
    etiqueta: String? = null
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 10.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = TarjetaOscura),
        border = BorderStroke(1.dp, Color.DarkGray.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = titulo,
                    color = Blanco,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )

                Text(
                    text = detalle,
                    color = Gris,
                    fontSize = 14.sp
                )
            }

            if (etiqueta != null) {
                Text(
                    text = etiqueta,
                    color = Rojo,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun BotonSecundario(
    texto: String,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        border = BorderStroke(1.dp, Rojo),
        shape = RoundedCornerShape(14.dp)
    ) {
        Text(
            text = texto,
            color = Rojo,
            fontWeight = FontWeight.Bold
        )
    }
}