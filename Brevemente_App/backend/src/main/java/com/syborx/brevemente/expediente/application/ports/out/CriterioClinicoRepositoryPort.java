package com.syborx.brevemente.expediente.application.ports.out;

import com.syborx.brevemente.expediente.domain.model.CriterioClinico;

import java.util.List;

public interface CriterioClinicoRepositoryPort {
    List<CriterioClinico> findBySesionId(String sesionId);
    void deleteBySesionId(String sesionId);
    List<CriterioClinico> saveAll(String sesionId, List<CriterioClinico> criterios);
}
