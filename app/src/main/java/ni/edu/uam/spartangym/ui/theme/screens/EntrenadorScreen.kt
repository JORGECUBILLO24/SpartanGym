package ni.edu.uam.spartangym.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import ni.edu.uam.spartangym.ui.components.BottomMenuEntrenador
import ni.edu.uam.spartangym.ui.components.CardGrande
import ni.edu.uam.spartangym.ui.components.FondoSpartan
import ni.edu.uam.spartangym.ui.components.HeaderConNotificacion
import ni.edu.uam.spartangym.ui.components.InfoCard
import ni.edu.uam.spartangym.ui.components.ListaItem
import ni.edu.uam.spartangym.ui.components.MiniCard
import ni.edu.uam.spartangym.ui.components.SeccionTitulo
import ni.edu.uam.spartangym.ui.theme.Blanco
import ni.edu.uam.spartangym.ui.theme.Fondo
import ni.edu.uam.spartangym.ui.theme.Rojo

@Composable
fun EntrenadorScreen(
    usuario: String = "Entrenador",
    onCerrarSesion: () -> Unit = {}
) {
    var seccionActual by rememberSaveable {
        mutableStateOf(0)
    }

    Scaffold(
        containerColor = Fondo,
        bottomBar = {
            BottomMenuEntrenador(
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
                    rol = "Entrenador",
                    onCerrarSesion = onCerrarSesion
                )

                Spacer(modifier = Modifier.height(22.dp))

                when (seccionActual) {
                    0 -> EntrenadorInicio()
                    1 -> EntrenadorClientes()
                    2 -> EntrenadorRutinas()
                    3 -> EntrenadorPerfil(usuario = usuario)
                }

                Spacer(modifier = Modifier.height(paddingValues.calculateBottomPadding()))
            }
        }
    }
}

@Composable
fun EntrenadorInicio() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        MiniCard(
            icono = "☷",
            titulo = "Clientes",
            dato = "18",
            modifier = Modifier.weight(1f)
        )

        MiniCard(
            icono = "▤",
            titulo = "Evaluaciones",
            dato = "5",
            modifier = Modifier.weight(1f)
        )

        MiniCard(
            icono = "▣",
            titulo = "Rutinas",
            dato = "24",
            modifier = Modifier.weight(1f)
        )
    }

    Spacer(modifier = Modifier.height(18.dp))

    ProximasSesionesLocal()

    CardGrande(
        icono = "▣",
        titulo = "Gestión de rutinas",
        descripcion = "Crea, edita y asigna planes de entrenamiento personalizados para tus clientes.",
        boton = "Ver rutinas"
    )

    CardGrande(
        icono = "▤",
        titulo = "Evaluaciones físicas",
        descripcion = "Registra y da seguimiento al peso, IMC y medidas corporales de tus clientes.",
        boton = "Ver evaluaciones"
    )

    InfoCard(
        icono = "📈",
        titulo = "Asistencias de hoy",
        dato = "12 asistencias",
        descripcion = "registradas durante el día",
        colorDato = Blanco,
        boton = "Ver más"
    )
}

@Composable
fun ProximasSesionesLocal() {
    SeccionTitulo(
        titulo = "Próximas sesiones",
        subtitulo = "Clientes programados para hoy"
    )

    ListaItem(
        titulo = "Ana López",
        detalle = "Sesión programada a las 9:00 a. m.",
        etiqueta = "Hoy"
    )

    ListaItem(
        titulo = "Carlos Ruiz",
        detalle = "Sesión programada a las 11:30 a. m.",
        etiqueta = "Hoy"
    )

    ListaItem(
        titulo = "María Torres",
        detalle = "Sesión programada a las 4:00 p. m.",
        etiqueta = "Hoy"
    )
}

@Composable
fun EntrenadorClientes() {
    SeccionTitulo(
        titulo = "Clientes",
        subtitulo = "Socios asignados al entrenador"
    )

    ListaItem(
        titulo = "Ana López",
        detalle = "Objetivo: tonificación | Membresía activa",
        etiqueta = "Activa"
    )

    ListaItem(
        titulo = "Carlos Ruiz",
        detalle = "Objetivo: hipertrofia | Evaluación pendiente",
        etiqueta = "Pendiente"
    )

    ListaItem(
        titulo = "María Torres",
        detalle = "Objetivo: pérdida de grasa | Rutina activa",
        etiqueta = "Activa"
    )

    ListaItem(
        titulo = "Juan Pérez",
        detalle = "Objetivo: fuerza | Membresía activa",
        etiqueta = "Activa"
    )
}

@Composable
fun EntrenadorRutinas() {
    SeccionTitulo(
        titulo = "Rutinas",
        subtitulo = "Planes de entrenamiento creados"
    )

    CardGrande(
        icono = "＋",
        titulo = "Crear nueva rutina",
        descripcion = "Diseña una rutina personalizada según el objetivo del socio.",
        boton = "Crear rutina"
    )

    ListaItem(
        titulo = "Rutina de Hipertrofia",
        detalle = "Asignada a 8 clientes",
        etiqueta = "Activa"
    )

    ListaItem(
        titulo = "Rutina de Pérdida de Grasa",
        detalle = "Asignada a 5 clientes",
        etiqueta = "Activa"
    )

    ListaItem(
        titulo = "Rutina de Fuerza",
        detalle = "Asignada a 4 clientes",
        etiqueta = "Activa"
    )
}

@Composable
fun EntrenadorPerfil(
    usuario: String
) {
    SeccionTitulo(
        titulo = "Perfil",
        subtitulo = "Información del entrenador"
    )

    ListaItem(
        titulo = "Usuario",
        detalle = usuario,
        etiqueta = "Entrenador"
    )

    ListaItem(
        titulo = "Clientes asignados",
        detalle = "18 socios activos",
        etiqueta = "Activo"
    )

    ListaItem(
        titulo = "Rutinas creadas",
        detalle = "24 rutinas registradas",
        etiqueta = "Sistema"
    )

    ListaItem(
        titulo = "Evaluaciones pendientes",
        detalle = "5 evaluaciones físicas pendientes",
        etiqueta = "Pendiente"
    )
}