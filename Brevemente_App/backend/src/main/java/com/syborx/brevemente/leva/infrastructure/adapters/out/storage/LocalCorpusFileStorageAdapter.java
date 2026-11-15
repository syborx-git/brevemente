package com.syborx.brevemente.leva.infrastructure.adapters.out.storage;

import com.syborx.brevemente.leva.application.ports.out.CorpusFileStoragePort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
@Component
public class LocalCorpusFileStorageAdapter implements CorpusFileStoragePort {

    private final Path rootPath;

    public LocalCorpusFileStorageAdapter(
            @Value("${app.leva.storage-path:./storage/corpus/original_files}") String baseStoragePath
    ) {
        this.rootPath = Paths.get(baseStoragePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootPath);
            log.info("[Storage] Directorio de almacenamiento de manuales listo: {}", this.rootPath);
        } catch (IOException e) {
            log.error("[Storage] No se pudo crear el directorio de manuales: {}", e.getMessage());
        }
    }

    @Override
    public String storeOriginalFile(String documentId, MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.bin";
        String sanitizedName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String finalName = documentId + "_" + System.currentTimeMillis() + "_" + sanitizedName;

        Path target = this.rootPath.resolve(finalName);
        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("[Storage] Manual original guardado en disco: {} ({} bytes)", target, file.getSize());
            return target.toString();
        } catch (IOException e) {
            log.error("[Storage] Error guardando archivo en disco: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public byte[] loadOriginalFile(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return new byte[0];
        try {
            Path path = Paths.get(storagePath);
            if (Files.exists(path)) {
                return Files.readAllBytes(path);
            }
        } catch (IOException e) {
            log.error("[Storage] Error leyendo archivo de disco: {}", e.getMessage());
        }
        return new byte[0];
    }

    @Override
    public void deleteOriginalFile(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return;
        try {
            Path path = Paths.get(storagePath);
            Files.deleteIfExists(path);
            log.info("[Storage] Archivo eliminado de disco: {}", storagePath);
        } catch (IOException e) {
            log.warn("[Storage] No se pudo eliminar archivo: {}", e.getMessage());
        }
    }
}

