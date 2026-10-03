package com.careflow.patient;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByIdAndClinicId(Long id, Long clinicId);

    List<Patient> findAllByClinicId(Long clinicId);

    long countByClinicId(Long clinicId);

}
