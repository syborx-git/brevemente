package com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.mapper;

import com.syborx.brevemente.paciente.domain.model.CapacidadConsentimiento;
import com.syborx.brevemente.paciente.domain.model.ContactoEmergencia;
import com.syborx.brevemente.paciente.domain.model.Domicilio;
import com.syborx.brevemente.paciente.domain.model.Paciente;
import com.syborx.brevemente.paciente.domain.model.RepresentanteLegal;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.PacienteJpaEntity;
import com.syborx.brevemente.paciente.infrastructure.adapters.out.persistence.entity.TerapeutaJpaEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class PacientePersistenceMapper {

    public Paciente toDomain(PacienteJpaEntity entity, String terapeutaNombre) {
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
            String repTelefono = entity.getRepresentanteTelefono() != null
                    ? entity.getRepresentanteTelefono()
                    : entity.getPersonaDeApoyoContacto();
            representante = new RepresentanteLegal(
                    entity.getPersonaDeApoyoNombre(),
                    entity.getRepresentanteParentesco() != null ? entity.getRepresentanteParentesco() : "MADRE",
                    repTelefono,
                    entity.getRepresentanteCorreo(),
                    null,
                    null,
                    null
            );
        }

        Domicilio domicilio = null;
        if (entity.getCalleNumero() != null || entity.getColonia() != null
                || entity.getCodigoPostal() != null || entity.getMunicipio() != null
                || entity.getEstadoDomicilio() != null || entity.getTelefonoCasa() != null
                || entity.getTelefonoCelular() != null || entity.getTelefonoTrabajo() != null) {
            domicilio = new Domicilio(
                    entity.getCalleNumero(), entity.getColonia(), entity.getCodigoPostal(),
                    entity.getMunicipio(), entity.getEstadoDomicilio(),
                    entity.getTelefonoCasa(), entity.getTelefonoCelular(), entity.getTelefonoTrabajo());
        }

        ContactoEmergencia contactoEmergencia = null;
        if (entity.getContactoEmergenciaNombre() != null && !entity.getContactoEmergenciaNombre().isBlank()) {
            contactoEmergencia = new ContactoEmergencia(
                    entity.getContactoEmergenciaNombre(),
                    entity.getContactoEmergenciaParentesco(),
                    entity.getContactoEmergenciaTelefono());
        }

        String terapeutaId = entity.getTerapeuta() != null ? entity.getTerapeuta().getId() : null;

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
                .sedeId(entity.getSedeId())
                .protocoloId(entity.getProtocoloId())
                .usuarioId(entity.getUsuarioId())
                .rfc(entity.getRfc())
                .sexo(entity.getSexo())
                .lugarNacimiento(entity.getLugarNacimiento())
                .estadoCivil(entity.getEstadoCivil())
                .escolaridad(entity.getEscolaridad())
                .ocupacion(entity.getOcupacion())
                .religion(entity.getReligion())
                .domicilio(domicilio)
                .contactoEmergencia(contactoEmergencia)
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
        String repParentesco = null;
        String repCorreo = null;
        String repTelefono = null;

        if (domain.getRepresentante() != null) {
            personaApoyoNombre = domain.getRepresentante().nombreCompleto();
            repParentesco = domain.getRepresentante().parentesco();
            repCorreo = domain.getRepresentante().correo();
            repTelefono = domain.getRepresentante().telefono();
        }

        String calleNumero = null, colonia = null, codigoPostal = null, municipio = null, estadoDomicilio = null;
        String telefonoCasa = null, telefonoCelular = null, telefonoTrabajo = null;
        if (domain.getDomicilio() != null) {
            Domicilio d = domain.getDomicilio();
            calleNumero = d.calleNumero(); colonia = d.colonia(); codigoPostal = d.codigoPostal();
            municipio = d.municipio(); estadoDomicilio = d.estadoDomicilio();
            telefonoCasa = d.telefonoCasa(); telefonoCelular = d.telefonoCelular(); telefonoTrabajo = d.telefonoTrabajo();
        }

        String ceNombre = null, ceParentesco = null, ceTelefono = null;
        if (domain.getContactoEmergencia() != null) {
            ContactoEmergencia ce = domain.getContactoEmergencia();
            ceNombre = ce.nombre(); ceParentesco = ce.parentesco(); ceTelefono = ce.telefono();
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
                .sedeId(domain.getSedeId())
                .protocoloId(domain.getProtocoloId())
                .usuarioId(domain.getUsuarioId())
                .rfc(domain.getRfc())
                .sexo(domain.getSexo())
                .lugarNacimiento(domain.getLugarNacimiento())
                .estadoCivil(domain.getEstadoCivil())
                .escolaridad(domain.getEscolaridad())
                .ocupacion(domain.getOcupacion())
                .religion(domain.getReligion())
                .calleNumero(calleNumero)
                .colonia(colonia)
                .codigoPostal(codigoPostal)
                .municipio(municipio)
                .estadoDomicilio(estadoDomicilio)
                .telefonoCasa(telefonoCasa)
                .telefonoCelular(telefonoCelular)
                .telefonoTrabajo(telefonoTrabajo)
                .contactoEmergenciaNombre(ceNombre)
                .contactoEmergenciaParentesco(ceParentesco)
                .contactoEmergenciaTelefono(ceTelefono)
                .fechaDeterminacionConsentimiento(fechaDet)
                .motivoDeterminacionConsentimiento(motivoDet)
                .personaDeApoyoNombre(personaApoyoNombre)
                .representanteParentesco(repParentesco)
                .representanteCorreo(repCorreo)
                .representanteTelefono(repTelefono)
                .consentimientoRepresentanteFirmado(Boolean.TRUE.equals(domain.getConsentimientoRepresentanteFirmado()))
                .build();
    }
}
