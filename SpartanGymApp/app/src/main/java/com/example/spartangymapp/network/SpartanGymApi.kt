package com.example.spartangymapp.network

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface SpartanGymApi {

    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<AuthResponse>

    @POST("api/auth/forgot-password")
    suspend fun solicitarRestablecimiento(
        @Body request: PasswordRecoveryRequest
    ): Response<MessageResponse>

    @GET("api/dashboard/inicio/{socioId}")
    suspend fun obtenerDashboardSocio(
        @Path("socioId") socioId: String
    ): Response<DashboardResponse>

    @GET("api/operacion/me")
    suspend fun obtenerPerfilActual(): Response<PerfilActualResponse>

    @GET("api/operacion/pagos/socio/{socioId}")
    suspend fun obtenerPagosSocio(
        @Path("socioId") socioId: String
    ): Response<List<PagoSocioResponse>>

    @GET("api/operacion/socio/{socioId}/rutinas")
    suspend fun obtenerRutinasSocio(
        @Path("socioId") socioId: String
    ): Response<List<RutinaResumenResponse>>

    @GET("api/progreso/socio/{socioId}")
    suspend fun obtenerProgresoSocio(
        @Path("socioId") socioId: String
    ): Response<List<ControlBiometricoResponse>>

    @POST("api/progreso")
    suspend fun registrarProgreso(
        @Body request: RegistroProgresoRequest
    ): Response<ControlBiometricoResponse>

    @POST("api/pagos/mi-membresia")
    suspend fun renovarMiMembresia(
        @Body request: CompraMembresiaAppRequest
    ): Response<FacturaMembresiaAppResponse>

    @POST("api/ventas/productos/mi-compra")
    suspend fun comprarProducto(
        @Body request: CompraProductoAppRequest
    ): Response<FacturaVentaAppResponse>

    @GET("api/configuracion")
    suspend fun obtenerConfiguracion(): Response<AppConfigResponse>

    @GET("api/asistencias/qr-activo")
    suspend fun obtenerQrAsistencia(): Response<AsistenciaQrTokenResponse>

    @POST("api/asistencia/check-in-qr-web")
    suspend fun validarQrWeb(
        @Body request: AsistenciaQrRequest
    ): Response<AsistenciaQrValidationResponse>

    @GET("api/membresias/tipos")
    suspend fun listarTiposMembresia(): Response<List<TipoMembresiaResponse>>

    @GET("api/inventario/catalogo")
    suspend fun listarProductosCatalogo(): Response<List<ProductoCatalogoResponse>>

    @GET("api/operacion/notificaciones")
    suspend fun obtenerNotificaciones(): Response<List<NotificacionResponse>>

    @GET("api/operacion/entrenador/dashboard")
    suspend fun obtenerDashboardEntrenador(): Response<EntrenadorDashboardResponse>

    @GET("api/operacion/entrenador/clientes")
    suspend fun obtenerClientesEntrenador(): Response<List<EntrenadorClienteResponse>>

    @GET("api/operacion/entrenador/perfil")
    suspend fun obtenerPerfilEntrenador(): Response<EntrenadorPerfilResponse>

    @GET("api/socios")
    suspend fun listarSocios(): Response<List<SocioResumenResponse>>

    @GET("api/catalogo/ejercicios")
    suspend fun listarEjercicios(): Response<List<EjercicioCatalogoResponse>>

    @POST("api/rutinas")
    suspend fun crearRutina(
        @Body request: RutinaRequest
    ): Response<ResponseBody>
}
