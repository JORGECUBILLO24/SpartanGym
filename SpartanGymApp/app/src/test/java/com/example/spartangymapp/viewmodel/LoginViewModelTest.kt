package com.example.spartangymapp.viewmodel

import com.example.spartangymapp.network.AuthResponse
import com.example.spartangymapp.network.RetrofitClient
import com.example.spartangymapp.network.SpartanGymApi
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import io.mockk.coVerify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    private lateinit var viewModel: LoginViewModel
    private val apiService = mockk<SpartanGymApi>()
    private val testDispatcher = UnconfinedTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        mockkObject(RetrofitClient)
        every { RetrofitClient.apiService } returns apiService
        viewModel = LoginViewModel()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        unmockkAll()
    }

    @Test
    fun `iniciarSesion successful updates state`() {
        val email = "test@test.com"
        val response = AuthResponse(token = "abc", email = email, rol = "SOCIO")
        coEvery { apiService.login(any()) } returns Response.success(response)

        viewModel.iniciarSesion(email, "password", "SOCIO")

        assertTrue(viewModel.loginSuccess)
        assertEquals(email, viewModel.userEmail)
        assertEquals("SOCIO", viewModel.userRole)
        assertFalse(viewModel.isLoading)
    }

    @Test
    fun `iniciarSesion failure sets error message`() {
        coEvery { apiService.login(any()) } returns Response.error(401, mockk(relaxed = true))

        viewModel.iniciarSesion("error@test.com", "wrong", "SOCIO")

        assertFalse(viewModel.loginSuccess)
        assertEquals("Credenciales incorrectas.", viewModel.errorMessage)
    }

    @Test
    fun `crearCuenta as SOCIO calls registrarSocio`() {
        coEvery { apiService.registrarSocio(any()) } returns Response.success(AuthResponse())

        viewModel.crearCuenta("Juan", "juan@test.com", "123456", "SOCIO")

        assertTrue(viewModel.registerSuccess)
        coVerify { apiService.registrarSocio(any()) }
    }

    @Test
    fun `crearCuenta as ENTRENADOR calls registrarEntrenador`() {
        coEvery { apiService.registrarEntrenador(any()) } returns Response.success(AuthResponse())

        viewModel.crearCuenta("Juan", "juan@test.com", "123456", "ENTRENADOR")

        assertTrue(viewModel.registerSuccess)
        coVerify { apiService.registrarEntrenador(any()) }
    }

    @Test
    fun `limpiarEstado resets success flags`() {
        viewModel.loginSuccess = true
        viewModel.registerSuccess = true
        
        viewModel.limpiarEstado()

        assertFalse(viewModel.loginSuccess)
        assertFalse(viewModel.registerSuccess)
    }
}
