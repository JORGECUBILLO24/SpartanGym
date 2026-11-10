package ni.edu.uam.SpartanGymAPI.services;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QrSessionStoreConfigTest {

    @Test
    void aceptaMemoryYRedisSinImportarMayusculas() {
        assertThatCode(() -> new QrSessionStoreConfig("memory")).doesNotThrowAnyException();
        assertThatCode(() -> new QrSessionStoreConfig("redis")).doesNotThrowAnyException();
        assertThatCode(() -> new QrSessionStoreConfig("Redis")).doesNotThrowAnyException();
    }

    @Test
    void unValorInvalidoFallaConElMotivoReal() {
        assertThatThrownBy(() -> new QrSessionStoreConfig("reds"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("'reds'")
                .hasMessageContaining("memory")
                .hasMessageContaining("redis");
        assertThatThrownBy(() -> new QrSessionStoreConfig("")).isInstanceOf(IllegalStateException.class);
    }
}
