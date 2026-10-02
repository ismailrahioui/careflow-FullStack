package com.careflow.audit;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import com.careflow.user.User;
import com.careflow.user.UserRepository;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;

    public AuditService(AuditLogRepository auditLogRepository,
                        ClinicRepository clinicRepository,
                        UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.clinicRepository = clinicRepository;
        this.userRepository = userRepository;
    }

    public AuditLogResponse toResponse(AuditLog auditLog) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(auditLog.getId());
        response.setClinicId(auditLog.getClinic().getId());
        if (auditLog.getUser() != null) {
            response.setUserId(auditLog.getUser().getId());
            response.setUserFullName(auditLog.getUser().getFullName());
        }
        response.setAction(auditLog.getAction());
        response.setEntityType(auditLog.getEntityType());
        response.setEntityId(auditLog.getEntityId());
        response.setDetails(auditLog.getDetails());
        response.setCreatedAt(auditLog.getCreatedAt());
        return response;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long clinicId, String action, String entityType, Long entityId, String details) {
        try {
            Clinic clinic = clinicRepository.findById(clinicId)
                    .orElseThrow(() -> new ClinicNotFoundException("Clinic not found with id: " + clinicId));

            User currentUser = null;
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
                currentUser = userRepository.findByUsername(authentication.getName()).orElse(null);
            }

            AuditLog auditLog = new AuditLog();
            auditLog.setClinic(clinic);
            auditLog.setUser(currentUser);
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setDetails(details);

            auditLogRepository.save(auditLog);
            log.debug("AuditLog recorded: {} on {} #{} for clinic {}", action, entityType, entityId, clinicId);
        } catch (Exception e) {
            log.error("Failed to persist audit log for clinic {}: {}", clinicId, e.getMessage(), e);
        }
    }

    public List<AuditLogResponse> getAuditLogs(Long clinicId, String entityType) {
        List<AuditLog> logs;
        if (entityType != null && !entityType.isBlank()) {
            logs = auditLogRepository.findByClinicIdAndEntityTypeOrderByCreatedAtDesc(clinicId, entityType.toUpperCase());
        } else {
            logs = auditLogRepository.findAllByClinicIdOrderByCreatedAtDesc(clinicId);
        }
        return logs.stream().map(this::toResponse).toList();
    }

    public AuditLogResponse getAuditLogById(Long id, Long clinicId) {
        AuditLog auditLog = auditLogRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new AuditLogNotFoundException("Audit log not found with id: " + id));
        return toResponse(auditLog);
    }
}
