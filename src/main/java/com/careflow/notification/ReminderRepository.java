package com.careflow.notification;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    Optional<Reminder> findByIdAndAppointmentClinicId(Long id, Long clinicId);

    List<Reminder> findAllByAppointmentClinicId(Long clinicId);

    List<Reminder> findByAppointmentId(Long appointmentId);

    List<Reminder> findByAppointmentIdAndAppointmentClinicId(Long appointmentId, Long clinicId);

    List<Reminder> findByStatus(ReminderStatus status);

    List<Reminder> findByStatusAndSendTimeLessThanEqual(ReminderStatus status, Instant sendTime);

    boolean existsByAppointmentIdAndChannelAndStatus(Long appointmentId, ReminderChannel channel, ReminderStatus status);

}
