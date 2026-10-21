package com.syborx.brevemente.expediente.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auth.infrastructure.security.UsuarioAutenticado;
import com.syborx.brevemente.expediente.application.ports.in.FirmarConsentimientoUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pacientes")
@RequiredArgsConstructor
@Tag(name = "Consentimiento", description = "Firma de consentimiento informado del representante (desbloquea la agenda)")
public class ConsentimientoRestController {

    private final FirmarConsentimientoUseCase firmarConsentimientoUseCase;

    @PostMapping("/{pacienteId}/consentimiento/firmar")
    @PreAuthorize("hasAuthority('EXPEDIENTE_FIRMAR')")
    @Operation(summary = "Registrar la firma de consentimiento del representante")
    public ResponseEntity<Void> firmar(
            @PathVariable String pacienteId,
            @AuthenticationPrincipal UsuarioAutenticado principal) {
        firmarConsentimientoUseCase.firmar(pacienteId, principal != null ? principal.sub() : null);
        return ResponseEntity.noContent().build();
    }
}
