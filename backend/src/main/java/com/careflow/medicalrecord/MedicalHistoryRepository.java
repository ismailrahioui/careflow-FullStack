package com.careflow.medicalrecord;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, Long> {
    Optional<MedicalHistory> findByIdAndClinicId(Long id, Long clinicId);

    List<MedicalHistory> findAllByClinicId(Long clinicId);

    List<MedicalHistory> findByPatientIdAndClinicId(Long patientId, Long clinicId);

    boolean existsByConsultationIdAndClinicId(Long consultationId, Long ClinicId);

}