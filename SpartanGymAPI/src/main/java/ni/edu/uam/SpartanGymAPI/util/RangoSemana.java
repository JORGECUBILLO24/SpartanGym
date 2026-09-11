package ni.edu.uam.SpartanGymAPI.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

public record RangoSemana(LocalDate inicio, LocalDate fin) {

    public static RangoSemana deLunesADomingo(LocalDate fecha) {
        LocalDate lunes = fecha.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate domingo = lunes.plusDays(6);
        return new RangoSemana(lunes, domingo);
    }
}
