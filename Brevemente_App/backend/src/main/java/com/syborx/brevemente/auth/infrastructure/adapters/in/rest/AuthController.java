package com.syborx.brevemente.auth.infrastructure.adapters.in.rest;

import com.syborx.brevemente.auth.application.ports.in.AutenticarUseCase;
import com.syborx.brevemente.auth.application.ports.in.GestionarSesionUseCase;
import com.syborx.brevemente.auth.domain.model.Usuario;
import com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto.LoginRequest;
import com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto.TokenResponse;
import com.syborx.brevemente.auth.infrastructure.adapters.in.rest.dto.UserResponseDTO;
import com.syborx.brevemente.auth.infrastructure.adapters.in.rest.mapper.AuthRestMapper;
import com.syborx.brevemente.auth.infrastructure.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Autenticación de personal clínico (JWT PBAC & Refresh Token)")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";
    private static final String REFRESH_COOKIE_PATH = "/api/v1/auth";

    private final AutenticarUseCase autenticarUseCase;
    private final GestionarSesionUseCase gestionarSesionUseCase;
    private final JwtService jwtService;
    private final AuthRestMapper authRestMapper;

    @Value("${app.jwt.refresh-expiration-days:7}")
    private long refreshExpirationDays;

    @Value("${app.security.cookie-secure:false}")
    private boolean cookieSecure;

    @PostMapping("/login")
    @Operation(summary = "Autentica al usuario, emite un access token JWT y fija el refresh token en cookie HttpOnly")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Login exitoso",
                    content = @Content(schema = @Schema(implementation = TokenResponse.class))
            ),
            @ApiResponse(responseCode = "401", description = "Credenciales inválidas"),
            @ApiResponse(responseCode = "429", description = "Demasiados intentos de acceso (bloqueo temporal)")
    })
    public ResponseEntity<TokenResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest
    ) {
        String ip = resolveClientIp(servletRequest);
        Usuario usuario = autenticarUseCase.autenticar(request.email(), request.password(), ip);
        String accessToken = jwtService.generarToken(usuario);
        String refreshToken = gestionarSesionUseCase.emitirRefreshToken(usuario.getId(), ip);

        ResponseCookie cookie = buildRefreshCookie(refreshToken, Duration.ofDays(refreshExpirationDays));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new TokenResponse(accessToken, authRestMapper.toUserResponse(usuario)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renueva el access token mediante rotación de refresh token (cookie HttpOnly)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token renovado exitosamente"),
            @ApiResponse(responseCode = "401", description = "Refresh token inválido, expirado o reutilizado")
    })
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            HttpServletRequest servletRequest
    ) {
        String ip = resolveClientIp(servletRequest);
        GestionarSesionUseCase.SesionRenovada renovada = gestionarSesionUseCase.renovar(refreshToken, ip);

        String newAccessToken = jwtService.generarToken(renovada.usuario());
        ResponseCookie cookie = buildRefreshCookie(renovada.refreshToken(), Duration.ofDays(refreshExpirationDays));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new TokenResponse(newAccessToken, authRestMapper.toUserResponse(renovada.usuario())));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cierra sesión: revoca refresh tokens e invalida access tokens en servidor")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        String ip = resolveClientIp(servletRequest);
        String usuarioId = authentication != null && authentication.isAuthenticated()
                ? authentication.getName()
                : null;

        gestionarSesionUseCase.cerrarSesion(refreshToken, usuarioId, ip);

        ResponseCookie clearCookie = buildRefreshCookie("", Duration.ZERO);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    @GetMapping("/me")
    @Operation(summary = "Obtiene los datos del usuario autenticado y sus permisos vigentes")
    public ResponseEntity<UserResponseDTO> me(Authentication authentication) {
        Usuario usuario = gestionarSesionUseCase.obtenerUsuario(authentication.getName());
        return ResponseEntity.ok(authRestMapper.toUserResponse(usuario));
    }

    private ResponseCookie buildRefreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path(REFRESH_COOKIE_PATH)
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "desconocida";
    }
}
