package com.syborx.brevemente.leva.application.ports.out;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

/**
 * Puerto de salida: almacenamiento durable del audio original de una sesión clínica.
 * Permite cambiar el backend (disco local, S3, MinIO) sin tocar la lógica de aplicación.
 */
public interface SessionAudioStoragePort {

    /** Metadatos del audio persistido. */
    record StoredAudio(String storagePath, String contentType, long sizeBytes) {}

    StoredAudio store(String sessionId, MultipartFile file);

    Optional<Resource> load(String storagePath);
}

