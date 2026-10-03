package com.careflow.audit;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByClinicIdOrderByCreatedAtDesc(Long clinicId);

    List<AuditLog> findByClinicIdAndEntityTypeOrderByCreatedAtDesc(Long clinicId, String entityType);

    Optional<AuditLog> findByIdAndClinicId(Long id, Long clinicId);
}
