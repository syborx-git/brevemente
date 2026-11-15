package com.syborx.brevemente.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            log.info("[Flyway Auto-Repair] Ejecutando flyway.repair() preventivo para limpiar posibles fallos previos en historial...");
            try {
                flyway.repair();
            } catch (Exception e) {
                log.warn("[Flyway Auto-Repair] Excepción en flyway.repair() (puede ser ignorada): {}", e.getMessage());
            }
            log.info("[Flyway Migrate] Ejecutando migraciones pendientes con flyway.migrate()...");
            flyway.migrate();
        };
    }
}
