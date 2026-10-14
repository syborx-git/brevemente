package com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.dashboard.application.ports.out.DashboardCatalogosRepositoryPort;
import com.syborx.brevemente.dashboard.domain.model.CatalogosDashboard;
import com.syborx.brevemente.dashboard.domain.model.Protocolo;
import com.syborx.brevemente.dashboard.domain.model.Sede;
import com.syborx.brevemente.dashboard.domain.model.Terapeuta;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository.SpringDataProtocoloRepository;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository.SpringDataSedeRepository;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.repository.SpringDataTerapeutaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Adaptador de persistencia de los catálogos del Centro de Control. Reutiliza el
 * repositorio de terapeutas existente (módulo paciente) para resolver nombres vía
 * {@code usuarios} (tras V4).
 */
@Component
@RequiredArgsConstructor
public class DashboardCatalogosPersistenceAdapter implements DashboardCatalogosRepositoryPort {

    private static final List<String> MODALIDADES = List.of("PRESENCIAL", "ONLINE");

    private final SpringDataSedeRepository sedeRepository;
    private final SpringDataProtocoloRepository protocoloRepository;
    private final SpringDataTerapeutaRepository terapeutaRepository;

    @Override
    public CatalogosDashboard obtenerCatalogos() {
        List<Sede> sedes = sedeRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(e -> new Sede(e.getId(), e.getNombre()))
                .toList();

        List<Protocolo> protocolos = protocoloRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(e -> new Protocolo(e.getId(), e.getNombre()))
                .toList();

        List<Terapeuta> terapeutas = terapeutaRepository.findAllDisplayNames().stream()
                .map(row -> new Terapeuta((String) row[0], (String) row[1]))
                .toList();

        return new CatalogosDashboard(sedes, protocolos, terapeutas, MODALIDADES);
    }

    @Override
    public Optional<String> findTerapeutaNombre(String terapeutaId) {
        if (terapeutaId == null || terapeutaId.isBlank()) {
            return Optional.empty();
        }
        return terapeutaRepository.findTherapistDisplayName(terapeutaId);
    }

    @Override
    public Optional<String> findProtocoloNombre(String protocoloId) {
        if (protocoloId == null || protocoloId.isBlank()) {
            return Optional.empty();
        }
        return protocoloRepository.findById(protocoloId)
                .map(e -> e.getNombre());
    }
}
