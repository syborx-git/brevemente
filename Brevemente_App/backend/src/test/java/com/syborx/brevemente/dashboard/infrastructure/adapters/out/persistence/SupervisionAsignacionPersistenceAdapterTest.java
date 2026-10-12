package com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.entity.SupervisionAsignacionJpaEntity;
import com.syborx.brevemente.dashboard.infrastructure.adapters.out.persistence.repository.SpringDataSupervisionAsignacionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupervisionAsignacionPersistenceAdapterTest {

    @Mock
    private SpringDataSupervisionAsignacionRepository repository;

    private SupervisionAsignacionPersistenceAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new SupervisionAsignacionPersistenceAdapter(repository);
    }

    @Test
    @DisplayName("Devuelve terapeutaIds de las asignaciones del supervisor")
    void findTerapeutasSupervisados() {
        when(repository.findBySupervisorUsuarioId("usr-003")).thenReturn(List.of(
                SupervisionAsignacionJpaEntity.builder()
                        .id("as-1")
                        .supervisorUsuarioId("usr-003")
                        .terapeutaId("ter-001")
                        .build(),
                SupervisionAsignacionJpaEntity.builder()
                        .id("as-2")
                        .supervisorUsuarioId("usr-003")
                        .terapeutaId("ter-002")
                        .build()
        ));

        List<String> resultado = adapter.findTerapeutasSupervisados("usr-003");

        assertEquals(List.of("ter-001", "ter-002"), resultado);
    }

    @Test
    @DisplayName("Supervisor nulo devuelve vacío sin consultar el repositorio")
    void supervisorNuloDevuelveVacio() {
        assertEquals(List.of(), adapter.findTerapeutasSupervisados(null));
        verifyNoInteractions(repository);
    }
}
