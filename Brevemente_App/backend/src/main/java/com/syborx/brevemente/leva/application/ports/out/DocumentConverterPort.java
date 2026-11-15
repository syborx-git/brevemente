package com.syborx.brevemente.leva.application.ports.out;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface DocumentConverterPort {

    DocumentConversionResult convertToMarkdown(MultipartFile file);

    record DocumentConversionResult(
            String filename,
            String extension,
            Integer pageCount,
            Integer wordCount,
            String markdown,
            List<String> sections,
            Integer chunkCount,
            List<DocumentChunkDto> chunks
    ) {}

    record DocumentChunkDto(
            Integer chunkIndex,
            String title,
            String content,
            Integer wordCount
    ) {}
}

