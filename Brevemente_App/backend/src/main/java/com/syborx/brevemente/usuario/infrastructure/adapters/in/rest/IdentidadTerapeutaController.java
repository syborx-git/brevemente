package com.syborx.brevemente.usuario.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.usuario.application.ports.in.UsuarioAdminUseCase;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.RegistroIdentidadTerapeutaRequest;
import com.syborx.brevemente.usuario.infrastructure.adapters.in.rest.dto.UsuarioAdminDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Onboarding de identidad clínica del administrador (D-13/D-14).
 * El administrador completa su identidad como terapeuta para desbloquear los módulos clínicos.
 * Anti-IDOR: actúa únicamente sobre el usuario autenticado (`principal.sub()`).
 */
@RestController
@RequestMapping("/usuario")
@RequiredArgsConstructor
public class IdentidadTerapeutaController {

    private final UsuarioAdminUseCase usuarioAdminUseCase;

    @PostMapping("/identidad-terapeuta")
    @PreAuthorize("hasAuthority('ADMIN_USUARIOS')")
    public UsuarioAdminDTO registrar(@Valid @RequestBody RegistroIdentidadTerapeutaRequest request,
                                     @AuthenticationPrincipal UsuarioAutenticado principal) {
        String usuarioId = principal != null ? principal.sub() : null;
        return usuarioAdminUseCase.registrarIdentidadTerapeuta(usuarioId, request, usuarioId);
    }

    @PostMapping("/identidad-terapeuta/baja")
    @PreAuthorize("hasAuthority('ADMIN_USUARIOS')")
    public UsuarioAdminDTO darBaja(@AuthenticationPrincipal UsuarioAutenticado principal) {
        String usuarioId = principal != null ? principal.sub() : null;
        return usuarioAdminUseCase.darBajaPerfilTerapeuta(usuarioId, usuarioId);
    }
}
