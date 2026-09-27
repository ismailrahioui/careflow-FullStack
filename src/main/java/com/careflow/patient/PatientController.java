package com.careflow.patient;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clinics/{clinicId}/patients")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId) and hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST')")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getPatientById(@PathVariable Long clinicId, @PathVariable Long id) {
        PatientResponse patient = patientService.getPatientById(id, clinicId);
        return ResponseEntity.ok(patient);
    }

    @GetMapping
    public ResponseEntity<List<PatientResponse>> getAllPatients(@PathVariable Long clinicId) {
        List<PatientResponse> patients = patientService.getAllPatients(clinicId);
        return ResponseEntity.ok(patients);
    }

    @PostMapping
    public ResponseEntity<PatientResponse> createPatient(
            @PathVariable Long clinicId,
            @Valid @RequestBody PatientCreateRequest request) {

        PatientResponse savedPatient = patientService.createPatient(clinicId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedPatient);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientResponse> updatePatient(@PathVariable Long id,
            @PathVariable Long clinicId,
            @Valid @RequestBody PatientUpdateRequest request) {
        PatientResponse updatePatient = patientService.updatePatient(id, clinicId, request);
        return ResponseEntity.ok(updatePatient);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long clinicId, @PathVariable Long id) {
        patientService.deletePatient(id, clinicId);
        return ResponseEntity.noContent().build();
    }

}
