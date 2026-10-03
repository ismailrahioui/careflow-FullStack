package com.careflow.medicalrecord;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("api/clinics/{clinicId}/medical-histories")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId)")
public class MedicalHistoryController {
    private final MedicalHistoryService medicalHistoryService;

    public MedicalHistoryController(MedicalHistoryService medicalHistoryService) {
        this.medicalHistoryService = medicalHistoryService;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE', 'RECEPTIONIST')")
    public ResponseEntity<MedicalHistoryResponse> getMedicalHistoryById(@PathVariable Long clinicId,
            @PathVariable Long id) {
        MedicalHistoryResponse medicalHistory = medicalHistoryService.getMedicalHistoryById(clinicId, id);
        return ResponseEntity.ok(medicalHistory);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<MedicalHistoryResponse>> getAllByClinicId(@PathVariable Long clinicId) {
        List<MedicalHistoryResponse> medicalHistoryByClinic = medicalHistoryService.getAllByClinicId(clinicId);
        return ResponseEntity.ok(medicalHistoryByClinic);
    }

    @GetMapping("/patients/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<MedicalHistoryResponse>> getAllByPatientId(@PathVariable Long clinicId,  @PathVariable Long patientId) {
        List<MedicalHistoryResponse> medicalHistoryByPatient = medicalHistoryService.getAllByPatientId(clinicId,
                patientId);
        return ResponseEntity.ok(medicalHistoryByPatient);
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MedicalHistoryResponse> createConsultation(
            @PathVariable Long clinicId,
            @Valid @RequestBody MedicalHistoryCreateRequest request) {

        MedicalHistoryResponse savedMedicalHistory = medicalHistoryService.createMedicalHistory(clinicId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedMedicalHistory);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MedicalHistoryResponse> updateConsultation(@PathVariable Long clinicId, @PathVariable Long id,
            @Valid @RequestBody MedicalHistoryUpdateRequest request) {
        MedicalHistoryResponse updateMedicalHistory = medicalHistoryService.updateMedicalHistory(clinicId, id, request);
        return ResponseEntity.ok(updateMedicalHistory);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> deleteConsultation(@PathVariable Long id,
            @PathVariable Long clinicId) {
        medicalHistoryService.deleteMedicalHistory(id, clinicId);
        return ResponseEntity.noContent().build();
    }

}
