package com.careflow.appointment;

import java.util.List;

import org.springframework.stereotype.Service;

import com.careflow.audit.AuditService;
import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import com.careflow.patient.Patient;
import com.careflow.patient.PatientNotFoundException;
import com.careflow.patient.PatientRepository;

import com.careflow.notification.RealtimeNotification;
import com.careflow.notification.RealtimeNotificationService;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ClinicRepository clinicRepository;
    private final AuditService auditService;
    private final RealtimeNotificationService notificationService;

    public AppointmentService(AppointmentRepository appointmentRepository, PatientRepository patientRepository,
            ClinicRepository clinicRepository, AuditService auditService,
            RealtimeNotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.clinicRepository = clinicRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    public AppointmentResponse toResponse(Appointment appointment) {
        AppointmentResponse response = new AppointmentResponse();

        response.setId(appointment.getId());
        response.setClinicId(appointment.getClinic().getId());
        response.setPatientId(appointment.getPatient().getId());
        response.setAppointmentAt(appointment.getAppointmentAt());
        response.setReason(appointment.getReason());
        response.setStatus(appointment.getStatus());
        response.setCreatedAt(appointment.getCreatedAt());
        return response;

    }

    public AppointmentResponse createAppointment(Long clinicId, AppointmentCreateRequest request) {

        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic Not Found"));

        Patient patient = patientRepository.findByIdAndClinicId(request.getPatientId(), clinicId)
                .orElseThrow(() -> new PatientNotFoundException("Patient Not found"));

        Appointment appointment = new Appointment();

        appointment.setClinic(clinic);
        appointment.setPatient(patient);
        appointment.setAppointmentAt(request.getAppointmentAt());
        appointment.setReason(request.getReason());
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment savedAppointment = appointmentRepository.save(appointment);

        auditService.log(clinicId, "CREATE", "APPOINTMENT", savedAppointment.getId(),
                "Appointment scheduled for patient ID: " + patient.getId());

        try {
            notificationService.broadcast(clinicId, new RealtimeNotification(
                    UUID.randomUUID().toString(),
                    clinicId,
                    "APPOINTMENT",
                    "Nouveau Rendez-vous",
                    "Rendez-vous planifié pour " + patient.getFirstName() + " " + patient.getLastName() + " à " + appointment.getAppointmentAt()
            ));
        } catch (Exception ignored) {}

        return toResponse(savedAppointment);

    }

    public AppointmentResponse getAppointmentById(Long Id, Long ClinicId) {
        Appointment appointment = appointmentRepository.findByIdAndClinicId(Id, ClinicId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not Found"));

        return toResponse(appointment);
    }

    public List<AppointmentResponse> getAllAppointments(Long clinicId) {
        List<Appointment> appointments = appointmentRepository.findAllByClinicId(clinicId);

        return appointments.stream()
                .map(app -> toResponse(app)).toList();
    }

    public AppointmentResponse deleteAppointment(Long Id, Long clinicId) {
        Appointment appointment = appointmentRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment not Found"));
        appointmentRepository.delete(appointment);

        auditService.log(clinicId, "DELETE", "APPOINTMENT", Id,
                "Appointment deleted for patient ID: " + appointment.getPatient().getId());

        return toResponse(appointment);
    }

    public AppointmentResponse updateAppointment(Long Id, Long clinicId, AppointmentUpdateRequest request) {
        Appointment existingAppointment = appointmentRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment Not Found"));

        existingAppointment.setAppointmentAt(request.getAppointmentAt());
        existingAppointment.setReason(request.getReason());
        existingAppointment.setStatus(request.getStatus());

        Appointment updateAppointment = appointmentRepository.save(existingAppointment);

        auditService.log(clinicId, "UPDATE", "APPOINTMENT", updateAppointment.getId(),
                "Appointment updated, status: " + updateAppointment.getStatus());

        return toResponse(updateAppointment);
    }
}
