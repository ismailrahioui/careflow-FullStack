package com.careflow.notification;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careflow.appointment.Appointment;
import com.careflow.appointment.AppointmentNotFoundException;
import com.careflow.appointment.AppointmentRepository;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final AppointmentRepository appointmentRepository;

    public ReminderService(ReminderRepository reminderRepository, AppointmentRepository appointmentRepository) {
        this.reminderRepository = reminderRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public ReminderResponse toResponse(Reminder reminder) {
        ReminderResponse response = new ReminderResponse();
        response.setId(reminder.getId());
        response.setAppointmentId(reminder.getAppointment().getId());
        response.setSendTime(reminder.getSendTime());
        response.setChannel(reminder.getChannel());
        response.setStatus(reminder.getStatus());
        response.setCreatedAt(reminder.getCreatedAt());
        return response;
    }

    @Transactional
    public ReminderResponse createReminder(Long clinicId, ReminderCreateRequest request) {
        Appointment appointment = appointmentRepository.findByIdAndClinicId(request.getAppointmentId(), clinicId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found"));

        if (!request.getSendTime().isBefore(appointment.getAppointmentAt())) {
            throw new IllegalArgumentException("Reminder send time must be before the appointment time");
        }

        if (reminderRepository.existsByAppointmentIdAndChannelAndStatus(appointment.getId(), request.getChannel(), ReminderStatus.QUEUED)) {
            throw new IllegalStateException("A queued reminder for this appointment and channel already exists");
        }

        Reminder reminder = new Reminder();
        reminder.setAppointment(appointment);
        reminder.setSendTime(request.getSendTime());
        reminder.setChannel(request.getChannel());
        reminder.setStatus(ReminderStatus.QUEUED);

        Reminder savedReminder = reminderRepository.save(reminder);
        return toResponse(savedReminder);
    }

    public ReminderResponse getReminderById(Long id, Long clinicId) {
        Reminder reminder = reminderRepository.findByIdAndAppointmentClinicId(id, clinicId)
                .orElseThrow(() -> new ReminderNotFoundException("Reminder not found"));
        return toResponse(reminder);
    }

    public List<ReminderResponse> getAllReminders(Long clinicId) {
        return reminderRepository.findAllByAppointmentClinicId(clinicId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ReminderResponse> getRemindersByAppointment(Long appointmentId, Long clinicId) {
        appointmentRepository.findByIdAndClinicId(appointmentId, clinicId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not found"));

        return reminderRepository.findByAppointmentIdAndAppointmentClinicId(appointmentId, clinicId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReminderResponse updateReminder(Long id, Long clinicId, ReminderUpdateRequest request) {
        Reminder reminder = reminderRepository.findByIdAndAppointmentClinicId(id, clinicId)
                .orElseThrow(() -> new ReminderNotFoundException("Reminder not found"));

        if (reminder.getStatus() != ReminderStatus.QUEUED) {
            throw new IllegalStateException("Only queued reminders can be updated");
        }

        if (!request.getSendTime().isBefore(reminder.getAppointment().getAppointmentAt())) {
            throw new IllegalArgumentException("Reminder send time must be before the appointment time");
        }

        if (reminder.getChannel() != request.getChannel()
                && reminderRepository.existsByAppointmentIdAndChannelAndStatus(
                        reminder.getAppointment().getId(), request.getChannel(), ReminderStatus.QUEUED)) {
            throw new IllegalStateException("A queued reminder for this appointment and channel already exists");
        }

        reminder.setSendTime(request.getSendTime());
        reminder.setChannel(request.getChannel());

        Reminder updatedReminder = reminderRepository.save(reminder);
        return toResponse(updatedReminder);
    }

    @Transactional
    public void deleteReminder(Long id, Long clinicId) {
        Reminder reminder = reminderRepository.findByIdAndAppointmentClinicId(id, clinicId)
                .orElseThrow(() -> new ReminderNotFoundException("Reminder not found"));

        if (reminder.getStatus() != ReminderStatus.QUEUED) {
            throw new IllegalStateException("Only queued reminders can be cancelled or deleted");
        }

        reminderRepository.delete(reminder);
    }

    // --- Methods for the Background Scheduler ---

    public List<Reminder> getDueReminders() {
        return reminderRepository.findByStatusAndSendTimeLessThanEqual(ReminderStatus.QUEUED, Instant.now());
    }

    @Transactional
    public void updateStatus(Long reminderId, ReminderStatus status) {
        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new ReminderNotFoundException("Reminder not found"));

        if (reminder.getStatus() != ReminderStatus.QUEUED || (status != ReminderStatus.SENT && status != ReminderStatus.FAILED)) {
            throw new IllegalStateException("Invalid status transition: can only transition from QUEUED to SENT or FAILED");
        }

        reminder.setStatus(status);
        reminderRepository.save(reminder);
    }
}
