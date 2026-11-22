package com.syborx.brevemente.leva.domain.service;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Desidentificación de texto clínico antes de que un caso alimente la memoria de LEVA.
 * Elimina nombres/apellidos del paciente y de su persona de apoyo, correos, teléfonos,
 * CURP y cualquier secuencia numérica larga que pudiera identificar a una persona.
 */
public final class CaseAnonymizer {

    public static final String PLACEHOLDER = "[PACIENTE]";

    private static final Pattern EMAIL = Pattern.compile("[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+");
    private static final Pattern CURP = Pattern.compile("\\b[A-Z]{4}\\d{6}[HM][A-Z]{5}[A-Z0-9]\\d\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern PHONE = Pattern.compile("(\\+?\\d[\\d\\s().-]{6,}\\d)");
    private static final Pattern LONG_DIGITS = Pattern.compile("\\d{6,}");

    private static final Set<String> NAME_STOPWORDS = Set.of(
            "del", "los", "las", "san", "santa", "con", "por", "sin", "von", "van", "mar");

    private CaseAnonymizer() {
    }

    /** Depura el texto eliminando identificadores personales conocidos y patrones sensibles. */
    public static String scrub(String text, Collection<String> identifiers) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String result = text;

        for (String token : nameTokens(identifiers)) {
            Pattern p = Pattern.compile("(?<![\\p{L}\\p{Nd}])" + accentInsensitive(token) + "(?![\\p{L}\\p{Nd}])",
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
            result = p.matcher(result).replaceAll(PLACEHOLDER);
        }

        result = EMAIL.matcher(result).replaceAll("[CORREO]");
        result = CURP.matcher(result).replaceAll("[ID]");
        result = PHONE.matcher(result).replaceAll("[TELEFONO]");
        result = LONG_DIGITS.matcher(result).replaceAll("[ID]");
        return result.replaceAll("\\s{2,}", " ").trim();
    }

    /** Rango etario genérico (nunca la fecha de nacimiento ni la edad exacta). */
    public static String ageBracket(Integer edad) {
        if (edad == null || edad < 0) {
            return "Perfil etario no especificado";
        }
        if (edad < 12) return "Niñez (menor de 12 años)";
        if (edad < 18) return "Adolescente (12 a 17 años)";
        if (edad < 30) return "Adulto joven (18 a 29 años)";
        if (edad < 60) return "Adulto (30 a 59 años)";
        return "Adulto mayor (60 años o más)";
    }

    static Set<String> nameTokens(Collection<String> identifiers) {
        Set<String> tokens = new LinkedHashSet<>();
        if (identifiers == null) {
            return tokens;
        }
        for (String full : identifiers) {
            if (full == null) continue;
            for (String part : full.trim().split("[^\\p{L}]+")) {
                if (part.length() >= 3 && !NAME_STOPWORDS.contains(part.toLowerCase(Locale.ROOT))) {
                    tokens.add(part);
                }
            }
        }
        return tokens;
    }

    private static String accentInsensitive(String token) {
        StringBuilder sb = new StringBuilder();
        for (char c : token.toLowerCase(Locale.ROOT).toCharArray()) {
            switch (c) {
                case 'a', 'á', 'à', 'ä', 'â' -> sb.append("[aáàäâ]");
                case 'e', 'é', 'è', 'ë', 'ê' -> sb.append("[eéèëê]");
                case 'i', 'í', 'ì', 'ï', 'î' -> sb.append("[iíìïî]");
                case 'o', 'ó', 'ò', 'ö', 'ô' -> sb.append("[oóòöô]");
                case 'u', 'ú', 'ù', 'ü', 'û' -> sb.append("[uúùüû]");
                case 'n', 'ñ' -> sb.append("[nñ]");
                default -> sb.append(Pattern.quote(String.valueOf(c)));
            }
        }
        return sb.toString();
    }
}
