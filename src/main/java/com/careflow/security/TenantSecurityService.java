package com.careflow.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.careflow.user.UserRepository;

@Component("tenantSecurity")
public class TenantSecurityService {

    private final UserRepository userRepository;

    public TenantSecurityService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean hasClinicAccess(Long clinicId) {
        if (clinicId == null) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return false;
        }

        String username = auth.getName();
        return userRepository.findByUsername(username)
                .map(user -> user.getClinic() != null && clinicId.equals(user.getClinic().getId()))
                .orElse(false);
    }
}
