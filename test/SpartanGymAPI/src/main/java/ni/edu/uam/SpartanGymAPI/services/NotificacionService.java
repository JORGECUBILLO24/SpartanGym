package ni.edu.uam.SpartanGymAPI.services;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ni.edu.uam.SpartanGymAPI.models.Notificacion;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.NotificacionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final JavaMailSender mailSender;
    private final NotificacionRepository notificacionRepository;

    // Toma el correo emisor del application.properties
    @Value("${spring.mail.username}")
    private String correoEmisor;

    /**
     * @Async hace que el correo se envíe en segundo plano.
     * Así el usuario no tiene que esperar en la pantalla de carga.
     */
    public void registrarNotificacion(Usuario usuario, String tipo, String titulo, String mensaje) {
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(usuario);
        notificacion.setTipo(tipo);
        notificacion.setTitulo(titulo);
        notificacion.setMensaje(mensaje);
        notificacionRepository.save(notificacion);
    }

    @Async
    public void enviarCorreoVencimiento(String correoDestino, String nombreSocio) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mensaje,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(correoEmisor);
            helper.setTo(correoDestino);
            helper.setSubject("Tu membresía en Spartan Gym ha vencido");
            helper.setText(construirCorreoVencimientoHtml(nombreSocio), true);

            mailSender.send(mensaje);
            log.info("Correo HTML de vencimiento enviado exitosamente a: {}", correoDestino);

        } catch (Exception e) {
            log.error("Error al enviar el correo a {}: {}", correoDestino, e.getMessage());
        }
    }

    @Async
    public void enviarCorreoBienvenida(String correoDestino, String nombreSocio) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mensaje,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            helper.setFrom(correoEmisor);
            helper.setTo(correoDestino);
            helper.setSubject("Bienvenido a Spartan Gym — cuenta creada");
            helper.setText(construirCorreoBienvenidaHtml(nombreSocio), true);

            mailSender.send(mensaje);
            log.info("Correo HTML de bienvenida enviado exitosamente a: {}", correoDestino);

        } catch (Exception e) {
            log.error("Error al enviar el correo de bienvenida a {}: {}", correoDestino, e.getMessage());
        }
    }

    private String construirCorreoBienvenidaHtml(String nombreSocio) {
        String nombreSeguro = escapeHtml(nombreSocio == null || nombreSocio.isBlank() ? "Atleta" : nombreSocio);

        return """
                <!doctype html>
                <html lang=\"es\">
                <head>
                  <meta charset=\"UTF-8\" />
                  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
                  <title>Bienvenido a Spartan Gym</title>
                </head>
                <body style=\"margin:0;padding:0;background:#050505;color:#ffffff;font-family:Arial,Helvetica,sans-serif;\">
                  <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#050505;padding:32px 12px;\">
                    <tr>
                      <td align=\"center\">
                        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;background:#0d0d0f;border:1px solid #2a0b0b;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.55);\">
                          <tr>
                            <td style=\"padding:0;background:linear-gradient(135deg,#151515 0%,#050505 48%,#310606 100%);\">
                              <div style=\"padding:30px 30px 26px;border-bottom:1px solid rgba(255,255,255,.08);\">
                                <div style=\"font-size:12px;line-height:1;letter-spacing:4px;text-transform:uppercase;color:#f87171;font-weight:800;margin-bottom:16px;\">Spartan Gym</div>
                                <h1 style=\"margin:0;font-size:32px;line-height:1.05;color:#fff;font-weight:900;text-transform:uppercase;\">Bienvenido a la legión</h1>
                                <p style=\"margin:14px 0 0;color:#d4d4d8;font-size:15px;line-height:1.65;\">Hola <strong style=\"color:#ffffff;\">%s</strong>, tu cuenta fue creada correctamente. Desde hoy formas parte de una comunidad enfocada en disciplina, fuerza y progreso.</p>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style=\"padding:28px 30px 8px;\">
                              <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">
                                <tr>
                                  <td style=\"padding:16px;background:#141416;border:1px solid rgba(255,255,255,.08);border-radius:16px;\">
                                    <p style=\"margin:0 0 10px;color:#ffffff;font-size:16px;font-weight:800;\">Siguiente paso</p>
                                    <p style=\"margin:0;color:#a1a1aa;font-size:14px;line-height:1.6;\">Pasa por recepción para activar o renovar tu membresía. Al completar el pago, tu acceso quedará habilitado para entrenar como un verdadero espartano.</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style=\"padding:14px 30px 28px;\">
                              <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">
                                <tr>
                                  <td style=\"padding:14px 0;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);\">
                                    <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">
                                      <tr>
                                        <td style=\"width:33%;padding:8px;color:#ef4444;font-size:22px;font-weight:900;text-align:center;\">Fuerza</td>
                                        <td style=\"width:33%;padding:8px;color:#ef4444;font-size:22px;font-weight:900;text-align:center;\">Honor</td>
                                        <td style=\"width:33%;padding:8px;color:#ef4444;font-size:22px;font-weight:900;text-align:center;\">Constancia</td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              <p style=\"margin:24px 0 0;color:#d4d4d8;font-size:14px;line-height:1.7;\">Prepara tus metas. Nosotros nos encargamos de darte el espacio, el control y la motivación para superarlas.</p>
                              <p style=\"margin:24px 0 0;color:#ffffff;font-size:15px;font-weight:800;\">¡Auu, auu, auu!<br/><span style=\"color:#ef4444;\">El equipo de Spartan Gym</span></p>
                            </td>
                          </tr>
                          <tr>
                            <td style=\"padding:18px 30px;background:#080808;border-top:1px solid rgba(255,255,255,.08);\">
                              <p style=\"margin:0;color:#71717a;font-size:11px;line-height:1.5;text-align:center;\">Este mensaje fue generado automáticamente por Spartan Gym. Si no creaste esta cuenta, contacta con recepción.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(nombreSeguro);
    }

    private String construirCorreoVencimientoHtml(String nombreSocio) {
        String nombreSeguro = escapeHtml(nombreSocio == null || nombreSocio.isBlank() ? "Atleta" : nombreSocio);

        return """
                <!doctype html>
                <html lang="es">
                <body style="margin:0;padding:0;background:#050505;color:#fff;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:32px 12px;">
                    <tr><td align="center">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#0d0d0f;border:1px solid #3f1111;border-radius:22px;overflow:hidden;">
                        <tr><td style="padding:30px;background:linear-gradient(135deg,#151515,#3b0505);">
                          <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#f87171;font-weight:800;margin-bottom:16px;">Spartan Gym</div>
                          <h1 style="margin:0;font-size:30px;line-height:1.1;color:#fff;text-transform:uppercase;">Membresía vencida</h1>
                          <p style="margin:14px 0 0;color:#e5e7eb;font-size:15px;line-height:1.65;">Hola <strong>%s</strong>, tu membresía expiró y tu acceso queda suspendido temporalmente hasta que completes la renovación.</p>
                        </td></tr>
                        <tr><td style="padding:28px 30px;">
                          <div style="padding:16px;background:#141416;border:1px solid rgba(255,255,255,.08);border-radius:16px;">
                            <p style="margin:0 0 10px;color:#fff;font-size:16px;font-weight:800;">¿Qué hacer ahora?</p>
                            <p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.6;">Acércate a recepción para renovar tu plan y seguir entrenando sin interrupciones.</p>
                          </div>
                          <p style="margin:24px 0 0;color:#fff;font-size:15px;font-weight:800;">El equipo de Spartan Gym</p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(nombreSeguro);
    }

    private String escapeHtml(String valor) {
        return valor
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
