package com.syborx.brevemente.leva.application.ports.out;

import org.springframework.web.multipart.MultipartFile;

public interface CorpusFileStoragePort {

    String storeOriginalFile(String documentId, MultipartFile file);

    byte[] loadOriginalFile(String storagePath);

    void deleteOriginalFile(String storagePath);
}

