package com.careflow.consultation;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    Optional<Consultation> findByIdAndClinicId(Long id, Long clinicId);

    List<Consultation> findAllByClinicId(Long clinicId);

    boolean existsByAppointmentIdAndClinicId(Long appointmentId , Long ClinicId);
}
