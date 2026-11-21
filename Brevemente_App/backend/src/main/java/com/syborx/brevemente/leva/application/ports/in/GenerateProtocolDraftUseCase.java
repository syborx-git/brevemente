package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.GenerateProtocolDraftRequest;
import com.syborx.brevemente.leva.infrastructure.adapters.in.rest.dto.GeneratedProtocolDraftResponse;

public interface GenerateProtocolDraftUseCase {
    GeneratedProtocolDraftResponse generateProtocolDraft(GenerateProtocolDraftRequest request);
}
