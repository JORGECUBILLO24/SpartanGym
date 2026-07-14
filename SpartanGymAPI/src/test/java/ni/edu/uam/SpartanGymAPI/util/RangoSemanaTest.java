package ni.edu.uam.SpartanGymAPI.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RangoSemanaTest {

    @Test
    void unMiercolesDevuelveElLunesYDomingoDeEsaSemana() {
        // 2026-07-15 es miercoles
        RangoSemana rango = RangoSemana.deLunesADomingo(LocalDate.of(2026, 7, 15));

        assertEquals(LocalDate.of(2026, 7, 13), rango.inicio()); // lunes
        assertEquals(LocalDate.of(2026, 7, 19), rango.fin());    // domingo
    }

    @Test
    void unLunesEsElInicioDeSuPropiaSemana() {
        RangoSemana rango = RangoSemana.deLunesADomingo(LocalDate.of(2026, 7, 13));

        assertEquals(LocalDate.of(2026, 7, 13), rango.inicio());
        assertEquals(LocalDate.of(2026, 7, 19), rango.fin());
    }

    @Test
    void unDomingoEsElFinDeSuPropiaSemanaNoLaSiguiente() {
        RangoSemana rango = RangoSemana.deLunesADomingo(LocalDate.of(2026, 7, 19));

        assertEquals(LocalDate.of(2026, 7, 13), rango.inicio());
        assertEquals(LocalDate.of(2026, 7, 19), rango.fin());
    }
}
