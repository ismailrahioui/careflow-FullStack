package com.careflow.prescription;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clinics/{clinicId}/prescriptions")
@PreAuthorize("@tenantSecurity.hasClinicAccess(#clinicId)")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponse> createPrescription(
            @PathVariable Long clinicId,
            @Valid @RequestBody PrescriptionCreateRequest request) {
        return new ResponseEntity<>(prescriptionService.createPrescription(clinicId, request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<PrescriptionResponse> getPrescriptionById(
            @PathVariable Long clinicId,
            @PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id, clinicId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<PrescriptionResponse>> getAllPrescriptions(@PathVariable Long clinicId) {
        return ResponseEntity.ok(prescriptionService.getAllPrescriptions(clinicId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponse> updatePrescription(
            @PathVariable Long clinicId,
            @PathVariable Long id,
            @Valid @RequestBody PrescriptionUpdateRequest request) {
        return ResponseEntity.ok(prescriptionService.updatePrescription(id, clinicId, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionResponse> deletePrescription(
            @PathVariable Long clinicId,
            @PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.deletePrescription(id, clinicId));
    }

    @PostMapping("/{prescriptionId}/items")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionItemResponse> addPrescriptionItem(
            @PathVariable Long clinicId,
            @PathVariable Long prescriptionId,
            @Valid @RequestBody PrescriptionItemRequest request) {
        return new ResponseEntity<>(prescriptionService.addPrescriptionItem(prescriptionId, clinicId, request), HttpStatus.CREATED);
    }

    @GetMapping("/{prescriptionId}/items")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<PrescriptionItemResponse>> getPrescriptionItems(
            @PathVariable Long clinicId,
            @PathVariable Long prescriptionId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionItems(prescriptionId, clinicId));
    }

    @DeleteMapping("/{prescriptionId}/items/{itemId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionItemResponse> deletePrescriptionItem(
            @PathVariable Long clinicId,
            @PathVariable Long prescriptionId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(prescriptionService.deletePrescriptionItem(prescriptionId, itemId, clinicId));
    }

}
