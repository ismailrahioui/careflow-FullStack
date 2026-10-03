package com.careflow.appointment;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByIdAndClinicId(Long id, Long clinicId);

    List<Appointment> findAllByClinicId(Long clinicId);

    long countByClinicId(Long clinicId);

    long countByClinicIdAndAppointmentAtBetween(Long clinicId, Instant start, Instant end);

    List<Appointment> findTop5ByClinicIdAndAppointmentAtAfterOrderByAppointmentAtAsc(Long clinicId, Instant after);

}
