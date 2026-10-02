package com.syborx.brevemente.auth.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auth.application.ports.in.AutenticarUseCase;
import com.syborx.brevemente.auth.domain.model.Usuario;
import com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto.LoginRequest;
import com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto.TokenResponse;
import com.syborx.brevemente.auth.infrastructure.adapters.in.rest.mapper.AuthRestMapper;
import com.syborx.brevemente.auth.infrastructure.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Autenticación de personal clínico (JWT multi-rol)")
public class AuthController {

    private final AutenticarUseCase autenticarUseCase;
    private final JwtService jwtService;
    private final AuthRestMapper authRestMapper;

    @PostMapping("/login")
    @Operation(summary = "Autentica al usuario y emite un token JWT")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Login exitoso",
                    content = @Content(schema = @Schema(implementation = TokenResponse.class))
            ),
            @ApiResponse(responseCode = "401", description = "Credenciales inválidas")
    })
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        Usuario usuario = autenticarUseCase.autenticar(request.email(), request.password());
        String token = jwtService.generarToken(usuario);
        return ResponseEntity.ok(new TokenResponse(token, authRestMapper.toUserResponse(usuario)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cierra sesión (JWT stateless; el cliente descarta el token)")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
