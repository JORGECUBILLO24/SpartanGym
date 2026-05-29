package ni.edu.uam.spartangym.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ni.edu.uam.spartangym.ui.components.BottomMenuSocio
import ni.edu.uam.spartangym.ui.components.CardGrande
import ni.edu.uam.spartangym.ui.components.CardProgreso
import ni.edu.uam.spartangym.ui.components.FondoSpartan
import ni.edu.uam.spartangym.ui.components.HeaderConNotificacion
import ni.edu.uam.spartangym.ui.components.InfoCard
import ni.edu.uam.spartangym.ui.components.ListaItem
import ni.edu.uam.spartangym.ui.components.SeccionTitulo
import ni.edu.uam.spartangym.ui.theme.Blanco
import ni.edu.uam.spartangym.ui.theme.Fondo
import ni.edu.uam.spartangym.ui.theme.Rojo
import ni.edu.uam.spartangym.ui.theme.Verde

@Composable
fun SocioScreen(
    usuario: String = "Socio",
    onCerrarSesion: () -> Unit = {}
) {
    var seccionActual by rememberSaveable {
        mutableStateOf(0)
    }

    Scaffold(
        containerColor = Fondo,
        bottomBar = {
            BottomMenuSocio(
                seleccionado = seccionActual,
                onSeleccionar = { seccionActual = it }
            )
        }
    ) { paddingValues ->
        FondoSpartan(
            modifier = Modifier.fillMaxSize()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                Spacer(modifier = Modifier.height(paddingValues.calculateTopPadding()))

                HeaderConNotificacion(
                    onCerrarSesion = onCerrarSesion
                )

                Spacer(modifier = Modifier.height(24.dp))

                when (seccionActual) {
                    0 -> SocioInicio()
                    1 -> SocioRutina()
                    2 -> SocioPagos()
                    3 -> SocioPerfil(usuario = usuario)
                }

                Spacer(modifier = Modifier.height(paddingValues.calculateBottomPadding()))
            }
        }
    }
}

@Composable
fun SocioInicio() {
    InfoCard(
        icono = "✓",
        titulo = "Estado de Membresía",
        dato = "Activa",
        descripcion = "Mensual\nVence el 30 May 2026",
        colorDato = Verde,
        boton = "Ver detalles"
    )

    InfoCard(
        icono = "▦",
        titulo = "Próximo Pago",
        dato = "30 May 2026",
        descripcion = "Quedan 30 días",
        colorDato = Rojo,
        boton = "Ver historial"
    )

    InfoCard(
        icono = "▣",
        titulo = "Asistencias este mes",
        dato = "12 asistencias",
        descripcion = "de 30 posibles",
        colorDato = Blanco,
        boton = "Ver más"
    )

    CardGrande(
        icono = "▣",
        titulo = "Mi Rutina Actual",
        descripcion = "Rutina de Hipertrofia - Nivel Intermedio\n\nAsignada por:\nCarlos Mendoza (Entrenador)",
        boton = "Ver rutina completa"
    )

    CardProgreso()
}

@Composable
fun SocioRutina() {
    SeccionTitulo(
        titulo = "Mi Rutina",
        subtitulo = "Plan de entrenamiento asignado por tu entrenador"
    )

    CardGrande(
        icono = "▣",
        titulo = "Rutina de Hipertrofia",
        descripcion = "Nivel intermedio\nFrecuencia: 5 días por semana\nObjetivo: aumento de masa muscular",
        boton = "Iniciar rutina"
    )

    ListaItem(
        titulo = "Día 1 - Pecho y tríceps",
        detalle = "Press banca, fondos, aperturas y extensiones",
        etiqueta = "Activo"
    )

    ListaItem(
        titulo = "Día 2 - Espalda y bíceps",
        detalle = "Dominadas, remo, jalón al pecho y curl",
        etiqueta = "Pendiente"
    )

    ListaItem(
        titulo = "Día 3 - Piernas",
        detalle = "Sentadillas, prensa, extensiones y femoral",
        etiqueta = "Pendiente"
    )

    ListaItem(
        titulo = "Día 4 - Hombros y abdomen",
        detalle = "Press militar, laterales, crunch y plancha",
        etiqueta = "Pendiente"
    )
}

@Composable
fun SocioPagos() {
    SeccionTitulo(
        titulo = "Pagos e historial",
        subtitulo = "Consulta tus pagos registrados y vencimientos"
    )

    InfoCard(
        icono = "▤",
        titulo = "Próximo pago",
        dato = "30 May 2026",
        descripcion = "Mensualidad activa",
        colorDato = Rojo,
        boton = "Pagar"
    )

    ListaItem(
        titulo = "Pago mensual - Mayo",
        detalle = "Registrado el 30 Abr 2026",
        etiqueta = "Pagado"
    )

    ListaItem(
        titulo = "Pago mensual - Abril",
        detalle = "Registrado el 30 Mar 2026",
        etiqueta = "Pagado"
    )

    ListaItem(
        titulo = "Pago mensual - Marzo",
        detalle = "Registrado el 28 Feb 2026",
        etiqueta = "Pagado"
    )
}

@Composable
fun SocioPerfil(
    usuario: String
) {
    SeccionTitulo(
        titulo = "Mi Perfil",
        subtitulo = "Información general del socio"
    )

    ListaItem(
        titulo = "Usuario",
        detalle = usuario,
        etiqueta = "Socio"
    )

    ListaItem(
        titulo = "Tipo de membresía",
        detalle = "Mensual",
        etiqueta = "Activa"
    )

    ListaItem(
        titulo = "Entrenador asignado",
        detalle = "Carlos Mendoza",
        etiqueta = "Activo"
    )

    ListaItem(
        titulo = "Objetivo físico",
        detalle = "Hipertrofia y mejora de condición física",
        etiqueta = "Plan"
    )

    ListaItem(
        titulo = "Última evaluación",
        detalle = "28 Abr 2026",
        etiqueta = "Actualizada"
    )
}