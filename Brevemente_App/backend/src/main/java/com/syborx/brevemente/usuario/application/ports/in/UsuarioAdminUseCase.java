package com.syborx.brevemente.usuario.application.ports.in;

import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.AsignacionesRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.CambiarEstadoRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.CrearUsuarioRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.EditarUsuarioRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.PasswordTemporalResponse;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.ResumenUsuariosDTO;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.ResetPasswordRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioAdminDTO;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioCreadoDTO;

import java.util.List;

/** Casos de uso de gestión de usuarios y roles (Módulo 2). */
public interface UsuarioAdminUseCase {

    ResumenUsuariosDTO listar(String q, String rol, String estado, int page, int size);

    UsuarioAdminDTO obtener(String id);

    UsuarioCreadoDTO crear(CrearUsuarioRequest request, String actorId);

    UsuarioAdminDTO editar(String id, EditarUsuarioRequest request, String actorId);

    UsuarioAdminDTO cambiarEstado(String id, CambiarEstadoRequest request, String actorId);

    List<String> obtenerAsignaciones(String id);

    UsuarioAdminDTO asignarTerapeutas(String id, AsignacionesRequest request, String actorId);

    PasswordTemporalResponse resetPassword(String id, ResetPasswordRequest request, String actorId);
}
