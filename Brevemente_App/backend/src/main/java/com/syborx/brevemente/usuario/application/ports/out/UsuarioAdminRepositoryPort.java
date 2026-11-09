package com.syborx.brevemente.usuario.application.ports.out;

import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioAdminDTO;

import java.util.List;
import java.util.Optional;

public interface UsuarioAdminRepositoryPort {

    List<UsuarioAdminDTO> listar(String q, String rol, String estado, int offset, int limit);

    long contar(String q, String rol, String estado);

    Optional<UsuarioAdminDTO> findById(String id);

    boolean existeEmail(String email, String excluirId);

    boolean existeCedula(String cedula);

    void insertarUsuario(String id, String nombre, String apellidos, String email, String estado,
                         boolean activo, String passwordHash, List<String> roles,
                         String cedulaProfesional, String especialidad);

    void actualizarUsuario(String id, String nombre, String apellidos, String email,
                           List<String> roles, String cedulaProfesional, String especialidad);

    void actualizarEstado(String id, String estado, boolean activo);

    void sincronizarTerapeutaActivo(String usuarioId, boolean activo);

    void reemplazarAsignaciones(String usuarioId, List<String> terapeutaIds);

    long contarAdminsActivos();
}
