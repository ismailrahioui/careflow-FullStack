package com.careflow.consultation;

import java.util.List;

import com.careflow.appointment.Appointment;
import com.careflow.appointment.AppointmentRepository;
import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import org.springframework.stereotype.Service;

@Service
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final ClinicRepository clinicRepository;
    private final AppointmentRepository appointmentRepository;

    public ConsultationService(ConsultationRepository consultationRepository,
            ClinicRepository clinicRepository, AppointmentRepository appointmentRepository

    ) {
        this.appointmentRepository = appointmentRepository;
        this.clinicRepository = clinicRepository;
        this.consultationRepository = consultationRepository;
    }

    public ConsultationResponse toResponse(Consultation consultation) {
        ConsultationResponse response = new ConsultationResponse();

        response.setId(consultation.getId());
        response.setClinic(consultation.getClinicId().getId());
        response.setPatient(consultation.getPatientId().getId());
        response.setAppointment(consultation.getAppointmentId().getId());
        response.setSymptoms(consultation.getSymptoms());
        response.setDiagnosis(consultation.getDiagnosis());
        response.setTreatment(consultation.getTreatment());
        response.setNotes(consultation.getNotes());
        response.setCreatedAt(consultation.getCreatedAt());

        return response;
    }

    public ConsultationResponse createConsultation(Long clinicId, ConsultationCreateRequest request) {
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic Not Found"));

        Appointment appointment = appointmentRepository.findByIdAndClinicId(request.getAppointmentId(), clinicId)
                .orElseThrow(() -> new ConsultationNotFoundException("Consultation not Found"));

        Consultation consultation = new Consultation();

        consultation.setClinicId(clinic);
        consultation.setPatientId(appointment.getPatient());
        consultation.setAppointmentId(appointment);
        consultation.setSymptoms(request.getSymptoms());
        consultation.setDiagnosis(request.getDiagnosis());
        consultation.setTreatment(request.getTreatment());
        consultation.setNotes(request.getNotes());

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

    public ConsultationResponse deleteConsultation(Long Id, Long clinicId) {
        Consultation consultation = consultationRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new ConsultationNotFoundException("Consultation not Found"));
        consultationRepository.delete(consultation);

        return toResponse(consultation);
    }

    public ConsultationResponse updateConsultation(Long Id, Long clinicId, ConsultationUpdateRequest request) {
        Consultation existingConsultation = consultationRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new ConsultationNotFoundException("Consultation Not Found"));

        existingConsultation.setSymptoms(request.getSymptoms());
        existingConsultation.setDiagnosis(request.getDiagnosis());
        existingConsultation.setTreatment(request.getTreatment());
        existingConsultation.setNotes(request.getNotes());

        Consultation updateConsultation = consultationRepository.save(existingConsultation);
        return toResponse(updateConsultation);
    }

}
