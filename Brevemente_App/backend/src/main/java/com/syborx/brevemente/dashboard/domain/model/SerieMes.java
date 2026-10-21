package com.syborx.brevemente.dashboard.domain.model;

import java.util.List;

/**
 * Punto de la serie mensual "Citas completadas (Histórico)" del Centro de Control.
 * {@code month} es la etiqueta corta en español (Jul, Ago, Sep...) tal y como la
 * renderiza la demo React.
 */
public record SerieMes(String month, long citas) {

    private static final List<String> MESES = List.of(
            "Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic");

    /**
     * Convierte una clave de mes {@code YYYY-MM} a su etiqueta corta en español.
     * Si la clave no es parseable se devuelve tal cual (defensivo).
     */
    public static String monthLabel(String monthKey) {
        if (monthKey == null) {
            return null;
        }
        String[] partes = monthKey.split("-");
        if (partes.length >= 2) {
            try {
                int mes = Integer.parseInt(partes[1]);
                if (mes >= 1 && mes <= 12) {
                    return MESES.get(mes - 1);
                }
            } catch (NumberFormatException ignored) {
                // fallback al retorno de la clave original
            }
        }
        return monthKey;
    }
}
