package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.paciente.domain.model.CapacidadConsentimiento;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.domain.model.RepresentanteLegal;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaJpaEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class PacientePersistenceMapper {

    public Paciente toDomain(PacienteJpaEntity entity) {
        if (entity == null) return null;

        CapacidadConsentimiento consentimiento = new CapacidadConsentimiento(
                entity.getEstadoConsentimiento(),
                null,
                entity.getFechaDeterminacionConsentimiento(),
                null,
                entity.getMotivoDeterminacionConsentimiento()
        );

        RepresentanteLegal representante = null;
        if (entity.getPersonaDeApoyoNombre() != null && !entity.getPersonaDeApoyoNombre().isBlank()) {
            representante = new RepresentanteLegal(
                    entity.getPersonaDeApoyoNombre(),
                    entity.getRepresentanteParentesco() != null ? entity.getRepresentanteParentesco() : "MADRE",
                    entity.getPersonaDeApoyoContacto(),
                    entity.getRepresentanteCorreo(),
                    null,
                    null,
                    null
            );
        }

        String terapeutaId = entity.getTerapeuta() != null ? entity.getTerapeuta().getId() : "ter-001";
        String terapeutaNombre = entity.getTerapeuta() != null 
                ? (entity.getTerapeuta().getNombre() + " " + entity.getTerapeuta().getApellidos()).trim() 
                : "Dr. Alejandro Silva";

        LocalDate fechaReg = entity.getCreatedAt() != null 
                ? entity.getCreatedAt().toLocalDate() 
                : LocalDate.now();

        return Paciente.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .apellidos(entity.getApellidos())
                .curp(entity.getCurp())
                .fechaNacimiento(entity.getFechaNacimiento())
                .edadCalculada(entity.getEdadCalculada())
                .telefono(entity.getTelefono())
                .email(entity.getEmail())
                .status(entity.getStatus() != null ? entity.getStatus() : "activo")
                .riskLevel(entity.getRiskLevel() != null ? entity.getRiskLevel() : "bajo")
                .registryMode(entity.getRegistryMode() != null ? entity.getRegistryMode() : "manual")
                .sessionFrequency(entity.getSessionFrequency() != null ? entity.getSessionFrequency() : "semanal")
                .quienCompletaRegistro(entity.getQuienCompletaRegistro() != null ? entity.getQuienCompletaRegistro() : "PACIENTE")
                .motivoConsulta(entity.getMotivoConsulta())
                .terapeutaId(terapeutaId)
                .terapeutaNombre(terapeutaNombre)
                .capacidadConsentimiento(consentimiento)
                .representante(representante)
                .consentimientoRepresentanteFirmado(Boolean.TRUE.equals(entity.getConsentimientoRepresentanteFirmado()))
                .fechaRegistro(fechaReg)
                .build();
    }

    public PacienteJpaEntity toJpaEntity(Paciente domain, TerapeutaJpaEntity terapeuta) {
        if (domain == null) return null;

        String estadoConsentimiento = domain.getCapacidadConsentimiento() != null 
                ? domain.getCapacidadConsentimiento().estado() 
                : "AUTONOMO";

        LocalDate fechaDet = domain.getCapacidadConsentimiento() != null 
                ? domain.getCapacidadConsentimiento().fechaDeterminacion() 
                : LocalDate.now();

        String motivoDet = domain.getCapacidadConsentimiento() != null 
                ? domain.getCapacidadConsentimiento().motivo() 
                : null;

        String personaApoyoNombre = null;
        String personaApoyoContacto = null;
        String repParentesco = null;
        String repCorreo = null;

        if (domain.getRepresentante() != null) {
            personaApoyoNombre = domain.getRepresentante().nombreCompleto();
            personaApoyoContacto = domain.getRepresentante().telefono();
            repParentesco = domain.getRepresentante().parentesco();
            repCorreo = domain.getRepresentante().correo();
        }

        return PacienteJpaEntity.builder()
                .id(domain.getId())
                .nombre(domain.getNombre())
                .apellidos(domain.getApellidos() != null ? domain.getApellidos() : "")
                .curp(domain.getCurp())
                .fechaNacimiento(domain.getFechaNacimiento() != null ? domain.getFechaNacimiento() : LocalDate.of(2000, 1, 1))
                .edadCalculada(domain.getEdadCalculada() != null ? domain.getEdadCalculada() : 25)
                .telefono(domain.getTelefono())
                .email(domain.getEmail())
                .estadoConsentimiento(estadoConsentimiento)
                .status(domain.getStatus() != null ? domain.getStatus() : "activo")
                .riskLevel(domain.getRiskLevel() != null ? domain.getRiskLevel() : "bajo")
                .registryMode(domain.getRegistryMode() != null ? domain.getRegistryMode() : "manual")
                .sessionFrequency(domain.getSessionFrequency() != null ? domain.getSessionFrequency() : "semanal")
                .quienCompletaRegistro(domain.getQuienCompletaRegistro() != null ? domain.getQuienCompletaRegistro() : "PACIENTE")
                .motivoConsulta(domain.getMotivoConsulta())
                .terapeuta(terapeuta)
                .fechaDeterminacionConsentimiento(fechaDet)
                .motivoDeterminacionConsentimiento(motivoDet)
                .personaDeApoyoNombre(personaApoyoNombre)
                .personaDeApoyoContacto(personaApoyoContacto)
                .representanteParentesco(repParentesco)
                .representanteCorreo(repCorreo)
                .consentimientoRepresentanteFirmado(Boolean.TRUE.equals(domain.getConsentimientoRepresentanteFirmado()))
                .build();
    }
}
