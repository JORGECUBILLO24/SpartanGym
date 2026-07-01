package com.example.spartangymapp.network

data class LoginRequest(
    val email: String,
    val password: String
)

data class PasswordRecoveryRequest(
    val email: String
)

data class MessageResponse(
    val mensaje: String? = null
)

data class AuthResponse(
    val id: String? = null,
    val token: String? = null,
    val email: String? = null,
    val rol: String? = null,
    val message: String? = null
)

data class DashboardResponse(
    val nombreCompleto: String? = null,
    val estadoAcceso: String? = null,
    val tipoMembresia: String? = null,
    val fechaVencimiento: String? = null,
    val ultimoPesoKg: Double? = null,
    val notasMedidas: String? = null,
    val objetivoRutina: String? = null,
    val nombreEntrenador: String? = null,
    val totalEjercicios: Int? = null
)

data class PerfilActualResponse(
    val id: String? = null,
    val email: String? = null,
    val rol: String? = null,
    val activo: Boolean? = null,
    val nombres: String? = null,
    val apellidos: String? = null,
    val telefono: String? = null,
    val estadoAcceso: String? = null,
    val tipo: String? = null,
    val especialidad: String? = null,
    val sucursalId: String? = null,
    val sucursal: String? = null
)

data class AppConfigResponse(
    val gymName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val currency: String? = null,
    val taxRate: String? = null,
    val theme: String? = null,
    val themeSource: String? = null,
    val accentColor: String? = null,
    val accentHoverColor: String? = null,
    val accentSoftColor: String? = null,
    val logoPrincipal: String? = null,
    val logoAcceso: String? = null,
    val fondoLogin: String? = null,
    val emailAlerts: Boolean? = null,
    val smsAlerts: Boolean? = null,
    val dailyReports: Boolean? = null,
    val twoFactor: Boolean? = null,
    val sessionTimeout: String? = null
)

data class AsistenciaQrTokenResponse(
    val token: String? = null,
    val sessionId: String? = null,
    val socioId: String? = null,
    val socio: String? = null,
    val generadoEn: String? = null,
    val expiraEn: String? = null,
    val ttlSegundos: Long? = null
)

data class AsistenciaQrRequest(
    val token: String
)

data class AsistenciaQrValidationResponse(
    val id: String? = null,
    val sessionId: String? = null,
    val socioId: String? = null,
    val socio: String? = null,
    val membresia: String? = null,
    val tipoMembresia: String? = null,
    val estadoAcceso: String? = null,
    val fechaVencimiento: String? = null,
    val estado: String? = null,
    val fechaHora: String? = null,
    val mensaje: String? = null
)

data class TipoMembresiaResponse(
    val id: Int? = null,
    val nombre: String? = null,
    val duracionDias: Int? = null,
    val precio: Double? = null
)

data class ProductoCatalogoResponse(
    val id: String? = null,
    val nombre: String? = null,
    val categoria: String? = null,
    val precio: Double? = null,
    val stock: Int? = null,
    val imagenUrl: String? = null,
    val sucursalId: String? = null,
    val sucursal: String? = null
)

data class ControlBiometricoResponse(
    val id: String? = null,
    val fechaRegistro: String? = null,
    val pesoKg: Double? = null,
    val medidasNotas: String? = null
)

data class RegistroProgresoRequest(
    val idSocio: String,
    val pesoKg: Double,
    val medidasNotas: String? = null
)

data class CompraMembresiaAppRequest(
    val tipoMembresiaId: Int,
    val metodoPago: String
)

data class FacturaMembresiaAppResponse(
    val numeroFactura: String? = null,
    val socio: String? = null,
    val tipoMembresia: String? = null,
    val subtotal: Double? = null,
    val impuesto: Double? = null,
    val total: Double? = null,
    val metodoPago: String? = null,
    val fechaInicio: String? = null,
    val fechaVencimiento: String? = null
)

data class CompraProductoAppRequest(
    val productoId: String,
    val cantidad: Int
)

data class FacturaVentaAppResponse(
    val numeroFactura: String? = null,
    val total: Double? = null,
    val sucursal: String? = null,
    val metodoPago: String? = null
)

data class NotificacionResponse(
    val id: String? = null,
    val tipo: String? = null,
    val titulo: String? = null,
    val mensaje: String? = null,
    val leida: Boolean? = null,
    val fechaCreacion: String? = null
)

data class EjercicioRutinaResponse(
    val ejercicioId: Long? = null,
    val ejercicio: String? = null,
    val grupoMuscular: String? = null,
    val grupoMuscularId: Int? = null,
    val tipoEjercicio: String? = null,
    val diaProgramado: String? = null,
    val series: Int? = null,
    val repeticiones: Int? = null,
    val pesoSugeridoKg: Double? = null,
    val tiempoDescansoSegundos: Int? = null,
    val notas: String? = null,
    val orden: Int? = null
)

data class RutinaResumenResponse(
    val id: String? = null,
    val socioId: String? = null,
    val socio: String? = null,
    val entrenador: String? = null,
    val fechaAsignacion: String? = null,
    val nombre: String? = null,
    val tipoRutina: String? = null,
    val generoObjetivo: String? = null,
    val esGlobal: Boolean? = null,
    val fechaInicio: String? = null,
    val fechaFin: String? = null,
    val objetivo: String? = null,
    val notas: String? = null,
    val ejercicios: List<EjercicioRutinaResponse>? = emptyList()
)

data class SocioResumenResponse(
    val id: String? = null,
    val nombres: String? = null,
    val apellidos: String? = null,
    val email: String? = null,
    val telefono: String? = null,
    val estadoAcceso: String? = null,
    val tipoMembresia: String? = null,
    val sucursalId: String? = null,
    val sucursal: String? = null
)

data class GrupoMuscularResponse(
    val id: Int? = null,
    val nombre: String? = null
)

data class EjercicioCatalogoResponse(
    val id: Long? = null,
    val nombre: String? = null,
    val grupoMuscular: GrupoMuscularResponse? = null
)

data class RutinaDetalleRequest(
    val idEjercicio: Long,
    val series: Int,
    val repeticiones: Int,
    val tipoEjercicio: String,
    val diaProgramado: String? = null,
    val pesoSugeridoKg: Double? = null,
    val tiempoDescansoSegundos: Int? = null,
    val notas: String? = null,
    val orden: Int
)

data class RutinaRequest(
    val idSocio: String? = null,
    val idEntrenador: String,
    val esGlobal: Boolean = false,
    val nombre: String,
    val tipoRutina: String,
    val generoObjetivo: String,
    val fechaInicio: String? = null,
    val fechaFin: String? = null,
    val objetivo: String,
    val notas: String? = null,
    val detalles: List<RutinaDetalleRequest>
)

data class EntrenadorDashboardResponse(
    val clientesAsignados: Int? = null,
    val rutinasCreadas: Int? = null,
    val evaluacionesPendientes: Int? = null,
    val rutinasRecientes: List<RutinaResumenResponse>? = emptyList()
)

data class EntrenadorClienteResponse(
    val id: String? = null,
    val nombres: String? = null,
    val apellidos: String? = null,
    val telefono: String? = null,
    val estadoAcceso: String? = null,
    val email: String? = null
)

data class EntrenadorPerfilResponse(
    val id: String? = null,
    val email: String? = null,
    val rol: String? = null,
    val activo: Boolean? = null,
    val nombres: String? = null,
    val apellidos: String? = null,
    val telefono: String? = null,
    val especialidad: String? = null,
    val rutinasCreadas: Int? = null,
    val sucursalId: String? = null,
    val sucursal: String? = null
)

data class PagoSocioResponse(
    val id: String? = null,
    val socioId: String? = null,
    val socio: String? = null,
    val monto: Double? = null,
    val metodoPago: String? = null,
    val fechaTransaccion: String? = null
)
