package com.syborx.brevemente.expediente.application.service;

import com.syborx.brevemente.auditoria.application.ports.out.AuditoriaExpedientePort;
import com.syborx.brevemente.expediente.application.ports.in.GuardarCriteriosSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarCriteriosSesionUseCase;
import com.syborx.brevemente.expediente.application.ports.in.ListarOpcionesConductualesUseCase;
import com.syborx.brevemente.expediente.application.ports.out.CriterioClinicoRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.OpcionConductualRepositoryPort;
import com.syborx.brevemente.expediente.application.ports.out.SesionRepositoryPort;
import com.syborx.brevemente.expediente.domain.exception.SesionInvalidaException;
import com.syborx.brevemente.expediente.domain.exception.SesionNotFoundException;
import com.syborx.brevemente.expediente.domain.model.CriterioClinico;
import com.syborx.brevemente.expediente.domain.model.OpcionConductual;
import com.syborx.brevemente.expediente.domain.model.Sesion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service("expedienteCriterioClinicoApplicationService")
@RequiredArgsConstructor
public class CriterioClinicoApplicationService implements
        ListarCriteriosSesionUseCase, GuardarCriteriosSesionUseCase, ListarOpcionesConductualesUseCase {

    private static final Set<String> CATEGORIAS = Set.of(
            "conductual", "racionalizaciones_intelectualizaciones",
            "comparaciones", "imagenes_intrusivas", "otro");

    private final SesionRepositoryPort sesionRepositoryPort;
    private final CriterioClinicoRepositoryPort criterioClinicoRepositoryPort;
    private final OpcionConductualRepositoryPort opcionConductualRepositoryPort;
    private final AuditoriaExpedientePort auditoriaExpedientePort;

    @Override
    @Transactional(readOnly = true)
    public List<CriterioClinico> listar(String sesionId) {
        resolverSesion(sesionId);
        return criterioClinicoRepositoryPort.findBySesionId(sesionId);
    }

    @Override
    @Transactional
    public List<CriterioClinico> guardar(String sesionId, List<CriterioClinico> criterios, String usuarioId) {
        Sesion sesion = resolverSesion(sesionId);

        List<CriterioClinico> validos = criterios == null ? List.of() : criterios;
        for (CriterioClinico c : validos) {
            if (c.categoria() == null || !CATEGORIAS.contains(c.categoria())) {
                throw new SesionInvalidaException("Categoría de criterio inválida: " + c.categoria());
            }
            if (c.valor() == null || c.valor().isBlank()) {
                throw new SesionInvalidaException("El valor del criterio no puede estar vacío.");
            }
        }

        criterioClinicoRepositoryPort.deleteBySesionId(sesionId);
        List<CriterioClinico> guardados = criterioClinicoRepositoryPort.saveAll(sesionId, validos);

        auditoriaExpedientePort.registrar(
                sesion.getPacienteId(), usuarioId,
                "Registro de criterios clínicos",
                "Se actualizaron los criterios clínicos de la Sesión " + sesion.getNumero() + ".", "sesion");
        return guardados;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OpcionConductual> listar() {
        return opcionConductualRepositoryPort.findAll();
    }

    private Sesion resolverSesion(String sesionId) {
        return sesionRepositoryPort.findById(sesionId)
                .orElseThrow(() -> new SesionNotFoundException("No existe la sesión " + sesionId));
    }
}
