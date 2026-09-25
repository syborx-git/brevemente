package com.syborx.brevemente.mapper;

import com.syborx.brevemente.domain.model.PacienteEntity;
import com.syborx.brevemente.domain.model.TerapeutaEntity;
import com.syborx.brevemente.dto.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

@Component
public class PacienteMapper {

    public PacienteResponseDTO toResponseDTO(PacienteEntity entity) {
        if (entity == null) return null;

        String fullName = buildFullName(entity.getNombre(), entity.getApellidos());
        String birthDateStr = entity.getFechaNacimiento() != null ? entity.getFechaNacimiento().toString() : "";
        String registrationDateStr = entity.getCreatedAt() != null
                ? entity.getCreatedAt().toLocalDate().toString()
                : LocalDate.now().toString();

        String therapistId = entity.getTerapeuta() != null ? entity.getTerapeuta().getId() : "ter-001";
        String therapistName = entity.getTerapeuta() != null
                ? buildFullName(entity.getTerapeuta().getNombre(), entity.getTerapeuta().getApellidos())
                : "Dr. Alejandro Silva";

        String fechaDet = entity.getFechaDeterminacionConsentimiento() != null
                ? entity.getFechaDeterminacionConsentimiento().toString()
                : null;

        CapacidadConsentimientoDTO consentimientoDTO = new CapacidadConsentimientoDTO(
                entity.getEstadoConsentimiento(),
                null,
                fechaDet,
                null,
                entity.getMotivoDeterminacionConsentimiento()
        );

        RepresentanteLegalDTO representanteDTO = null;
        if (entity.getPersonaDeApoyoNombre() != null && !entity.getPersonaDeApoyoNombre().isBlank()) {
            representanteDTO = new RepresentanteLegalDTO(
                    entity.getPersonaDeApoyoNombre(),
                    entity.getRepresentanteParentesco() != null ? entity.getRepresentanteParentesco() : "MADRE",
                    entity.getPersonaDeApoyoContacto(),
                    entity.getRepresentanteCorreo(),
                    null,
                    null,
                    null
            );
        }

        return new PacienteResponseDTO(
                entity.getId(),
                fullName,
                entity.getTelefono(),
                entity.getEmail(),
                birthDateStr,
                entity.getCurp(),
                registrationDateStr,
                entity.getStatus() != null ? entity.getStatus() : "activo",
                entity.getRiskLevel() != null ? entity.getRiskLevel() : "bajo",
                entity.getRegistryMode() != null ? entity.getRegistryMode() : "manual",
                entity.getMotivoConsulta(),
                therapistId,
                therapistName,
                birthDateStr,
                entity.getEdadCalculada(),
                consentimientoDTO,
                entity.getQuienCompletaRegistro() != null ? entity.getQuienCompletaRegistro() : "PACIENTE",
                representanteDTO,
                entity.getTelefono(),
                Boolean.TRUE.equals(entity.getConsentimientoRepresentanteFirmado()),
                entity.getSessionFrequency() != null ? entity.getSessionFrequency() : "semanal"
        );
    }

    public PacienteEntity toEntity(PacienteCreateRequest req, TerapeutaEntity terapeuta) {
        if (req == null) return null;

        String[] parts = splitName(req.name());
        String nombre = parts[0];
        String apellidos = parts[1];

        LocalDate fechaNac = parseDate(req.fechaNacimiento() != null ? req.fechaNacimiento() : req.birthDate());
        int edad = req.edadCalculada() != null
                ? req.edadCalculada()
                : (fechaNac != null ? Period.between(fechaNac, LocalDate.now()).getYears() : 25);

        String estadoConsentimiento;
        if (req.capacidadConsentimiento() != null && req.capacidadConsentimiento().estado() != null) {
            estadoConsentimiento = req.capacidadConsentimiento().estado();
        } else {
            estadoConsentimiento = (edad < 18) ? "REPRESENTADO_POR_EDAD" : "AUTONOMO";
        }

        String motivoDet = req.capacidadConsentimiento() != null
                ? req.capacidadConsentimiento().motivo()
                : (edad < 18 ? "Menor de 18 años calculado automáticamente" : null);

        LocalDate fechaDet = req.capacidadConsentimiento() != null && req.capacidadConsentimiento().fechaDeterminacion() != null
                ? parseDate(req.capacidadConsentimiento().fechaDeterminacion())
                : LocalDate.now();

        String personaApoyoNombre = null;
        String personaApoyoContacto = null;
        String repParentesco = null;
        String repCorreo = null;

        if (req.representante() != null) {
            personaApoyoNombre = req.representante().nombreCompleto();
            personaApoyoContacto = req.representante().telefono();
            repParentesco = req.representante().parentesco();
            repCorreo = req.representante().correo();
        }

        String id = "pac-" + UUID.randomUUID().toString().substring(0, 8);

        return PacienteEntity.builder()
                .id(id)
                .nombre(nombre)
                .apellidos(apellidos)
                .curp(req.curp() != null ? req.curp() : "CURP-GENERADO")
                .fechaNacimiento(fechaNac != null ? fechaNac : LocalDate.of(2000, 1, 1))
                .edadCalculada(edad)
                .telefono(req.phone() != null ? req.phone() : req.telefonoPaciente())
                .email(req.email())
                .estadoConsentimiento(estadoConsentimiento)
                .status(req.status() != null ? req.status() : "activo")
                .riskLevel(req.riskLevel() != null ? req.riskLevel() : "bajo")
                .registryMode(req.registryMode() != null ? req.registryMode() : "manual")
                .sessionFrequency(req.sessionFrequency() != null ? req.sessionFrequency() : "semanal")
                .quienCompletaRegistro(req.quienCompletaRegistro() != null ? req.quienCompletaRegistro() : (edad < 18 ? "FAMILIAR_O_APOYO" : "PACIENTE"))
                .motivoConsulta(req.motif())
                .terapeuta(terapeuta)
                .fechaDeterminacionConsentimiento(fechaDet)
                .motivoDeterminacionConsentimiento(motivoDet)
                .personaDeApoyoNombre(personaApoyoNombre)
                .personaDeApoyoContacto(personaApoyoContacto)
                .representanteParentesco(repParentesco)
                .representanteCorreo(repCorreo)
                .consentimientoRepresentanteFirmado(Boolean.TRUE.equals(req.consentimientoRepresentanteFirmado()))
                .build();
    }

    public void applyPatch(PacienteEntity entity, PacientePatchRequest cambios) {
        if (entity == null || cambios == null) return;

        if (cambios.name() != null && !cambios.name().isBlank()) {
            String[] parts = splitName(cambios.name());
            entity.setNombre(parts[0]);
            entity.setApellidos(parts[1]);
        }
        if (cambios.phone() != null) entity.setTelefono(cambios.phone());
        if (cambios.email() != null) entity.setEmail(cambios.email());
        if (cambios.status() != null) entity.setStatus(cambios.status());
        if (cambios.riskLevel() != null) entity.setRiskLevel(cambios.riskLevel());
        if (cambios.motif() != null) entity.setMotivoConsulta(cambios.motif());
        if (cambios.sessionFrequency() != null) entity.setSessionFrequency(cambios.sessionFrequency());

        if (cambios.capacidadConsentimiento() != null) {
            if (cambios.capacidadConsentimiento().estado() != null) {
                entity.setEstadoConsentimiento(cambios.capacidadConsentimiento().estado());
            }
            if (cambios.capacidadConsentimiento().motivo() != null) {
                entity.setMotivoDeterminacionConsentimiento(cambios.capacidadConsentimiento().motivo());
            }
            if (cambios.capacidadConsentimiento().fechaDeterminacion() != null) {
                entity.setFechaDeterminacionConsentimiento(parseDate(cambios.capacidadConsentimiento().fechaDeterminacion()));
            }
        }

        if (cambios.representante() != null) {
            if (cambios.representante().nombreCompleto() != null) {
                entity.setPersonaDeApoyoNombre(cambios.representante().nombreCompleto());
            }
            if (cambios.representante().telefono() != null) {
                entity.setPersonaDeApoyoContacto(cambios.representante().telefono());
            }
            if (cambios.representante().parentesco() != null) {
                entity.setRepresentanteParentesco(cambios.representante().parentesco());
            }
            if (cambios.representante().correo() != null) {
                entity.setRepresentanteCorreo(cambios.representante().correo());
            }
        }

        if (cambios.consentimientoRepresentanteFirmado() != null) {
            entity.setConsentimientoRepresentanteFirmado(cambios.consentimientoRepresentanteFirmado());
        }
    }

    private String buildFullName(String nombre, String apellidos) {
        if (nombre == null) return apellidos != null ? apellidos : "";
        if (apellidos == null || apellidos.isBlank()) return nombre.trim();
        return (nombre.trim() + " " + apellidos.trim()).trim();
    }

    private String[] splitName(String fullName) {
        if (fullName == null || fullName.isBlank()) return new String[]{"", ""};
        String trimmed = fullName.trim();
        int firstSpace = trimmed.indexOf(' ');
        if (firstSpace == -1) {
            return new String[]{trimmed, ""};
        }
        return new String[]{trimmed.substring(0, firstSpace).trim(), trimmed.substring(firstSpace + 1).trim()};
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr.trim().substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }
}
