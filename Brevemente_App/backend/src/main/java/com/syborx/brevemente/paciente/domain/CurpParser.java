package com.syborx.brevemente.paciente.domain;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Utilidad de dominio para derivar la fecha de nacimiento desde la CURP.
 *
 * Regla oficial mexicana (paridad con la demo):
 * - Posiciones 5 a 10 (índices 4 a 9): AAMMDD.
 * - Posición 17 (índice 16): dígito → siglo 19xx; letra → siglo 20xx.
 */
public final class CurpParser {

    private CurpParser() {
    }

    /**
     * Extrae la fecha de nacimiento de una CURP de 18 caracteres.
     *
     * @param curp CURP sin normalizar (acepta minúsculas y espacios)
     * @return la fecha derivada si la CURP es válida para extraerla; vacío en otro caso
     */
    public static Optional<LocalDate> extraerFechaNacimiento(String curp) {
        if (curp == null) {
            return Optional.empty();
        }

        String clean = curp.trim().toUpperCase();
        if (clean.length() != 18) {
            return Optional.empty();
        }

        String yy = clean.substring(4, 6);
        String mm = clean.substring(6, 8);
        String dd = clean.substring(8, 10);
        char centuryChar = clean.charAt(16);

        if (!esNumero(yy) || !esNumero(mm) || !esNumero(dd)) {
            return Optional.empty();
        }

        boolean is19xx = Character.isDigit(centuryChar);
        boolean is20xx = Character.isLetter(centuryChar);
        if (!is19xx && !is20xx) {
            return Optional.empty();
        }

        int year = Integer.parseInt((is19xx ? "19" : "20") + yy);
        int month = Integer.parseInt(mm);
        int day = Integer.parseInt(dd);

        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return Optional.empty();
        }

        try {
            return Optional.of(LocalDate.of(year, month, day));
        } catch (DateTimeException e) {
            return Optional.empty();
        }
    }

    private static boolean esNumero(String s) {
        for (int i = 0; i < s.length(); i++) {
            if (!Character.isDigit(s.charAt(i))) {
                return false;
            }
        }
        return true;
    }
}
