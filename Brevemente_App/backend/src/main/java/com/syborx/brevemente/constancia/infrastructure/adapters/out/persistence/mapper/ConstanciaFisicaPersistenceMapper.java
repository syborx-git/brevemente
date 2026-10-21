package com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.constancia.domain.model.ConstanciaFisica;
import com.syborx.brevemente.constancia.infrastructure.adapters.out.persistence.entity.ConstanciaFisicaJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class ConstanciaFisicaPersistenceMapper {

    public ConstanciaFisica toDomain(ConstanciaFisicaJpaEntity e, String pacienteNombre, String registradoPorNombre) {
        if (e == null) return null;
        return ConstanciaFisica.builder()
                .id(e.getId())
                .pacienteId(e.getPacienteId())
                .pacienteNombre(pacienteNombre)
                .folioFisico(e.getFolioFisico())
                .fechaExpedicion(e.getFechaExpedicion())
                .tipo(e.getTipo())
                .emisorNombre(e.getEmisorNombre())
                .emisorCedula(e.getEmisorCedula())
                .destinatario(e.getDestinatario())
                .motivo(e.getMotivo())
                .periodoCubierto(e.getPeriodoCubierto())
                .numSesiones(e.getNumSesiones())
                .resumenClinico(e.getResumenClinico())
                .urlEscaneo(e.getUrlEscaneo())
                .nombreArchivoEscaneo(e.getNombreArchivoEscaneo())
                .entregadoA(e.getEntregadoA())
                .estado(e.getEstado())
                .registradoPorId(e.getRegistradoPorId())
                .registradoPorNombre(registradoPorNombre)
                .registradoAt(e.getRegistradoAt())
                .createdAt(e.getCreatedAt())
                .build();
    }

    public ConstanciaFisicaJpaEntity toJpaEntity(ConstanciaFisica d) {
        if (d == null) return null;
        return ConstanciaFisicaJpaEntity.builder()
                .id(d.getId())
                .pacienteId(d.getPacienteId())
                .folioFisico(d.getFolioFisico())
                .fechaExpedicion(d.getFechaExpedicion())
                .tipo(d.getTipo())
                .emisorNombre(d.getEmisorNombre())
                .emisorCedula(d.getEmisorCedula())
                .destinatario(d.getDestinatario())
                .motivo(d.getMotivo())
                .periodoCubierto(d.getPeriodoCubierto())
                .numSesiones(d.getNumSesiones())
                .resumenClinico(d.getResumenClinico())
                .urlEscaneo(d.getUrlEscaneo())
                .nombreArchivoEscaneo(d.getNombreArchivoEscaneo())
                .entregadoA(d.getEntregadoA())
                .estado(d.getEstado())
                .registradoPorId(d.getRegistradoPorId())
                .registradoAt(d.getRegistradoAt())
                .build();
    }
}
