package com.syborx.brevemente.leva.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClosedCorpusQueryResult {
    private String query;
    private String answer;
    @Builder.Default
    private List<CitedSource> citedSources = new ArrayList<>();
    private boolean groundedInCorpus;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CitedSource {
        private String protocolCode;
        private String title;
        private String category;
        private String reference;
    }
}
