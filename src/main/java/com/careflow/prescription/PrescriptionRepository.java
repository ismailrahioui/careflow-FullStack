package com.careflow.prescription;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionRepository extends JpaRepository<Prescription,Long> {

    Optional<Prescription> findByIdAndClinicId(Long id, Long clinicId);

    List<Prescription> findAllByClinicId(Long clinicId);

    List<Prescription> findByPatientIdAndClinicId(Long patientId, Long clinicId);

    boolean existsByIdAndClinicId(Long id, Long clinicId);

}
