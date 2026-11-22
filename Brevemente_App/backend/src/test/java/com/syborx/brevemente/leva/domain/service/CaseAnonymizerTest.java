package com.syborx.brevemente.leva.domain.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CaseAnonymizerTest {

    @Test
    @DisplayName("scrub: elimina nombre y apellidos del paciente sin importar acentos ni mayúsculas")
    void scrubEliminaNombresConVariantesDeAcento() {
        String text = "MARIA López Pérez evita el agua; su esposa Lucía Maria le ayuda. Maria nunca se baña sola.";
        String result = CaseAnonymizer.scrub(text, List.of("María", "López Pérez", "Lucía"));

        assertFalse(result.toLowerCase().contains("maria"));
        assertFalse(result.contains("López"));
        assertFalse(result.contains("Pérez"));
        assertFalse(result.contains("Lucía"));
        assertTrue(result.contains(CaseAnonymizer.PLACEHOLDER));
        assertTrue(result.contains("evita el agua"));
    }

    @Test
    @DisplayName("scrub: no altera palabras clínicas que contienen un nombre como subcadena")
    void scrubRespetaLimitesDePalabra() {
        String result = CaseAnonymizer.scrub("Presenta marcada ansiedad", List.of("Marc"));
        assertEquals("Presenta marcada ansiedad", result);
    }

    @Test
    @DisplayName("scrub: depura correos, teléfonos, CURP e identificadores numéricos largos")
    void scrubDepuraPatronesSensibles() {
        String result = CaseAnonymizer.scrub(
                "Contacto juan.perez@mail.com, tel +52 55 1234 5678, CURP LOPM900101HDFPRR09, folio 99887766.",
                List.of());

        assertFalse(result.contains("@"));
        assertFalse(result.contains("1234"));
        assertFalse(result.contains("LOPM900101"));
        assertFalse(result.contains("99887766"));
        assertTrue(result.contains("[CORREO]"));
    }

    @Test
    @DisplayName("scrub: texto nulo o vacío devuelve cadena vacía")
    void scrubNuloDevuelveVacio() {
        assertEquals("", CaseAnonymizer.scrub(null, List.of("Ana")));
        assertEquals("", CaseAnonymizer.scrub("   ", List.of("Ana")));
    }

    @Test
    @DisplayName("ageBracket: devuelve rangos genéricos y nunca la edad exacta")
    void ageBracketRangos() {
        assertTrue(CaseAnonymizer.ageBracket(8).startsWith("Niñez"));
        assertTrue(CaseAnonymizer.ageBracket(15).startsWith("Adolescente"));
        assertTrue(CaseAnonymizer.ageBracket(24).startsWith("Adulto joven"));
        assertTrue(CaseAnonymizer.ageBracket(45).startsWith("Adulto ("));
        assertTrue(CaseAnonymizer.ageBracket(70).startsWith("Adulto mayor"));
        assertEquals("Perfil etario no especificado", CaseAnonymizer.ageBracket(null));
    }
}
