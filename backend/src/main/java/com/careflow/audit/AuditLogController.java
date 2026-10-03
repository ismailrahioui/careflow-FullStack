package com.careflow.audit;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clinics/{clinicId}/audit-logs")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId) and hasAnyRole('DOCTOR','NURSE')")
public class AuditLogController {

    private final AuditService auditService;

    public AuditLogController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs(
            @PathVariable Long clinicId,
            @RequestParam(required = false) String entityType) {
        List<AuditLogResponse> logs = auditService.getAuditLogs(clinicId, entityType);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditLogResponse> getAuditLogById(
            @PathVariable Long clinicId,
            @PathVariable Long id) {
        AuditLogResponse log = auditService.getAuditLogById(id, clinicId);
        return ResponseEntity.ok(log);
    }
}
