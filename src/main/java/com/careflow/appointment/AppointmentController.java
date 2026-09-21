package com.careflow.appointment;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clinics/{clinicId}/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable Long clinicId, @PathVariable Long id) {
        AppointmentResponse appointment = appointmentService.getAppointmentById(id, clinicId);
        return ResponseEntity.ok(appointment);
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments(@PathVariable Long clinicId) {
        List<AppointmentResponse> appointment = appointmentService.getAllAppointments(clinicId);
        return ResponseEntity.ok(appointment);
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @PathVariable Long clinicId,
            @Valid @RequestBody AppointmentCreateRequest request) {

        AppointmentResponse savedappointment = appointmentService.createAppointment(clinicId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedappointment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentResponse> updateAppointment(@PathVariable Long id,
            @PathVariable Long clinicId,
            @Valid @RequestBody AppointmentUpdateRequest request) {
        AppointmentResponse updateAppointment = appointmentService.updateAppointment(id, clinicId, request);
        return ResponseEntity.ok(updateAppointment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long clinicId, @PathVariable Long id) {
        appointmentService.deleteAppointment(id, clinicId);
        return ResponseEntity.noContent().build();
    }

}
