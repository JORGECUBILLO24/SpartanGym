package ni.edu.uam.SpartanGymAPI.services;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ni.edu.uam.SpartanGymAPI.models.Notificacion;
import ni.edu.uam.SpartanGymAPI.models.Usuario;
import ni.edu.uam.SpartanGymAPI.repositories.NotificacionRepository;
import ni.edu.uam.SpartanGymAPI.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private static final String LOGO_CID = "spartan-logo";

    private final JavaMailSender mailSender;
    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ConfiguracionAppService configuracionAppService;

    @Value("${spring.mail.username:}")
    private String correoEmisor;

    public Notificacion registrarNotificacion(Usuario usuario, String tipo, String titulo, String mensaje) {
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(usuario);
        notificacion.setTipo(tipo);
        notificacion.setTitulo(titulo);
        notificacion.setMensaje(mensaje);
        return notificacionRepository.save(notificacion);
    }

    @Async
    public void enviarCorreoVencimiento(String correoDestino, String nombreSocio) {
        if (!correoDisponible(correoDestino)) {
            return;
        }

        try {
            EmailBrand marca = obtenerMarcaCorreo(null);
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = crearHelper(mensaje);

            helper.setFrom(correoEmisor);
            helper.setTo(correoDestino);
            helper.setSubject("Tu membresia en Spartan Gym ha vencido");
            helper.setText(construirCorreoVencimientoHtml(nombreSocio, marca), true);
            adjuntarLogoInline(helper, marca);

            mailSender.send(mensaje);
            log.info("Correo HTML de vencimiento enviado exitosamente a: {}", correoDestino);
        } catch (Exception e) {
            log.error("Error al enviar el correo a {}: {}", correoDestino, e.getMessage());
        }
    }

    @Async
    public void enviarCorreoBienvenida(String correoDestino, String nombreSocio) {
        if (!correoDisponible(correoDestino)) {
            return;
        }

        try {
            EmailBrand marca = obtenerMarcaCorreo(null);
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = crearHelper(mensaje);

            helper.setFrom(correoEmisor);
            helper.setTo(correoDestino);
            helper.setSubject("Bienvenido a Spartan Gym - cuenta creada");
            helper.setText(construirCorreoBienvenidaHtml(nombreSocio, marca), true);
            adjuntarLogoInline(helper, marca);

            mailSender.send(mensaje);
            log.info("Correo HTML de bienvenida enviado exitosamente a: {}", correoDestino);
        } catch (Exception e) {
            log.error("Error al enviar el correo de bienvenida a {}: {}", correoDestino, e.getMessage());
        }
    }

    @Async
    public void enviarCorreoRutinaAsignada(
            String correoDestino,
            String nombreSocio,
            String nombreRutina,
            String objetivo,
            String entrenador,
            int totalEjercicios,
            String fechaInicio,
            String fechaFin,
            boolean global
    ) {
        if (!correoDisponible(correoDestino)) {
            return;
        }

        try {
            EmailBrand marca = obtenerMarcaCorreo(null);
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = crearHelper(mensaje);

            helper.setFrom(correoEmisor);
            helper.setTo(correoDestino);
            helper.setSubject("Nueva rutina agregada en Spartan Gym");
            helper.setText(
                    construirCorreoRutinaAsignadaHtml(
                            nombreSocio,
                            nombreRutina,
                            objetivo,
                            entrenador,
                            totalEjercicios,
                            fechaInicio,
                            fechaFin,
                            global,
                            marca
                    ),
                    true
            );
            adjuntarLogoInline(helper, marca);

            mailSender.send(mensaje);
            log.info("Correo de rutina asignada enviado exitosamente a: {}", correoDestino);
        } catch (Exception e) {
            log.error("Error al enviar correo de rutina asignada a {}: {}", correoDestino, e.getMessage());
        }
    }

    @Async
    public void enviarCorreoRecuperacionPassword(String correoDestino, String nombreUsuario, String enlace, long minutosValidez) {
        if (!correoDisponible(correoDestino)) {
            log.warn("MAIL_USERNAME no configurado. Enlace de recuperacion para {}: {}", correoDestino, enlace);
            return;
        }

        try {
            EmailBrand marca = obtenerMarcaCorreo(null);
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = crearHelper(mensaje);

            helper.setFrom(correoEmisor);
            helper.setTo(correoDestino);
            helper.setSubject("Restablece tu contraseña de Spartan Gym");
            helper.setText(construirCorreoRecuperacionPasswordHtml(nombreUsuario, enlace, minutosValidez, marca), true);
            adjuntarLogoInline(helper, marca);

            mailSender.send(mensaje);
            log.info("Correo de recuperacion enviado exitosamente a: {}", correoDestino);
        } catch (Exception e) {
            log.error("Error al enviar recuperacion de contraseña a {}: {}", correoDestino, e.getMessage());
            log.warn("Enlace de recuperacion para {}: {}", correoDestino, enlace);
        }
    }

    @Async
    public void enviarCorreoGlobal(String tipo, String titulo, String cuerpo) {
        if (correoEmisor == null || correoEmisor.isBlank()) {
            log.warn("MAIL_USERNAME no configurado. No se envio el mensaje global por correo.");
            return;
        }

        List<String> correosDestino = usuarioRepository.findByActivoTrue().stream()
                .map(Usuario::getEmail)
                .filter(email -> email != null && !email.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());

        if (correosDestino.isEmpty()) {
            log.info("No hay usuarios activos con correo para el mensaje global.");
            return;
        }

        try {
            String asunto = titulo == null || titulo.isBlank()
                    ? "Aviso global de Spartan Gym"
                    : titulo.trim();
            EmailBrand marca = obtenerMarcaCorreo(null);
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = crearHelper(mensaje);

            helper.setFrom(correoEmisor);
            helper.setTo(correoEmisor);
            helper.setBcc(correosDestino.toArray(new String[0]));
            helper.setSubject(asunto);
            helper.setText(construirCorreoGlobalHtml(tipo, asunto, cuerpo, marca), true);
            adjuntarLogoInline(helper, marca);

            mailSender.send(mensaje);
            log.info("Mensaje global enviado por correo a {} usuarios activos.", correosDestino.size());
        } catch (Exception e) {
            log.error("Error al enviar mensaje global por correo: {}", e.getMessage());
        }
    }

    private MimeMessageHelper crearHelper(MimeMessage mensaje) throws Exception {
        return new MimeMessageHelper(
                mensaje,
                MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                StandardCharsets.UTF_8.name()
        );
    }

    private boolean correoDisponible(String correoDestino) {
        if (correoDestino == null || correoDestino.isBlank()) {
            log.warn("No se envio correo porque el destinatario esta vacio.");
            return false;
        }
        if (correoEmisor == null || correoEmisor.isBlank()) {
            log.warn("MAIL_USERNAME no configurado. No se pudo enviar correo a {}.", correoDestino);
            return false;
        }
        return true;
    }

    private String construirCorreoBienvenidaHtml(String nombreSocio, EmailBrand marca) {
        String nombreSeguro = escapeHtml(nombreSocio == null || nombreSocio.isBlank() ? "Atleta" : nombreSocio);
        String intro = "Hola <strong style=\"color:#ffffff;\">" + nombreSeguro + "</strong>, tu cuenta fue creada correctamente. Desde hoy formas parte de una comunidad enfocada en disciplina, fuerza y progreso.";
        String contenido = """
                <tr>
                  <td style="padding:28px 30px 8px;">
                    <div style="padding:16px;background:#141416;border:1px solid rgba(255,255,255,.08);border-radius:16px;">
                      <p style="margin:0 0 10px;color:#ffffff;font-size:16px;font-weight:800;">Siguiente paso</p>
                      <p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.6;">Pasa por recepcion para activar o renovar tu membresia. Al completar el pago, tu acceso quedara habilitado para entrenar.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 30px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:14px 0;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width:33%;padding:8px;color:#ef4444;font-size:22px;font-weight:900;text-align:center;">Fuerza</td>
                              <td style="width:33%;padding:8px;color:#ef4444;font-size:22px;font-weight:900;text-align:center;">Honor</td>
                              <td style="width:33%;padding:8px;color:#ef4444;font-size:22px;font-weight:900;text-align:center;">Constancia</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:24px 0 0;color:#d4d4d8;font-size:14px;line-height:1.7;">Prepara tus metas. Nosotros nos encargamos de darte el espacio, el control y la motivacion para superarlas.</p>
                    <p style="margin:24px 0 0;color:#ffffff;font-size:15px;font-weight:800;">El equipo de Spartan Gym</p>
                  </td>
                </tr>
                """;

        return construirTarjetaCorreoHtml("Bienvenido a la legion", intro, contenido, marca);
    }

    private String construirCorreoVencimientoHtml(String nombreSocio, EmailBrand marca) {
        String nombreSeguro = escapeHtml(nombreSocio == null || nombreSocio.isBlank() ? "Atleta" : nombreSocio);
        String intro = "Hola <strong style=\"color:#ffffff;\">" + nombreSeguro + "</strong>, tu membresia expiro y tu acceso queda suspendido temporalmente hasta que completes la renovacion.";
        String contenido = """
                <tr>
                  <td style="padding:28px 30px;">
                    <div style="padding:16px;background:#141416;border:1px solid rgba(255,255,255,.08);border-radius:16px;">
                      <p style="margin:0 0 10px;color:#fff;font-size:16px;font-weight:800;">Que hacer ahora</p>
                      <p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.6;">Acercate a recepcion para renovar tu plan y seguir entrenando sin interrupciones.</p>
                    </div>
                    <p style="margin:24px 0 0;color:#fff;font-size:15px;font-weight:800;">El equipo de Spartan Gym</p>
                  </td>
                </tr>
                """;

        return construirTarjetaCorreoHtml("Membresia vencida", intro, contenido, marca);
    }

    private String construirCorreoRecuperacionPasswordHtml(String nombreUsuario, String enlace, long minutosValidez, EmailBrand marca) {
        String nombreSeguro = escapeHtml(nombreUsuario == null || nombreUsuario.isBlank() ? "Spartan" : nombreUsuario);
        String enlaceSeguro = escapeHtml(enlace);
        String intro = "Hola <strong style=\"color:#ffffff;\">" + nombreSeguro + "</strong>, recibimos una solicitud para cambiar la contraseña de tu cuenta.";
        String contenido = """
                <tr>
                  <td style="padding:28px 30px;">
                    <p style="margin:0 0 18px;color:#a1a1aa;font-size:14px;line-height:1.7;">Usa el boton siguiente para crear una nueva contraseña. El enlace vence en %MINUTOS% minutos y solo puede usarse una vez.</p>
                    <a href="%ENLACE%" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;border-radius:12px;padding:14px 22px;">Restablecer contraseña</a>
                    <p style="margin:18px 0 0;color:#a1a1aa;font-size:12px;line-height:1.6;">Si el boton no abre, copia y pega este enlace en tu navegador:</p>
                    <p style="margin:8px 0 0;padding:12px;background:#09090b;border:1px solid rgba(255,255,255,.08);border-radius:10px;color:#e5e7eb;font-size:12px;line-height:1.5;word-break:break-all;">%ENLACE%</p>
                    <p style="margin:22px 0 0;color:#71717a;font-size:12px;line-height:1.6;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                  </td>
                </tr>
                """.replace("%MINUTOS%", String.valueOf(minutosValidez))
                .replace("%ENLACE%", enlaceSeguro);

        return construirTarjetaCorreoHtml("Restablece tu contraseña", intro, contenido, marca);
    }

    private String construirCorreoRutinaAsignadaHtml(
            String nombreSocio,
            String nombreRutina,
            String objetivo,
            String entrenador,
            int totalEjercicios,
            String fechaInicio,
            String fechaFin,
            boolean global,
            EmailBrand marca
    ) {
        String nombreSeguro = escapeHtml(nombreSocio == null || nombreSocio.isBlank() ? "Atleta" : nombreSocio);
        String rutinaSegura = escapeHtml(nombreRutina == null || nombreRutina.isBlank() ? "Nueva rutina" : nombreRutina);
        String objetivoSeguro = escapeHtml(objetivo == null || objetivo.isBlank() ? "Plan de entrenamiento" : objetivo);
        String entrenadorSeguro = escapeHtml(entrenador == null || entrenador.isBlank() ? "Equipo Spartan Gym" : entrenador);
        String inicioSeguro = escapeHtml(fechaInicio == null || fechaInicio.isBlank() ? "Sin fecha definida" : fechaInicio);
        String finSeguro = escapeHtml(fechaFin == null || fechaFin.isBlank() ? "Sin fecha definida" : fechaFin);
        String alcance = global ? "Rutina global" : "Rutina personal";
        String intro = "Hola <strong style=\"color:#ffffff;\">" + nombreSeguro + "</strong>, tienes una nueva rutina agregada en Spartan Gym.";
        String contenido = """
                <tr>
                  <td style="padding:28px 30px 8px;">
                    <div style="padding:18px;background:#141416;border:1px solid rgba(255,255,255,.08);border-radius:16px;">
                      <p style="margin:0 0 8px;color:#f87171;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">%ALCANCE%</p>
                      <p style="margin:0;color:#ffffff;font-size:20px;font-weight:900;line-height:1.25;">%RUTINA%</p>
                      <p style="margin:12px 0 0;color:#a1a1aa;font-size:14px;line-height:1.6;">%OBJETIVO%</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 30px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                      <tr>
                        <td style="padding:14px;background:#0a0a0b;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#d4d4d8;font-size:14px;">Entrenador</td>
                        <td style="padding:14px;background:#0a0a0b;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#ffffff;font-size:14px;font-weight:800;text-align:right;">%ENTRENADOR%</td>
                      </tr>
                      <tr>
                        <td style="padding:14px;background:#0a0a0b;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#d4d4d8;font-size:14px;">Ejercicios</td>
                        <td style="padding:14px;background:#0a0a0b;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#ffffff;font-size:14px;font-weight:800;text-align:right;">%EJERCICIOS%</td>
                      </tr>
                      <tr>
                        <td style="padding:14px;background:#0a0a0b;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#d4d4d8;font-size:14px;">Inicio</td>
                        <td style="padding:14px;background:#0a0a0b;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#ffffff;font-size:14px;font-weight:800;text-align:right;">%INICIO%</td>
                      </tr>
                      <tr>
                        <td style="padding:14px;background:#0a0a0b;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#d4d4d8;font-size:14px;">Fin</td>
                        <td style="padding:14px;background:#0a0a0b;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#ffffff;font-size:14px;font-weight:800;text-align:right;">%FIN%</td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0;color:#d4d4d8;font-size:14px;line-height:1.7;">Abre tu app para revisar el plan completo antes de entrenar.</p>
                    <p style="margin:24px 0 0;color:#ffffff;font-size:15px;font-weight:800;">El equipo de Spartan Gym</p>
                  </td>
                </tr>
                """
                .replace("%ALCANCE%", escapeHtml(alcance))
                .replace("%RUTINA%", rutinaSegura)
                .replace("%OBJETIVO%", objetivoSeguro)
                .replace("%ENTRENADOR%", entrenadorSeguro)
                .replace("%EJERCICIOS%", String.valueOf(Math.max(totalEjercicios, 0)))
                .replace("%INICIO%", inicioSeguro)
                .replace("%FIN%", finSeguro);

        return construirTarjetaCorreoHtml("Nueva rutina agregada", intro, contenido, marca);
    }

    private String construirCorreoGlobalHtml(String tipo, String titulo, String cuerpo, EmailBrand marca) {
        String categoria = escapeHtml(tipo == null || tipo.isBlank() ? "General" : tipo.trim());
        String tituloSeguro = escapeHtml(titulo == null || titulo.isBlank() ? "Aviso global" : titulo.trim());
        String cuerpoSeguro = escapeHtml(cuerpo == null || cuerpo.isBlank() ? "Tienes un nuevo aviso de Spartan Gym." : cuerpo.trim())
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace("\n", "<br/>");
        String intro = "<span style=\"display:inline-block;margin-bottom:10px;color:#f87171;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;\">" + categoria + "</span><br/>" + cuerpoSeguro;
        String contenido = """
                <tr>
                  <td style="padding:28px 30px;">
                    <div style="padding:16px;background:#141416;border:1px solid rgba(255,255,255,.08);border-radius:16px;">
                      <p style="margin:0;color:#ffffff;font-size:14px;line-height:1.7;">Este aviso tambien esta disponible dentro de tus notificaciones de Spartan Gym.</p>
                    </div>
                  </td>
                </tr>
                """;

        return construirTarjetaCorreoHtml(tituloSeguro, intro, contenido, marca);
    }

    private String construirTarjetaCorreoHtml(String titulo, String introHtml, String contenidoHtml, EmailBrand marca) {
        return """
                <!doctype html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>%TITULO%</title>
                </head>
                <body style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:32px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#0d0d0f;border:1px solid #2a0b0b;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.55);">
                          <tr>
                            <td style="padding:0;background:linear-gradient(135deg,#151515 0%,#050505 48%,#310606 100%);">
                              <div style="padding:30px 30px 26px;border-bottom:1px solid rgba(255,255,255,.08);text-align:center;">
                                %LOGO%
                                <h1 style="margin:18px 0 0;font-size:30px;line-height:1.08;color:#fff;font-weight:900;text-transform:uppercase;">%TITULO%</h1>
                                <p style="margin:14px 0 0;color:#d4d4d8;font-size:15px;line-height:1.65;text-align:center;">%INTRO%</p>
                              </div>
                            </td>
                          </tr>
                          %CONTENIDO%
                          <tr>
                            <td style="padding:18px 30px;background:#080808;border-top:1px solid rgba(255,255,255,.08);">
                              <p style="margin:0;color:#71717a;font-size:11px;line-height:1.5;text-align:center;">Este mensaje fue generado automaticamente por Spartan Gym.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """
                .replace("%TITULO%", titulo)
                .replace("%LOGO%", construirLogoHtml(marca))
                .replace("%INTRO%", introHtml)
                .replace("%CONTENIDO%", contenidoHtml);
    }

    private String construirLogoHtml(EmailBrand marca) {
        String nombre = escapeHtml(marca.nombreGimnasio());
        if (marca.logoSrc() != null && !marca.logoSrc().isBlank()) {
            return """
                    <img src="%LOGO%" alt="%NOMBRE%" style="display:block;max-width:190px;max-height:96px;width:auto;height:auto;margin:0 auto 12px;object-fit:contain;" />
                    <div style="font-size:11px;line-height:1;letter-spacing:4px;text-transform:uppercase;color:#f87171;font-weight:800;">%NOMBRE%</div>
                    """
                    .replace("%LOGO%", escapeHtml(marca.logoSrc()))
                    .replace("%NOMBRE%", nombre);
        }

        return """
                <div style="display:inline-block;padding:12px 16px;border:1px solid rgba(239,68,68,.32);border-radius:16px;background:rgba(0,0,0,.25);">
                  <div style="font-size:26px;line-height:1;color:#ffffff;font-weight:900;letter-spacing:1px;text-transform:uppercase;">SPARTAN <span style="color:#ef4444;">GYM</span></div>
                </div>
                <div style="margin-top:12px;font-size:11px;line-height:1;letter-spacing:4px;text-transform:uppercase;color:#f87171;font-weight:800;">%NOMBRE%</div>
                """.replace("%NOMBRE%", nombre);
    }

    private void adjuntarLogoInline(MimeMessageHelper helper, EmailBrand marca) {
        if (!marca.tieneLogoInline()) {
            return;
        }

        try {
            helper.addInline(LOGO_CID, new ByteArrayResource(marca.logoBytes()), marca.contentType());
        } catch (Exception e) {
            log.warn("No se pudo adjuntar el logo al correo: {}", e.getMessage());
        }
    }

    private EmailBrand obtenerMarcaCorreo(String logoPreferido) {
        Map<String, Object> config = configuracionAppService.obtener();
        String nombreGimnasio = stringConfig(config, "gymName", "Spartan Gym");
        String logo = firstNonBlank(
                logoPreferido,
                stringConfig(config, "logoPrincipal", ""),
                stringConfig(config, "logoAcceso", "")
        );

        if (logo.startsWith("data:image/")) {
            try {
                int coma = logo.indexOf(',');
                int puntoComa = logo.indexOf(';');
                if (coma > 0 && puntoComa > "data:".length()) {
                    String contentType = logo.substring("data:".length(), puntoComa);
                    byte[] bytes = Base64.getDecoder().decode(logo.substring(coma + 1));
                    return new EmailBrand(nombreGimnasio, "cid:" + LOGO_CID, contentType, bytes);
                }
            } catch (Exception e) {
                log.warn("No se pudo leer el logo configurado para el correo: {}", e.getMessage());
            }
        }

        if (logo.startsWith("http://") || logo.startsWith("https://")) {
            return new EmailBrand(nombreGimnasio, logo, null, null);
        }

        return new EmailBrand(nombreGimnasio, "", null, null);
    }

    private String stringConfig(Map<String, Object> config, String clave, String valorDefault) {
        Object valor = config.get(clave);
        if (valor instanceof String texto && !texto.isBlank()) {
            return texto.trim();
        }
        return valorDefault;
    }

    private String firstNonBlank(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor.trim();
            }
        }
        return "";
    }

    private String escapeHtml(String valor) {
        if (valor == null) {
            return "";
        }
        return valor
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private record EmailBrand(String nombreGimnasio, String logoSrc, String contentType, byte[] logoBytes) {
        private boolean tieneLogoInline() {
            return logoBytes != null && logoBytes.length > 0 && contentType != null && !contentType.isBlank();
        }
    }
}
