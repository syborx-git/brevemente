package com.syborx.brevemente.auth.infrastructure.adapters.out.persistence;

import com.syborx.brevemente.auth.application.ports.out.LicenseLookupPort;
import com.syborx.brevemente.auth.infrastructure.adapters.out.persistence.repository.LicenseJpaProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LicenseLookupAdapter implements LicenseLookupPort {

    private final LicenseJpaProjection licenseJpaProjection;

    @Override
    public String findLicenseByUsuarioId(String usuarioId) {
        if (usuarioId == null) {
            return null;
        }
        return licenseJpaProjection.findLicenseByUsuarioId(usuarioId).orElse(null);
    }
}
