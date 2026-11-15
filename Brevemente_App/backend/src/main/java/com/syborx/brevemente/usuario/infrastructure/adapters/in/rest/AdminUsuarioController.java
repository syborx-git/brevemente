package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest;

import com.syborx.brevemente.usuario.application.ports.in.UsuarioAdminUseCase;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.AsignacionesRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.CambiarEstadoRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.CrearUsuarioRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.EditarUsuarioRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.PasswordTemporalResponse;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.ResumenUsuariosDTO;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.ResetPasswordRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioAdminDTO;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioCreadoDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN_USUARIOS')")
public class AdminUsuarioController {

    private final UsuarioAdminUseCase usuarioAdminUseCase;

    @GetMapping
    public ResumenUsuariosDTO listar(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "todos") String rol,
            @RequestParam(defaultValue = "todos") String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return usuarioAdminUseCase.listar(q, rol, estado, page, size);
    }

    @GetMapping("/{id}")
    public UsuarioAdminDTO obtener(@PathVariable String id) {
        return usuarioAdminUseCase.obtener(id);
    }

    @PostMapping
    public ResponseEntity<UsuarioCreadoDTO> crear(@Valid @RequestBody CrearUsuarioRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(usuarioAdminUseCase.crear(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public UsuarioAdminDTO editar(@PathVariable String id,
                                  @Valid @RequestBody EditarUsuarioRequest request,
                                  Authentication authentication) {
        return usuarioAdminUseCase.editar(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/estado")
    public UsuarioAdminDTO cambiarEstado(@PathVariable String id,
                                         @Valid @RequestBody CambiarEstadoRequest request,
                                         Authentication authentication) {
        return usuarioAdminUseCase.cambiarEstado(id, request, authentication.getName());
    }

    @GetMapping("/{id}/asignaciones")
    public List<String> obtenerAsignaciones(@PathVariable String id) {
        return usuarioAdminUseCase.obtenerAsignaciones(id);
    }

    @PutMapping("/{id}/asignaciones")
    public UsuarioAdminDTO asignarTerapeutas(@PathVariable String id,
                                             @Valid @RequestBody AsignacionesRequest request,
                                             Authentication authentication) {
        return usuarioAdminUseCase.asignarTerapeutas(id, request, authentication.getName());
    }

    @PostMapping("/{id}/password-temporal")
    public PasswordTemporalResponse resetPassword(@PathVariable String id,
                                                  @Valid @RequestBody ResetPasswordRequest request,
                                                  Authentication authentication) {
        return usuarioAdminUseCase.resetPassword(id, request, authentication.getName());
    }
}
