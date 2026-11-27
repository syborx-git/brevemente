package com.syborx.brevemente.usuario.application.service;

import com.syborx.brevemente.auth.application.ports.in.GenerarPasswordTemporalUseCase;
import com.syborx.brevemente.auth.application.ports.in.RevocarSesionesUsuarioUseCase;
import com.syborx.brevemente.auth.application.ports.in.VerificarPasswordActualUseCase;
import com.syborx.brevemente.auth.application.ports.out.AuditoriaGestionPort;
import com.syborx.brevemente.auth.domain.model.PasswordTemporal;
import com.syborx.brevemente.usuario.application.ports.in.UsuarioAdminUseCase;
import com.syborx.brevemente.usuario.application.ports.out.UsuarioAdminRepositoryPort;
import com.syborx.brevemente.usuario.domain.exception.UsuarioConflictException;
import com.syborx.brevemente.usuario.domain.exception.UsuarioNoEncontradoException;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.AsignacionesRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.CambiarEstadoRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.CrearUsuarioRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.EditarUsuarioRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.EstadoUsuario;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.PasswordTemporalResponse;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.PermisosPorRolDTO;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.ResumenUsuariosDTO;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.RegistroIdentidadTerapeutaRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.ResetPasswordRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioAdminDTO;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioCreadoDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class UsuarioAdminApplicationService implements UsuarioAdminUseCase {

    private static final Set<String> ROLES_VALIDOS = Set.of(
            "admin_platform", "supervisor", "therapist", "assistant");

    private static final Pattern CEDULA_PATTERN = Pattern.compile("^\\d{6,8}$");

    private final UsuarioAdminRepositoryPort repositoryPort;
    private final GenerarPasswordTemporalUseCase generarPasswordTemporalUseCase;
    private final RevocarSesionesUsuarioUseCase revocarSesionesUsuarioUseCase;
    private final VerificarPasswordActualUseCase verificarPasswordActualUseCase;
    private final AuditoriaGestionPort auditoriaGestionPort;

    public UsuarioAdminApplicationService(
            UsuarioAdminRepositoryPort repositoryPort,
            GenerarPasswordTemporalUseCase generarPasswordTemporalUseCase,
            RevocarSesionesUsuarioUseCase revocarSesionesUsuarioUseCase,
            VerificarPasswordActualUseCase verificarPasswordActualUseCase,
            AuditoriaGestionPort auditoriaGestionPort) {
        this.repositoryPort = repositoryPort;
        this.generarPasswordTemporalUseCase = generarPasswordTemporalUseCase;
        this.revocarSesionesUsuarioUseCase = revocarSesionesUsuarioUseCase;
        this.verificarPasswordActualUseCase = verificarPasswordActualUseCase;
        this.auditoriaGestionPort = auditoriaGestionPort;
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenUsuariosDTO listar(String q, String rol, String estado, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int offset = safePage * safeSize;
        List<UsuarioAdminDTO> items = repositoryPort.listar(q, rol, estado, offset, safeSize);
        long total = repositoryPort.contar(q, rol, estado);
        return new ResumenUsuariosDTO(items, total, safePage, safeSize);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermisosPorRolDTO> listarPermisosPorRol() {
        return repositoryPort.listarPermisosPorRol();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioAdminDTO obtener(String id) {
        return repositoryPort.findById(id)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado"));
    }

    @Override
    @Transactional
    public UsuarioCreadoDTO crear(CrearUsuarioRequest request, String actorId) {
        validarRoles(request.roles());
        validarEstado(request.estado());
        validarCedula(request.roles(), request.cedulaProfesional());

        String email = request.email().trim().toLowerCase();
        if (repositoryPort.existeEmail(email, null)) {
            throw new UsuarioConflictException("El correo ya está registrado");
        }
        if (request.roles().contains("therapist") && repositoryPort.existeCedula(request.cedulaProfesional())) {
            throw new UsuarioConflictException("La cédula profesional ya está registrada");
        }

        String id = UUID.randomUUID().toString();
        boolean activo = "activo".equals(request.estado());
        repositoryPort.insertarUsuario(id, request.nombre().trim(), request.apellidos().trim(), email,
                request.estado(), activo, "{pendiente}", request.roles(),
                request.cedulaProfesional(), request.especialidad());

        PasswordTemporal temporal = generarPasswordTemporalUseCase.generarPasswordTemporal(id, actorId, "ALTA");
        return new UsuarioCreadoDTO(obtener(id), temporal.valor());
    }

    @Override
    @Transactional
    public UsuarioAdminDTO editar(String id, EditarUsuarioRequest request, String actorId) {
        verificarPasswordActualUseCase.verificar(actorId, request.passwordConfirmacion());
        validarRoles(request.roles());
        validarCedula(request.roles(), request.cedulaProfesional());

        UsuarioAdminDTO actual = obtener(id);
        String email = request.email().trim().toLowerCase();
        if (repositoryPort.existeEmail(email, id)) {
            throw new UsuarioConflictException("El correo ya está registrado");
        }
        if (request.roles().contains("therapist") && request.cedulaProfesional() != null
                && !request.cedulaProfesional().equals(actual.cedulaProfesional())
                && repositoryPort.existeCedula(request.cedulaProfesional())) {
            throw new UsuarioConflictException("La cédula profesional ya está registrada");
        }

        boolean rolesCambiaron = !new HashSet<>(actual.roles()).equals(new HashSet<>(request.roles()));
        repositoryPort.actualizarUsuario(id, request.nombre().trim(), request.apellidos().trim(), email,
                request.roles(), request.cedulaProfesional(), request.especialidad());

        if (rolesCambiaron) {
            revocarSesionesUsuarioUseCase.revocar(id, "CAMBIO_ROL", actorId, null);
        }
        auditoriaGestionPort.registrar(actorId, "EDICION_USUARIO", "USUARIO", id, Map.of());
        return obtener(id);
    }

    @Override
    @Transactional
    public UsuarioAdminDTO cambiarEstado(String id, CambiarEstadoRequest request, String actorId) {
        verificarPasswordActualUseCase.verificar(actorId, request.passwordConfirmacion());
        EstadoUsuario nuevo = EstadoUsuario.fromValor(request.estado());
        if (nuevo == null) {
            throw new IllegalArgumentException("Estado inválido: " + request.estado());
        }

        UsuarioAdminDTO actual = obtener(id);
        if (id.equals(actorId) && !nuevo.esActivo()) {
            throw new UsuarioConflictException("No puedes suspenderte a ti mismo");
        }
        if (actual.roles().contains("admin_platform") && "activo".equals(actual.estado()) && !nuevo.esActivo()
                && repositoryPort.contarAdminsActivos() <= 1) {
            throw new UsuarioConflictException("No puedes suspender al último administrador activo");
        }

        repositoryPort.actualizarEstado(id, nuevo.getValor(), nuevo.esActivo());
        repositoryPort.sincronizarTerapeutaActivo(id, nuevo.esActivo());
        revocarSesionesUsuarioUseCase.revocar(id, "CAMBIO_ESTADO", actorId, null);
        auditoriaGestionPort.registrar(actorId, "CAMBIO_ESTADO_USUARIO", "USUARIO", id,
                Map.of("estado", nuevo.getValor()));
        return obtener(id);
    }

    @Override
    @Transactional
    public UsuarioAdminDTO registrarIdentidadTerapeuta(String usuarioId, RegistroIdentidadTerapeutaRequest request, String actorId) {
        if (usuarioId == null || usuarioId.isBlank()) {
            throw new UsuarioNoEncontradoException("Usuario no autenticado");
        }
        validarFormatoCedula(request.cedulaProfesional());
        verificarPasswordActualUseCase.verificar(actorId, request.passwordConfirmacion());
        if (repositoryPort.existeCedula(request.cedulaProfesional())) {
            throw new UsuarioConflictException("La cédula profesional ya está registrada");
        }
        repositoryPort.crearVinculoTerapeuta(usuarioId, request.cedulaProfesional(), request.especialidad());
        repositoryPort.asignarRol(usuarioId, "therapist");
        revocarSesionesUsuarioUseCase.revocar(usuarioId, "REGISTRO_TERAPEUTA", actorId, null);
        auditoriaGestionPort.registrar(actorId, "REGISTRO_IDENTIDAD_TERAPEUTA", "USUARIO", usuarioId, Map.of());
        return obtener(usuarioId);
    }

    @Override
    @Transactional
    public UsuarioAdminDTO darBajaPerfilTerapeuta(String usuarioId, String actorId) {
        if (usuarioId == null || usuarioId.isBlank()) {
            throw new UsuarioNoEncontradoException("Usuario no autenticado");
        }
        UsuarioAdminDTO actual = obtener(usuarioId);
        if (actual.roles().contains("therapist") && !actual.roles().contains("admin_platform")) {
            throw new UsuarioConflictException("No puedes dar de baja tu perfil de terapeuta: es tu único rol");
        }
        repositoryPort.quitarRol(usuarioId, "therapist");
        repositoryPort.sincronizarTerapeutaActivo(usuarioId, false);
        revocarSesionesUsuarioUseCase.revocar(usuarioId, "BAJA_TERAPEUTA", actorId, null);
        auditoriaGestionPort.registrar(actorId, "BAJA_IDENTIDAD_TERAPEUTA", "USUARIO", usuarioId, Map.of());
        return obtener(usuarioId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> obtenerAsignaciones(String id) {
        return obtener(id).terapeutaIds();
    }

    @Override
    @Transactional
    public UsuarioAdminDTO asignarTerapeutas(String id, AsignacionesRequest request, String actorId) {
        UsuarioAdminDTO usuario = obtener(id);
        if (!usuario.roles().contains("assistant")) {
            throw new UsuarioConflictException("Solo los asistentes pueden tener terapeutas asignados");
        }
        repositoryPort.reemplazarAsignaciones(id, request.terapeutaIds());
        auditoriaGestionPort.registrar(actorId, "ASIGNACION_TERAPEUTA", "USUARIO", id,
                Map.of("terapeutaIds", request.terapeutaIds()));
        return obtener(id);
    }

    @Override
    @Transactional
    public PasswordTemporalResponse resetPassword(String id, ResetPasswordRequest request, String actorId) {
        verificarPasswordActualUseCase.verificar(actorId, request.passwordConfirmacion());
        PasswordTemporal temporal = generarPasswordTemporalUseCase.generarPasswordTemporal(id, actorId, "RESET");
        return new PasswordTemporalResponse(temporal.valor());
    }

    private void validarRoles(List<String> roles) {
        for (String r : roles) {
            if (!ROLES_VALIDOS.contains(r)) {
                throw new IllegalArgumentException("Rol inválido: " + r);
            }
        }
    }

    private void validarEstado(String estado) {
        if (EstadoUsuario.fromValor(estado) == null) {
            throw new IllegalArgumentException("Estado inválido: " + estado);
        }
    }

    private void validarCedula(List<String> roles, String cedula) {
        if (!roles.contains("therapist")) {
            return;
        }
        if (cedula == null || cedula.isBlank()) {
            throw new IllegalArgumentException("La cédula profesional es requerida para terapeutas");
        }
        validarFormatoCedula(cedula);
    }

    private void validarFormatoCedula(String cedula) {
        if (cedula == null || !CEDULA_PATTERN.matcher(cedula.trim()).matches()) {
            throw new IllegalArgumentException("La cédula profesional debe ser numérica, de 6 a 8 dígitos");
        }
    }
}
