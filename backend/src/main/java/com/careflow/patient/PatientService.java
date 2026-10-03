
package com.careflow.patient;

import java.util.List;

import org.springframework.stereotype.Service;

import com.careflow.clinic.Clinic;
import com.careflow.clinic.ClinicNotFoundException;
import com.careflow.clinic.ClinicRepository;

import com.careflow.notification.RealtimeNotification;
import com.careflow.notification.RealtimeNotificationService;
import java.util.UUID;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final ClinicRepository clinicRepository;
    private final RealtimeNotificationService notificationService;

    public PatientService(PatientRepository patientRepository, ClinicRepository clinicRepository,
            RealtimeNotificationService notificationService) {
        this.patientRepository = patientRepository;
        this.clinicRepository = clinicRepository;
        this.notificationService = notificationService;
    }

    public PatientResponse toResponse(Patient patient) {
        PatientResponse response = new PatientResponse();

        response.setId(patient.getId());
        response.setClinicId(patient.getClinic().getId());
        response.setFirstName(patient.getFirstName());
        response.setLastName(patient.getLastName());
        response.setDateOfBirth(patient.getDateOfBirth());
        response.setCin(patient.getCin());
        response.setGender(patient.getGender());
        response.setAddress(patient.getAddress());
        response.setPhone(patient.getPhone());
        response.setEmail(patient.getEmail());
        response.setCreatedAt(patient.getCreatedAt());

        return response;
    }

    public PatientResponse createPatient(Long clinicId, PatientCreateRequest request) {

        Patient patient = new Patient();

        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new ClinicNotFoundException("Clinic not found"));

        patient.setClinic(clinic);
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setCin(request.getCin());
        patient.setGender(request.getGender());
        patient.setAddress(request.getAddress());
        patient.setPhone(request.getPhone());
        patient.setEmail(request.getEmail());

        Patient savedPatient = patientRepository.save(patient);

        try {
            notificationService.broadcast(clinicId, new RealtimeNotification(
                    UUID.randomUUID().toString(),
                    clinicId,
                    "PATIENT",
                    "Nouveau Patient Enregistré",
                    "Le dossier de " + savedPatient.getFirstName() + " " + savedPatient.getLastName() + " a été créé avec succès."
            ));
        } catch (Exception ignored) {}

        return toResponse(savedPatient);

    }

    public PatientResponse getPatientById(Long id, Long clinicId) {
        Patient patient = patientRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new PatientNotFoundException("Patient Not Found"));
        return toResponse(patient);
    }

    public List<PatientResponse> getAllPatients(Long clinicId) {
        List<Patient> patients = patientRepository.findAllByClinicId(clinicId);

        return patients.stream()
                .map(patient -> toResponse(patient))
                .toList();
    }

    public PatientResponse deletePatient(Long id, Long clinicId) {
        Patient patient = patientRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));
        patientRepository.delete(patient);
        return toResponse(patient);
    }

    public PatientResponse updatePatient(Long id, Long clinicId, PatientUpdateRequest request) {

        Patient existingPatient = patientRepository.findByIdAndClinicId(id, clinicId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));

        existingPatient.setFirstName(request.getFirstName());
        existingPatient.setLastName(request.getLastName());
        existingPatient.setDateOfBirth(request.getDateOfBirth());
        existingPatient.setCin(request.getCin());
        existingPatient.setGender(request.getGender());
        existingPatient.setAddress(request.getAddress());
        existingPatient.setPhone(request.getPhone());
        existingPatient.setEmail(request.getEmail());

        Patient updatedPatient = patientRepository.save(existingPatient);

        return toResponse(updatedPatient);
    }

}
