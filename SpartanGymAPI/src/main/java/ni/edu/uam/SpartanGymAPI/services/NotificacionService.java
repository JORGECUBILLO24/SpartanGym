package ni.edu.uam.SpartanGymAPI.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final JavaMailSender mailSender;

    // Toma el correo emisor del application.properties
    @Value("${spring.mail.username}")
    private String correoEmisor;

    /**
     * @Async hace que el correo se envíe en segundo plano.
     * Así el usuario no tiene que esperar en la pantalla de carga.
     */
    @Async
    public void enviarCorreoVencimiento(String correoDestino, String nombreSocio) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(correoEmisor);
            mensaje.setTo(correoDestino);
            mensaje.setSubject("¡Tu membresía en SpartanGym ha vencido!");
            mensaje.setText("Hola " + nombreSocio + ",\n\n" +
                    "Te informamos que tu membresía ha expirado y tu acceso ha sido suspendido temporalmente.\n" +
                    "Por favor, acércate a recepción para renovarla y seguir entrenando como un verdadero espartano.\n\n" +
                    "Atentamente,\nEl equipo de SpartanGym");

            mailSender.send(mensaje);
            log.info("Correo de vencimiento enviado exitosamente a: {}", correoDestino);

        } catch (Exception e) {
            log.error("Error al enviar el correo a {}: {}", correoDestino, e.getMessage());
        }
    }

    @Async
    public void enviarCorreoBienvenida(String correoDestino, String nombreSocio) {
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(correoEmisor);
            mensaje.setTo(correoDestino);
            mensaje.setSubject("¡Bienvenido a SpartanGym!");
            mensaje.setText("Hola " + nombreSocio + ",\n\n" +
                    "Es un honor tenerte en nuestras filas. Tu cuenta ha sido creada exitosamente.\n" +
                    "No olvides pasar por recepción para adquirir tu membresía y comenzar a sudar.\n\n" +
                    "¡Auu, auu, auu!\nEl equipo de SpartanGym");

            mailSender.send(mensaje);
            log.info("Correo de bienvenida enviado exitosamente a: {}", correoDestino);

        } catch (Exception e) {
            log.error("Error al enviar el correo de bienvenida a {}: {}", correoDestino, e.getMessage());
        }
    }
}