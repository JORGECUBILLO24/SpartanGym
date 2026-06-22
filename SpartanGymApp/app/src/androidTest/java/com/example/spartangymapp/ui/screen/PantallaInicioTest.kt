package com.example.spartangymapp.ui.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.example.spartangymapp.ui.theme.SpartanGymAppTheme
import org.junit.Rule
import org.junit.Test

class PantallaInicioTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun loginScreen_initialState_isCorrect() {
        composeTestRule.setContent {
            SpartanGymAppTheme {
                PantallaInicio(onLoginSuccess = { _, _ -> })
            }
        }

        // Check if "INICIAR SESIÓN" header is displayed
        composeTestRule.onNodeWithText("INICIAR SESIÓN").assertIsDisplayed()

        // Check if basic fields are present
        composeTestRule.onNodeWithText("Correo o usuario").assertIsDisplayed()
        composeTestRule.onNodeWithText("Contraseña").assertIsDisplayed()
        
        // Check if "ENTRAR" button is present
        composeTestRule.onNodeWithText("ENTRAR").assertIsDisplayed()
    }

    @Test
    fun loginScreen_toggleToRegister_updatesUI() {
        composeTestRule.setContent {
            SpartanGymAppTheme {
                PantallaInicio(onLoginSuccess = { _, _ -> })
            }
        }

        // Click on "Crea una" text to switch to register mode
        composeTestRule.onNodeWithText("¿No tienes cuenta? Crea una").performClick()

        // Check if "CREAR CUENTA" header is displayed
        composeTestRule.onNodeWithText("CREAR CUENTA").assertIsDisplayed()

        // Check if "Nombre completo" field appeared
        composeTestRule.onNodeWithText("Nombre completo").assertIsDisplayed()

        // Check if button text changed
        composeTestRule.onNodeWithText("CREAR CUENTA", useUnmergedTree = true).assertIsDisplayed()
    }

    @Test
    fun loginScreen_inputData_works() {
        composeTestRule.setContent {
            SpartanGymAppTheme {
                PantallaInicio(onLoginSuccess = { _, _ -> })
            }
        }

        val testEmail = "test@user.com"
        
        // Find email field by its placeholder text (using substring as it's an OutlinedTextField)
        composeTestRule.onNodeWithText("Ingresa tu correo o usuario").performTextInput(testEmail)
        
        // Verify text was entered (this checks the value attribute of the field)
        composeTestRule.onNodeWithText(testEmail).assertExists()
    }
}
