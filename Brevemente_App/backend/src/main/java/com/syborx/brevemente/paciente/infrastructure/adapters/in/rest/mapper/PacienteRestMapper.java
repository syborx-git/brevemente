package com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.mapper;

import com.syborx.brevemente.paciente.domain.CurpParser;
import com.syborx.brevemente.paciente.domain.model.CapacidadConsentimiento;
import com.syborx.brevemente.paciente.domain.model.ContactoEmergencia;
import com.syborx.brevemente.paciente.domain.model.Domicilio;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.domain.model.RepresentanteLegal;
import com.syborx.brevemente.paciente.infrastructure.adapters.in.rest.dto.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;

@Component
public class PacienteRestMapper {

    public PacienteResponseDTO toResponse(Paciente domain) {
        if (domain == null) return null;

        String birthDateStr = domain.getFechaNacimiento() != null ? domain.getFechaNacimiento().toString() : "";
        String regDateStr = domain.getFechaRegistro() != null ? domain.getFechaRegistro().toString() : LocalDate.now().toString();

        CapacidadConsentimientoDTO consentDTO = null;
        if (domain.getCapacidadConsentimiento() != null) {
            consentDTO = new CapacidadConsentimientoDTO(
                    domain.getCapacidadConsentimiento().estado(),
                    domain.getCapacidadConsentimiento().determinadoPor(),
                    domain.getCapacidadConsentimiento().fechaDeterminacion() != null 
                            ? domain.getCapacidadConsentimiento().fechaDeterminacion().toString() 
                            : null,
                    domain.getCapacidadConsentimiento().fechaRevision() != null 
                            ? domain.getCapacidadConsentimiento().fechaRevision().toString() 
                            : null,
                    domain.getCapacidadConsentimiento().motivo()
            );
        }

        RepresentanteLegalDTO repDTO = null;
        if (domain.getRepresentante() != null) {
            repDTO = new RepresentanteLegalDTO(
                    domain.getRepresentante().nombreCompleto(),
                    domain.getRepresentante().parentesco(),
                    domain.getRepresentante().telefono(),
                    domain.getRepresentante().correo(),
                    domain.getRepresentante().documentoIdentificacion(),
                    domain.getRepresentante().documentoVinculo(),
                    domain.getRepresentante().otroProgenitorInformado()
            );
        }

        return new PacienteResponseDTO(
                domain.getId(),
                domain.getNombreCompleto(),
                domain.getTelefono(),
                domain.getEmail(),
                birthDateStr,
                domain.getCurp(),
                regDateStr,
                domain.getStatus() != null ? domain.getStatus() : "activo",
                domain.getRiskLevel() != null ? domain.getRiskLevel() : "bajo",
                domain.getRegistryMode() != null ? domain.getRegistryMode() : "manual",
                domain.getMotivoConsulta(),
                domain.getTerapeutaId(),
                domain.getTerapeutaNombre(),
                birthDateStr,
                domain.getEdadCalculada(),
                consentDTO,
                domain.getQuienCompletaRegistro() != null ? domain.getQuienCompletaRegistro() : "PACIENTE",
                repDTO,
                domain.getTelefono(),
                Boolean.TRUE.equals(domain.getConsentimientoRepresentanteFirmado()),
                domain.getSessionFrequency() != null ? domain.getSessionFrequency() : "semanal",
                domain.getRfc(),
                domain.getSexo(),
                domain.getLugarNacimiento(),
                domain.getEstadoCivil(),
                domain.getEscolaridad(),
                domain.getOcupacion(),
                domain.getReligion(),
                toDomicilioDTO(domain.getDomicilio()),
                toContactoDTO(domain.getContactoEmergencia()),
                domain.getSedeId()
        );
    }

    public Paciente toDomain(PacienteCreateRequest request) {
        if (request == null) return null;

        String[] parts = splitName(request.name());
        LocalDate fechaNac = parseDate(request.fechaNacimiento() != null ? request.fechaNacimiento() : request.birthDate());
        // Paridad con la demo: si no se capturó fecha de nacimiento, se deriva de la CURP.
        if (fechaNac == null) {
            fechaNac = CurpParser.extraerFechaNacimiento(request.curp()).orElse(null);
        }
        int edad = request.edadCalculada() != null 
                ? request.edadCalculada() 
                : (fechaNac != null ? Period.between(fechaNac, LocalDate.now()).getYears() : 25);

        CapacidadConsentimiento consentimiento = null;
        if (request.capacidadConsentimiento() != null) {
            consentimiento = new CapacidadConsentimiento(
                    request.capacidadConsentimiento().estado(),
                    request.capacidadConsentimiento().determinadoPor(),
                    parseDate(request.capacidadConsentimiento().fechaDeterminacion()),
                    parseDate(request.capacidadConsentimiento().fechaRevision()),
                    request.capacidadConsentimiento().motivo()
            );
        }

        RepresentanteLegal representante = null;
        if (request.representante() != null) {
            representante = new RepresentanteLegal(
                    request.representante().nombreCompleto(),
                    request.representante().parentesco(),
                    request.representante().telefono(),
                    request.representante().correo(),
                    request.representante().documentoIdentificacion(),
                    request.representante().documentoVinculo(),
                    request.representante().otroProgenitorInformado()
            );
        }

        return Paciente.builder()
                .nombre(parts[0])
                .apellidos(parts[1])
                .curp(request.curp())
                .fechaNacimiento(fechaNac)
                .edadCalculada(edad)
                .telefono(request.phone() != null ? request.phone() : request.telefonoPaciente())
                .email(request.email())
                .status(request.status() != null ? request.status() : "activo")
                .riskLevel(request.riskLevel() != null ? request.riskLevel() : "bajo")
                .registryMode(request.registryMode() != null ? request.registryMode() : "manual")
                .sessionFrequency(request.sessionFrequency() != null ? request.sessionFrequency() : "semanal")
                .quienCompletaRegistro(request.quienCompletaRegistro() != null ? request.quienCompletaRegistro() : (edad < 18 ? "FAMILIAR_O_APOYO" : "PACIENTE"))
                .motivoConsulta(request.motif())
                .terapeutaId(request.therapistId())
                .rfc(request.rfc())
                .sexo(request.sexo())
                .lugarNacimiento(request.lugarNacimiento())
                .estadoCivil(request.estadoCivil())
                .escolaridad(request.escolaridad())
                .ocupacion(request.ocupacion())
                .religion(request.religion())
                .domicilio(toDomicilio(request.domicilio()))
                .contactoEmergencia(toContacto(request.contactoEmergencia()))
                .sedeId(request.sedeId())
                .capacidadConsentimiento(consentimiento)
                .representante(representante)
                .consentimientoRepresentanteFirmado(Boolean.TRUE.equals(request.consentimientoRepresentanteFirmado()))
                .build();
    }

    public Paciente toDomain(PacientePatchRequest patch) {
        if (patch == null) return null;

        String[] parts = patch.name() != null ? splitName(patch.name()) : new String[]{null, null};

        CapacidadConsentimiento consentimiento = null;
        if (patch.capacidadConsentimiento() != null) {
            consentimiento = new CapacidadConsentimiento(
                    patch.capacidadConsentimiento().estado(),
                    patch.capacidadConsentimiento().determinadoPor(),
                    parseDate(patch.capacidadConsentimiento().fechaDeterminacion()),
                    parseDate(patch.capacidadConsentimiento().fechaRevision()),
                    patch.capacidadConsentimiento().motivo()
            );
        }

        RepresentanteLegal representante = null;
        if (patch.representante() != null) {
            representante = new RepresentanteLegal(
                    patch.representante().nombreCompleto(),
                    patch.representante().parentesco(),
                    patch.representante().telefono(),
                    patch.representante().correo(),
                    null,
                    null,
                    null
            );
        }

        return Paciente.builder()
                .nombre(parts[0])
                .apellidos(parts[1])
                .telefono(patch.phone())
                .email(patch.email())
                .status(patch.status())
                .riskLevel(patch.riskLevel())
                .motivoConsulta(patch.motif())
                .sessionFrequency(patch.sessionFrequency())
                .rfc(patch.rfc())
                .sexo(patch.sexo())
                .lugarNacimiento(patch.lugarNacimiento())
                .estadoCivil(patch.estadoCivil())
                .escolaridad(patch.escolaridad())
                .ocupacion(patch.ocupacion())
                .religion(patch.religion())
                .domicilio(toDomicilio(patch.domicilio()))
                .contactoEmergencia(toContacto(patch.contactoEmergencia()))
                .capacidadConsentimiento(consentimiento)
                .representante(representante)
                .consentimientoRepresentanteFirmado(patch.consentimientoRepresentanteFirmado())
                .build();
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

    private DomicilioDTO toDomicilioDTO(Domicilio d) {
        return d == null ? null : new DomicilioDTO(d.calleNumero(), d.colonia(), d.codigoPostal(),
                d.municipio(), d.estadoDomicilio(), d.telefonoCasa(), d.telefonoCelular(), d.telefonoTrabajo());
    }

    private ContactoEmergenciaDTO toContactoDTO(ContactoEmergencia c) {
        return c == null ? null : new ContactoEmergenciaDTO(c.nombre(), c.parentesco(), c.telefono());
    }

    private Domicilio toDomicilio(DomicilioDTO d) {
        return d == null ? null : new Domicilio(d.calleNumero(), d.colonia(), d.codigoPostal(),
                d.municipio(), d.estadoDomicilio(), d.telefonoCasa(), d.telefonoCelular(), d.telefonoTrabajo());
    }

    private ContactoEmergencia toContacto(ContactoEmergenciaDTO c) {
        return c == null ? null : new ContactoEmergencia(c.nombre(), c.parentesco(), c.telefono());
    }
}
