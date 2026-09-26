package com.careflow.consultation;

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
@RequestMapping("/api/clinics/{clinicId}/consultations")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId)")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConsultationResponse> getConsultationById(@PathVariable Long clinicId,
            @PathVariable Long id) {

        ConsultationResponse consultation = consultationService.getConsultationById(id, clinicId);
        return ResponseEntity.ok(consultation);
    }

    @GetMapping
    public ResponseEntity<List<ConsultationResponse>> getAllConsultatinos(@PathVariable Long clinicId) {
        List<ConsultationResponse> consultations = consultationService.getAllConsultations(clinicId);
        return ResponseEntity.ok(consultations);
    }

    @PostMapping
    public ResponseEntity<ConsultationResponse> createConsultation(
            @PathVariable Long clinicId,
            @Valid @RequestBody ConsultationCreateRequest request) {

        ConsultationResponse savedConsultation = consultationService.createConsultation(clinicId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedConsultation);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConsultationResponse> updateConsultation(@PathVariable Long id,
            @PathVariable Long clinicId,
            @Valid @RequestBody ConsultationUpdateRequest request) {
        ConsultationResponse updateConsultation = consultationService.updateConsultation(id, clinicId, request);
        return ResponseEntity.ok(updateConsultation);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConsultation(@PathVariable Long clinicId, @PathVariable Long id) {
        consultationService.deleteConsultation(id, clinicId);
        return ResponseEntity.noContent().build();
    }

}
