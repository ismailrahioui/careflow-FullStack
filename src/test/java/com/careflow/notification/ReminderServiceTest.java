package com.careflow.notification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.careflow.appointment.Appointment;
import com.careflow.appointment.AppointmentNotFoundException;
import com.careflow.appointment.AppointmentRepository;
import com.careflow.clinic.Clinic;

@ExtendWith(MockitoExtension.class)
class ReminderServiceTest {

    @Mock
    private ReminderRepository reminderRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private ReminderService reminderService;

    private Clinic testClinic;
    private Appointment testAppointment;

    @BeforeEach
    void setUp() {
        testClinic = new Clinic();
        testClinic.setId(1L);

        testAppointment = new Appointment();
        testAppointment.setId(10L);
        testAppointment.setClinic(testClinic);
        testAppointment.setAppointmentAt(Instant.now().plus(2, ChronoUnit.DAYS));
    }

    @Nested
    @DisplayName("Create Reminder Tests")
    class CreateReminderTests {

        @Test
        @DisplayName("Should successfully create a reminder with status QUEUED")
        void shouldCreateReminderSuccessfully() {
            Long clinicId = 1L;
            Instant sendTime = Instant.now().plus(1, ChronoUnit.DAYS);

            ReminderCreateRequest request = new ReminderCreateRequest();
            request.setAppointmentId(10L);
            request.setSendTime(sendTime);
            request.setChannel(ReminderChannel.SMS);

            when(appointmentRepository.findByIdAndClinicId(10L, clinicId))
                    .thenReturn(Optional.of(testAppointment));
            when(reminderRepository.existsByAppointmentIdAndChannelAndStatus(10L, ReminderChannel.SMS, ReminderStatus.QUEUED))
                    .thenReturn(false);
            when(reminderRepository.save(any(Reminder.class)))
                    .thenAnswer(invocation -> {
                        Reminder r = invocation.getArgument(0);
                        r.setId(100L);
                        r.setCreatedAt(Instant.now());
                        return r;
                    });

            ReminderResponse response = reminderService.createReminder(clinicId, request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(100L);
            assertThat(response.getAppointmentId()).isEqualTo(10L);
            assertThat(response.getChannel()).isEqualTo(ReminderChannel.SMS);
            assertThat(response.getStatus()).isEqualTo(ReminderStatus.QUEUED);
            assertThat(response.getSendTime()).isEqualTo(sendTime);

            verify(reminderRepository).save(any(Reminder.class));
        }

        @Test
        @DisplayName("Should throw AppointmentNotFoundException when appointment does not belong to clinic")
        void shouldThrowWhenAppointmentNotFound() {
            Long clinicId = 1L;
            ReminderCreateRequest request = new ReminderCreateRequest();
            request.setAppointmentId(999L);
            request.setSendTime(Instant.now().plus(1, ChronoUnit.DAYS));
            request.setChannel(ReminderChannel.SMS);

            when(appointmentRepository.findByIdAndClinicId(999L, clinicId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> reminderService.createReminder(clinicId, request))
                    .isInstanceOf(AppointmentNotFoundException.class)
                    .hasMessage("Appointment not found");

            verify(reminderRepository, never()).save(any(Reminder.class));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when sendTime is after appointment time")
        void shouldThrowWhenSendTimeAfterAppointment() {
            Long clinicId = 1L;
            // sendTime is 3 days from now, but appointment is in 2 days
            Instant sendTime = Instant.now().plus(3, ChronoUnit.DAYS);

            ReminderCreateRequest request = new ReminderCreateRequest();
            request.setAppointmentId(10L);
            request.setSendTime(sendTime);
            request.setChannel(ReminderChannel.SMS);

            when(appointmentRepository.findByIdAndClinicId(10L, clinicId))
                    .thenReturn(Optional.of(testAppointment));

            assertThatThrownBy(() -> reminderService.createReminder(clinicId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Reminder send time must be before the appointment time");

            verify(reminderRepository, never()).save(any(Reminder.class));
        }

        @Test
        @DisplayName("Should throw IllegalStateException when duplicate queued reminder exists")
        void shouldThrowWhenDuplicateQueuedReminderExists() {
            Long clinicId = 1L;
            Instant sendTime = Instant.now().plus(1, ChronoUnit.DAYS);

            ReminderCreateRequest request = new ReminderCreateRequest();
            request.setAppointmentId(10L);
            request.setSendTime(sendTime);
            request.setChannel(ReminderChannel.SMS);

            when(appointmentRepository.findByIdAndClinicId(10L, clinicId))
                    .thenReturn(Optional.of(testAppointment));
            when(reminderRepository.existsByAppointmentIdAndChannelAndStatus(10L, ReminderChannel.SMS, ReminderStatus.QUEUED))
                    .thenReturn(true);

            assertThatThrownBy(() -> reminderService.createReminder(clinicId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("A queued reminder for this appointment and channel already exists");

            verify(reminderRepository, never()).save(any(Reminder.class));
        }
    }

    @Nested
    @DisplayName("Update Reminder Tests")
    class UpdateReminderTests {

        @Test
        @DisplayName("Should successfully update a queued reminder")
        void shouldUpdateQueuedReminderSuccessfully() {
            Long clinicId = 1L;
            Long reminderId = 100L;

            Reminder reminder = new Reminder();
            reminder.setId(reminderId);
            reminder.setAppointment(testAppointment);
            reminder.setStatus(ReminderStatus.QUEUED);
            reminder.setChannel(ReminderChannel.SMS);
            reminder.setSendTime(Instant.now().plus(1, ChronoUnit.DAYS));

            Instant newSendTime = Instant.now().plus(36, ChronoUnit.HOURS);
            ReminderUpdateRequest request = new ReminderUpdateRequest();
            request.setSendTime(newSendTime);
            request.setChannel(ReminderChannel.WHATSAPP);

            when(reminderRepository.findByIdAndAppointmentClinicId(reminderId, clinicId))
                    .thenReturn(Optional.of(reminder));
            when(reminderRepository.existsByAppointmentIdAndChannelAndStatus(10L, ReminderChannel.WHATSAPP, ReminderStatus.QUEUED))
                    .thenReturn(false);
            when(reminderRepository.save(any(Reminder.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ReminderResponse response = reminderService.updateReminder(reminderId, clinicId, request);

            assertThat(response).isNotNull();
            assertThat(response.getChannel()).isEqualTo(ReminderChannel.WHATSAPP);
            assertThat(response.getSendTime()).isEqualTo(newSendTime);
            verify(reminderRepository).save(reminder);
        }

        @Test
        @DisplayName("Should throw IllegalStateException when updating a non-queued reminder")
        void shouldThrowWhenUpdatingNonQueuedReminder() {
            Long clinicId = 1L;
            Long reminderId = 100L;

            Reminder reminder = new Reminder();
            reminder.setId(reminderId);
            reminder.setAppointment(testAppointment);
            reminder.setStatus(ReminderStatus.SENT); // already sent!

            ReminderUpdateRequest request = new ReminderUpdateRequest();
            request.setSendTime(Instant.now().plus(1, ChronoUnit.DAYS));
            request.setChannel(ReminderChannel.EMAIL);

            when(reminderRepository.findByIdAndAppointmentClinicId(reminderId, clinicId))
                    .thenReturn(Optional.of(reminder));

            assertThatThrownBy(() -> reminderService.updateReminder(reminderId, clinicId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Only queued reminders can be updated");

            verify(reminderRepository, never()).save(any(Reminder.class));
        }
    }

    @Nested
    @DisplayName("Delete Reminder Tests")
    class DeleteReminderTests {

        @Test
        @DisplayName("Should successfully delete a queued reminder")
        void shouldDeleteQueuedReminderSuccessfully() {
            Long clinicId = 1L;
            Long reminderId = 100L;

            Reminder reminder = new Reminder();
            reminder.setId(reminderId);
            reminder.setAppointment(testAppointment);
            reminder.setStatus(ReminderStatus.QUEUED);

            when(reminderRepository.findByIdAndAppointmentClinicId(reminderId, clinicId))
                    .thenReturn(Optional.of(reminder));

            reminderService.deleteReminder(reminderId, clinicId);

            verify(reminderRepository).delete(reminder);
        }

        @Test
        @DisplayName("Should throw IllegalStateException when deleting non-queued reminder")
        void shouldThrowWhenDeletingNonQueuedReminder() {
            Long clinicId = 1L;
            Long reminderId = 100L;

            Reminder reminder = new Reminder();
            reminder.setId(reminderId);
            reminder.setAppointment(testAppointment);
            reminder.setStatus(ReminderStatus.SENT);

            when(reminderRepository.findByIdAndAppointmentClinicId(reminderId, clinicId))
                    .thenReturn(Optional.of(reminder));

            assertThatThrownBy(() -> reminderService.deleteReminder(reminderId, clinicId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Only queued reminders can be cancelled or deleted");

            verify(reminderRepository, never()).delete(any(Reminder.class));
        }
    }

    @Nested
    @DisplayName("Update Status (Scheduler) Tests")
    class UpdateStatusTests {

        @Test
        @DisplayName("Should successfully transition from QUEUED to SENT")
        void shouldTransitionFromQueuedToSent() {
            Reminder reminder = new Reminder();
            reminder.setId(100L);
            reminder.setStatus(ReminderStatus.QUEUED);

            when(reminderRepository.findById(100L)).thenReturn(Optional.of(reminder));

            reminderService.updateStatus(100L, ReminderStatus.SENT);

            assertThat(reminder.getStatus()).isEqualTo(ReminderStatus.SENT);
            verify(reminderRepository).save(reminder);
        }

        @Test
        @DisplayName("Should successfully transition from QUEUED to FAILED")
        void shouldTransitionFromQueuedToFailed() {
            Reminder reminder = new Reminder();
            reminder.setId(100L);
            reminder.setStatus(ReminderStatus.QUEUED);

            when(reminderRepository.findById(100L)).thenReturn(Optional.of(reminder));

            reminderService.updateStatus(100L, ReminderStatus.FAILED);

            assertThat(reminder.getStatus()).isEqualTo(ReminderStatus.FAILED);
            verify(reminderRepository).save(reminder);
        }

        @Test
        @DisplayName("Should throw IllegalStateException on invalid transition (e.g. SENT to QUEUED)")
        void shouldThrowOnInvalidTransition() {
            Reminder reminder = new Reminder();
            reminder.setId(100L);
            reminder.setStatus(ReminderStatus.SENT);

            when(reminderRepository.findById(100L)).thenReturn(Optional.of(reminder));

            assertThatThrownBy(() -> reminderService.updateStatus(100L, ReminderStatus.QUEUED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("Invalid status transition: can only transition from QUEUED to SENT or FAILED");

            verify(reminderRepository, never()).save(any(Reminder.class));
        }
    }
}
