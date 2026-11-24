package com.syborx.brevemente.cita.infrastructure.adapters.out.sesion;

import com.syborx.brevemente.cita.application.ports.out.RegistroSesionPort;
import com.syborx.brevemente.cita.domain.model.SesionIniciada;
import com.syborx.brevemente.expediente.application.ports.in.AgregarSesionUseCase;
import com.syborx.brevemente.expediente.domain.model.Sesion;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Adaptador que materializa {@link RegistroSesionPort} delegando en el caso de uso
 * de alta de sesión del contexto {@code expediente}. El expediente se resuelve
 * internamente por paciente (relación 1:1) dentro de {@code AgregarSesionUseCase}.
 */
@Component
public class SesionRegistroAdapter implements RegistroSesionPort {

    private final AgregarSesionUseCase agregarSesionUseCase;

    public SesionRegistroAdapter(@Lazy AgregarSesionUseCase agregarSesionUseCase) {
        this.agregarSesionUseCase = agregarSesionUseCase;
    }

    @Override
    public SesionIniciada iniciar(String pacienteId, LocalDate fecha, String citaId,
                                  String usuarioId, List<String> terapeutaIds) {
        Sesion sesion = Sesion.builder()
                .pacienteId(pacienteId)
                .fecha(fecha)
                .citaId(citaId)
                .build();

        Sesion creada = agregarSesionUseCase.agregar(pacienteId, sesion, usuarioId, terapeutaIds);

        return new SesionIniciada(
                creada.getId(),
                creada.getPacienteId(),
                creada.getNumero(),
                creada.getFecha(),
                creada.getStatus(),
                creada.getCitaId()
        );
    }
}
