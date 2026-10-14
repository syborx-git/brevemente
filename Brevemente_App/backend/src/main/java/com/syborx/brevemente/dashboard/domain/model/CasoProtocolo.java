package com.syborx.brevemente.dashboard.domain.model;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Agregación "Casos Activos por Protocolo". La clave es el nombre canónico del
 * protocolo (catálogo V12).
 */
public record CasoProtocolo(String protocolo, long casos) {

    /**
     * Completa los grupos con todos los protocolos del catálogo (cero donde no hay
     * casos), conservando el orden del catálogo.
     */
    public static List<CasoProtocolo> completar(List<CasoProtocolo> grupos, Collection<String> catalogo) {
        Map<String, Long> porProtocolo = new LinkedHashMap<>();
        if (grupos != null) {
            for (CasoProtocolo grupo : grupos) {
                if (grupo != null && grupo.protocolo() != null) {
                    porProtocolo.merge(grupo.protocolo(), grupo.casos(), Long::sum);
                }
            }
        }
        List<String> nombres = catalogo == null
                ? List.of()
                : catalogo.stream().filter(Objects::nonNull).toList();
        return nombres.stream()
                .map(nombre -> new CasoProtocolo(nombre, porProtocolo.getOrDefault(nombre, 0L)))
                .toList();
    }
}
