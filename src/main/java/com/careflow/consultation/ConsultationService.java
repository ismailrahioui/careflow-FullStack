package com.careflow.consultation;

import java.util.List;

import com.careflow.appointment.Appointment;
import com.careflow.appointment.AppointmentNotFoundException;
import com.careflow.appointment.AppointmentRepository;
import com.careflow.appointment.AppointmentStatus;
import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import com.careflow.user.User;
import com.careflow.user.UserNotFoundException;
import com.careflow.user.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final ClinicRepository clinicRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public ConsultationService(ConsultationRepository consultationRepository,
            ClinicRepository clinicRepository, AppointmentRepository appointmentRepository,
            UserRepository userRepository

    ) {
        this.appointmentRepository = appointmentRepository;
        this.clinicRepository = clinicRepository;
        this.consultationRepository = consultationRepository;
        this.userRepository = userRepository;
    }

    public ConsultationResponse toResponse(Consultation consultation) {
        ConsultationResponse response = new ConsultationResponse();

        response.setId(consultation.getId());
        response.setClinic(consultation.getClinic().getId());
        response.setPatient(consultation.getPatient().getId());
        response.setAppointment(consultation.getAppointment().getId());
        if (consultation.getDoctor() != null) {
            response.setDoctorId(consultation.getDoctor().getId());
            response.setDoctorName(consultation.getDoctor().getFullName());
        }
        response.setSymptoms(consultation.getSymptoms());
        response.setDiagnosis(consultation.getDiagnosis());
        response.setTreatment(consultation.getTreatment());
        response.setNotes(consultation.getNotes());
        response.setCreatedAt(consultation.getCreatedAt());

        return response;
    }

    @Transactional
    public ConsultationResponse createConsultation(Long clinicId, ConsultationCreateRequest request) {
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic Not Found"));

        Appointment appointment = appointmentRepository.findByIdAndClinicId(request.getAppointmentId(), clinicId)
                .orElseThrow(() -> new AppointmentNotFoundException("Appointment  not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (docUser.getClinic().getId().equals(clinic.getId())) {
            throw new AccessDeniedException("You are not Allowed");
        }

        if (consultationRepository.existsByAppointmentIdAndClinicId(request.getAppointmentId(), clinic.getId())) {
            throw new IllegalStateException("This appointment already has a consultation");
        }

        Consultation consultation = new Consultation();

        consultation.setClinic(clinic);
        consultation.setPatient(appointment.getPatient());
        consultation.setAppointment(appointment);
        consultation.setSymptoms(request.getSymptoms());
        consultation.setDiagnosis(request.getDiagnosis());
        consultation.setTreatment(request.getTreatment());
        consultation.setNotes(request.getNotes());
        consultation.setDoctor(docUser);
        appointment.setStatus(AppointmentStatus.COMPLETED);

        appointmentRepository.save(appointment);
        Consultation SavedConsultation = consultationRepository.save(consultation);

        return toResponse(SavedConsultation);

    }

    public ConsultationResponse getConsultationById(Long Id, Long ClinicId) {
        Consultation consultation = consultationRepository.findByIdAndClinicId(Id, ClinicId)
                .orElseThrow(() -> new ConsultationNotFoundException("Consultation not Found"));

        return toResponse(consultation);
    }

    public List<ConsultationResponse> getAllConsultations(Long clinicId) {
        List<Consultation> consultations = consultationRepository.findAllByClinicId(clinicId);

        return consultations.stream()
                .map(app -> toResponse(app)).toList();
    }

    @Transactional
    public ConsultationResponse deleteConsultation(Long Id, Long clinicId) {

        Consultation consultation = consultationRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new ConsultationNotFoundException("Consultation not Found"));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!docUser.getId().equals(consultation.getDoctor().getId())) {
            throw new AccessDeniedException("You are not allowed to update/delete this consultation");
        }
        consultationRepository.delete(consultation);

        return toResponse(consultation);
    }

    @Transactional
    public ConsultationResponse updateConsultation(Long Id, Long clinicId, ConsultationUpdateRequest request) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        Consultation existingConsultation = consultationRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new ConsultationNotFoundException("Consultation Not Found"));

        if (!docUser.getId().equals(existingConsultation.getDoctor().getId())) {
            throw new AccessDeniedException("You are not allowed to update/delete this consultation");
        }
        existingConsultation.setSymptoms(request.getSymptoms());
        existingConsultation.setDiagnosis(request.getDiagnosis());
        existingConsultation.setTreatment(request.getTreatment());
        existingConsultation.setNotes(request.getNotes());
        Consultation updateConsultation = consultationRepository.save(existingConsultation);
        return toResponse(updateConsultation);
    }

}
