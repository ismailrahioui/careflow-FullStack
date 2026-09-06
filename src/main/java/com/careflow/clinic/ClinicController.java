package com.careflow.clinic;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clinics")
public class ClinicController {

    private final ClinicService clinicService;

    public ClinicController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClinicResponse> getClinicById(@PathVariable Long id) {
        ClinicResponse clinic = clinicService.getClinicById(id);
        return ResponseEntity.ok(clinic);
    }

    @GetMapping
    public ResponseEntity<List<ClinicResponse>> getAllClinics() {
        List<ClinicResponse> clinics = clinicService.getAllClinics();
        return ResponseEntity.ok(clinics);
    }

    @PostMapping
    public ResponseEntity<ClinicResponse> createClinic(@Valid @RequestBody ClinicCreateRequest request) {

        ClinicResponse savedclinic = clinicService.createClinic(request);
        return ResponseEntity.ok(savedclinic);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClinicResponse> updateClinic(@PathVariable Long id,
            @Valid @RequestBody ClinicUpdateRequest request) {
        ClinicResponse updateClinic = clinicService.updateClinic(id, request);
        return ResponseEntity.ok(updateClinic);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ClinicResponse> deleteClinic(@PathVariable Long id) {
        ClinicResponse deleteClinic = clinicService.deleteClinic(id);
        return ResponseEntity.ok(deleteClinic);
    }

}
