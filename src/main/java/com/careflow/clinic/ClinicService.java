package com.careflow.clinic;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class ClinicService {

    private final ClinicRepository clinicRepository;

    public ClinicService(ClinicRepository clinicRepository) {
        this.clinicRepository = clinicRepository;
    }

    private ClinicResponse toResponse(Clinic clinic) {
        ClinicResponse response = new ClinicResponse();

        response.setId(clinic.getId());
        response.setName(clinic.getName());
        response.setClinicType(clinic.getClinicType());
        response.setAddress(clinic.getAddress());
        response.setEmail(clinic.getEmail());
        response.setPhone(clinic.getPhone());
        response.setLogoUrl(clinic.getLogoUrl());
        response.setRegistrationNumber(clinic.getRegistrationNumber());
        response.setCreatedAt(clinic.getCreatedAt());

        return response;
    }

    public ClinicResponse createClinic(ClinicCreateRequest request) {

        Clinic clinic = new Clinic();

        clinic.setName(request.getName());
        clinic.setClinicType(request.getClinicType());
        clinic.setAddress(request.getAddress());
        clinic.setEmail(request.getEmail());
        clinic.setPhone(request.getPhone());
        clinic.setLogoUrl(request.getLogoUrl());
        clinic.setRegistrationNumber(request.getRegistrationNumber());

        Clinic savedClinic = clinicRepository.save(clinic);

        return toResponse(savedClinic);

    }

    public ClinicResponse getClinicById(Long id) {
        Clinic clinic = clinicRepository.findById(id).orElseThrow(() -> new RuntimeException("Clinic not found"));
        return toResponse(clinic);
    }

    public List<ClinicResponse> getAllClinics() {
        List<Clinic> clinics = clinicRepository.findAll();
        return clinics.stream().map(clinic -> toResponse(clinic)).toList();
    }

    public ClinicResponse deleteClinic(Long id) {
        Clinic clinic = clinicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
        clinicRepository.delete(clinic);
        return toResponse(clinic);
    }

    public ClinicResponse updateClinic(Long id, ClinicUpdateRequest request) {

        Clinic existingClinic = clinicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));

        existingClinic.setName(request.getName());
        existingClinic.setClinicType(request.getClinicType());
        existingClinic.setAddress(request.getAddress());
        existingClinic.setPhone(request.getPhone());
        existingClinic.setEmail(request.getEmail());
        existingClinic.setLogoUrl(request.getLogoUrl());
        existingClinic.setRegistrationNumber(request.getRegistrationNumber());

        Clinic updatedClinic = clinicRepository.save(existingClinic);

        return toResponse(updatedClinic);
    }

}
