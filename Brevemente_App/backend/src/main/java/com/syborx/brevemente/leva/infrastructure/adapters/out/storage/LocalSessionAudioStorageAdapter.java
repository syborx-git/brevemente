package com.syborx.brevemente.leva.infrastructure.adapters.out.storage;

import com.syborx.brevemente.leva.application.ports.out.SessionAudioStoragePort;
import com.syborx.brevemente.leva.domain.exception.LevaException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

/**
 * Adaptador de almacenamiento en disco local (volumen Docker persistente) para audios de sesión.
 */
@Slf4j
@Component
public class LocalSessionAudioStorageAdapter implements SessionAudioStoragePort {

    private final Path rootPath;

    public LocalSessionAudioStorageAdapter(
            @Value("${app.leva.audio-storage-path:./storage/sessions/audio}") String baseStoragePath
    ) {
        this.rootPath = Paths.get(baseStoragePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootPath);
            log.info("[Storage] Directorio de audios de sesión listo: {}", this.rootPath);
        } catch (IOException e) {
            log.error("[Storage] No se pudo crear el directorio de audios de sesión: {}", e.getMessage());
        }
    }

    @Override
    public StoredAudio store(String sessionId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new LevaException("El archivo de audio está vacío.");
        }
        String safeSession = sanitize(sessionId);
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio.webm";
        String finalName = System.currentTimeMillis() + "_" + sanitize(original);

        Path dir = rootPath.resolve(safeSession).normalize();
        Path target = dir.resolve(finalName).normalize();
        if (!target.startsWith(rootPath)) {
            throw new LevaException("Ruta de almacenamiento inválida.");
        }
        try {
            Files.createDirectories(dir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            String contentType = file.getContentType() != null && !file.getContentType().isBlank()
                    ? file.getContentType() : "audio/webm";
            log.info("[Storage] Audio de sesión {} guardado: {} ({} bytes)", sessionId, target, file.getSize());
            return new StoredAudio(rootPath.relativize(target).toString().replace('\\', '/'), contentType, file.getSize());
        } catch (IOException e) {
            throw new LevaException("No se pudo guardar el audio de la sesión: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<Resource> load(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return Optional.empty();
        Path path = rootPath.resolve(storagePath).normalize();
        if (!path.startsWith(rootPath) || !Files.isReadable(path)) return Optional.empty();
        return Optional.of(new FileSystemResource(path));
    }

    private String sanitize(String value) {
        String clean = value == null ? "unknown" : value.replaceAll("[^a-zA-Z0-9._-]", "_");
        return clean.replace("..", "_");
    }
}

