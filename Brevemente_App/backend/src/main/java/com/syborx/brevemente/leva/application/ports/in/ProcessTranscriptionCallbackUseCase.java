package com.syborx.brevemente.leva.application.ports.in;

import com.syborx.brevemente.leva.domain.model.LevaClinicalProposal;
import com.syborx.brevemente.leva.domain.model.RawTranscriptionResult;

public interface ProcessTranscriptionCallbackUseCase {
    LevaClinicalProposal processCallback(RawTranscriptionResult rawResult);
}
