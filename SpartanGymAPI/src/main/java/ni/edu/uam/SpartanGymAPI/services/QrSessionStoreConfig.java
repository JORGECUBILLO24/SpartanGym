package ni.edu.uam.SpartanGymAPI.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Red de seguridad de configuracion: si app.qr.session-store tiene un valor que no es "memory"
 * ni "redis" (por ejemplo un error de tipeo en el panel de Render), ningun almacen se activa y
 * la API fallaria con un confuso "NoSuchBeanDefinition". Aqui falla con el motivo real.
 */
@Configuration
public class QrSessionStoreConfig {

    public QrSessionStoreConfig(@Value("${app.qr.session-store:memory}") String valor) {
        validar(valor);
    }

    static void validar(String valor) {
        if (!"memory".equalsIgnoreCase(valor) && !"redis".equalsIgnoreCase(valor)) {
            throw new IllegalStateException(
                    "app.qr.session-store='" + valor + "' no es valido. Usa 'memory' (una sola instancia) "
                            + "o 'redis' (varias instancias, requiere SPRING_DATA_REDIS_URL).");
        }
    }
}
