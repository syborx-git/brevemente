package com.syborx.brevemente.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "BreveMente — Plataforma Clínica TBE (SDOP)",
                version = "1.0.0",
                description = "API REST empresarial bajo Arquitectura Hexagonal (Ports & Adapters) para la gestión de expedientes clínicos, consentimiento normativo e IA asistiva (LEVA).",
                contact = @Contact(
                        name = "SyborX Clinical Engineering",
                        email = "github@syborx.com",
                        url = "https://syborx.com"
                ),
                license = @License(
                        name = "Proprietary / SyborX Healthcare Standards"
                )
        ),
        servers = {
                @Server(url = "/api/v1", description = "Servidor Local / Context Path")
        }
)
public class OpenApiConfig {
}
