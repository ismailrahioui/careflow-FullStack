package com.careflow.medicalrecord;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;
import com.careflow.consultation.Consultation;
import com.careflow.consultation.ConsultationNotFoundException;
import com.careflow.consultation.ConsultationRepository;
import com.careflow.patient.Patient;
import com.careflow.patient.PatientNotFoundException;
import com.careflow.patient.PatientRepository;
import com.careflow.user.User;
import com.careflow.user.UserNotFoundException;
import com.careflow.user.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class MedicalHistoryService {

    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final MedicalHistoryRepository medicalHistoryRepository;

    public MedicalHistoryService(ConsultationRepository consultationRepository, ClinicRepository clinicRepository,
            UserRepository userRepository, MedicalHistoryRepository medicalHistoryRepository,
            PatientRepository patientRepository) {

        this.clinicRepository = clinicRepository;
        this.consultationRepository = consultationRepository;
        this.userRepository = userRepository;
        this.medicalHistoryRepository = medicalHistoryRepository;
        this.patientRepository = patientRepository;
    }

    public MedicalHistoryResponse toResponse(MedicalHistory medicalHistory) {
        MedicalHistoryResponse response = new MedicalHistoryResponse();
        response.setId(medicalHistory.getId());
        response.setClinicId(medicalHistory.getClinic().getId());
        response.setPatientId(medicalHistory.getPatient().getId());
        response.setConsultationId(medicalHistory.getConsultation().getId());
        if (medicalHistory.getUser() != null) {

            response.setDoctorId(medicalHistory.getUser().getId());
            response.setDoctorName(medicalHistory.getUser().getFullName());
        }

        response.setDiagnosis(medicalHistory.getDiagnosis());
        response.setSymptoms(medicalHistory.getSymptoms());
        response.setTreatment(medicalHistory.getTreatment());
        response.setNotes(medicalHistory.getNotes());
        response.setCreatedAt(medicalHistory.getCreatedAt());

        return response;

    }

    @Transactional
    public MedicalHistoryResponse createMedicalHistory(Long clinicId, MedicalHistoryCreateRequest request) {

        if (medicalHistoryRepository.existsByConsultationIdAndClinicId(request.getConsultationId(), clinicId)) {
            throw new IllegalArgumentException("Medical History already exists for this Consultation.");
        }

        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic not found"));

        Patient patient = patientRepository.findByIdAndClinicId(request.getPatientId(), clinicId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found in this clinic"));

        Consultation consultation = consultationRepository.findByIdAndClinicId(request.getConsultationId(), clinicId)
                .orElseThrow(() -> new ConsultationNotFoundException("Consultation not found in this clinic"));

        User doctor = userRepository.findByIdAndClinicId(request.getDoctorId(), clinicId)
                .orElseThrow(() -> new UserNotFoundException("Doctor not found in this clinic"));

        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setClinic(clinic);
        medicalHistory.setPatient(patient);
        medicalHistory.setConsultation(consultation);
        medicalHistory.setUser(doctor);

        medicalHistory.setDiagnosis(request.getDiagnosis());
        medicalHistory.setSymptoms(request.getSymptoms());
        medicalHistory.setTreatment(request.getTreatment());
        medicalHistory.setNotes(request.getNotes());
        MedicalHistory savedHistory = medicalHistoryRepository.save(medicalHistory);
        return toResponse(savedHistory);
    }

    public MedicalHistoryResponse getMedicalHistoryById(Long clinicId, Long historyId) {
        MedicalHistory history = medicalHistoryRepository.findByIdAndClinicId(historyId, clinicId)
                .orElseThrow(() -> new MedicalHistoryNotFoundException("Medical History not found"));
        return toResponse(history);
    }

    public List<MedicalHistoryResponse> getAllByClinicId(Long clinicId) {
        return medicalHistoryRepository.findAllByClinicId(clinicId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MedicalHistoryResponse> getAllByPatientId(Long clinicId, Long patientId) {
        return medicalHistoryRepository.findByPatientIdAndClinicId(patientId, clinicId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MedicalHistoryResponse deleteMedicalHistory(Long Id, Long clinicId) {

        MedicalHistory medicalHistory = medicalHistoryRepository.findByIdAndClinicId(Id, clinicId)
                .orElseThrow(() -> new MedicalHistoryNotFoundException("Medica history not found"));

        Consultation consultation = medicalHistory.getConsultation();

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User docUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User Not Found"));

        if (!docUser.getId().equals(consultation.getDoctor().getId())) {
            throw new AccessDeniedException("You are not allowed to update/delete this consultation");
        }
        medicalHistoryRepository.delete(medicalHistory);

        return toResponse(medicalHistory);
    }

    @Transactional
    public MedicalHistoryResponse updateMedicalHistory(Long clinicId, Long historyId,
            MedicalHistoryUpdateRequest request) {
        MedicalHistory medicalHistory = medicalHistoryRepository.findByIdAndClinicId(historyId, clinicId)
                .orElseThrow(() -> new MedicalHistoryNotFoundException("Medical History not found"));
        medicalHistory.setDiagnosis(request.getDiagnosis());
        medicalHistory.setSymptoms(request.getSymptoms());
        medicalHistory.setTreatment(request.getTreatment());
        medicalHistory.setNotes(request.getNotes());
        MedicalHistory updatedHistory = medicalHistoryRepository.save(medicalHistory);
        return toResponse(updatedHistory);
    }
}
