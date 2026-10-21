package com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto;

import com.syborx.brevemente.leva.domain.model.ClosedCorpusQueryResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorpusQueryResponse {
    private String query;
    private String answer;
    private List<ClosedCorpusQueryResult.CitedSource> citedSources;
    private boolean groundedInCorpus;

    public static CorpusQueryResponse fromDomain(ClosedCorpusQueryResult domain) {
        if (domain == null) return null;
        return CorpusQueryResponse.builder()
                .query(domain.getQuery())
                .answer(domain.getAnswer())
                .citedSources(domain.getCitedSources())
                .groundedInCorpus(domain.isGroundedInCorpus())
                .build();
    }
}
